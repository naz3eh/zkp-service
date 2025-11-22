mod errors;

use errors::{ZkpError, ZkpResult};
use rand::RngCore;
use secp256k1::{Secp256k1, SecretKey as SecpSecretKey};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::process::Command;

pub struct ZkpService {
    secp: Arc<Secp256k1<secp256k1::All>>,
    secret_key: Arc<SecpSecretKey>,
    state: Arc<Mutex<HashMap<String, String>>>,
    active_proofs: Arc<Mutex<HashMap<String, ProofTask>>>,
    mock_mode: bool,
}

struct ProofTask {
    status: ProofStatus,
}

#[derive(Clone, Serialize, Deserialize)]
pub enum ProofStatus {
    Pending,
    InProgress,
    Completed { proof: String },
    Failed { error: String },
}

#[derive(Serialize, Deserialize)]
pub struct ProofRequest {
    circuit_path: String,
    input: serde_json::Value,
    #[serde(default)]
    mock: bool,
}

#[derive(Serialize, Deserialize)]
pub struct ProofResponse {
    task_id: String,
    status: String,
    proof: Option<String>,
    error: Option<String>,
}

impl ZkpService {
    pub fn new(mock_mode: bool) -> ZkpResult<Self> {
        let secp = Secp256k1::new();
        let mut rng = rand::thread_rng();
        let mut key_bytes = [0u8; 32];
        rng.fill_bytes(&mut key_bytes);
        let secret_key = SecpSecretKey::from_slice(&key_bytes)
            .map_err(|e| ZkpError::KeyGenerationError(format!("Failed to generate secret key: {}", e)))?;
        
        Ok(Self {
            secp: Arc::new(secp),
            secret_key: Arc::new(secret_key),
            state: Arc::new(Mutex::new(HashMap::new())),
            active_proofs: Arc::new(Mutex::new(HashMap::new())),
            mock_mode,
        })
    }

    pub fn get_public_key(&self) -> ZkpResult<String> {
        let public_key = secp256k1::PublicKey::from_secret_key(&self.secp, &self.secret_key);
        let serialized = public_key.serialize_uncompressed();
        Ok(format!("0x{}", hex::encode(&serialized)))
    }

    pub async fn execute_zkp(&self, request: ProofRequest) -> ZkpResult<ProofResponse> {
        let task_id = format!("proof_{}", uuid::Uuid::new_v4().to_string().replace("-", ""));
        
        {
            let mut proofs = self.active_proofs.lock().unwrap();
            proofs.insert(
                task_id.clone(),
                ProofTask {
                    status: ProofStatus::Pending,
                },
            );
        }

        let active_proofs = self.active_proofs.clone();
        let mock_mode = self.mock_mode || request.mock;
        let circuit_path = request.circuit_path.clone();
        let input = request.input.clone();
        let task_id_clone = task_id.clone();

        tokio::spawn(async move {
            {
                let mut proofs = active_proofs.lock().unwrap();
                if let Some(task) = proofs.get_mut(&task_id_clone) {
                    task.status = ProofStatus::InProgress;
                }
            }

            let result = if mock_mode {
                Self::generate_mock_proof(&task_id_clone, &input).await
            } else {
                Self::generate_noir_proof(&circuit_path, &input).await
            };

            {
                let mut proofs = active_proofs.lock().unwrap();
                if let Some(task) = proofs.get_mut(&task_id_clone) {
                    match result {
                        Ok(proof) => {
                            task.status = ProofStatus::Completed { proof };
                        }
                        Err(e) => {
                            task.status = ProofStatus::Failed {
                                error: e.to_string(),
                            };
                        }
                    }
                }
            }
        });

        Ok(ProofResponse {
            task_id: task_id.clone(),
            status: "pending".to_string(),
            proof: None,
            error: None,
        })
    }

    async fn generate_noir_proof(circuit_path: &str, input: &serde_json::Value) -> ZkpResult<String> {
        let input_str = serde_json::to_string(input)?;
        let proof_path = format!("{}.proof", circuit_path);
        
        let output = Command::new("nargo")
            .arg("prove")
            .arg("--proof-path")
            .arg(&proof_path)
            .arg("--witness")
            .arg(format!("{}.witness", circuit_path))
            .arg("--program")
            .arg(circuit_path)
            .arg("--input")
            .arg(&input_str)
            .output()
            .await
            .map_err(|e| ZkpError::NoirCommandError(format!("Failed to execute nargo: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(ZkpError::ProofGenerationError(format!(
                "Noir proof generation failed: {}",
                stderr
            )));
        }

        let proof = std::fs::read_to_string(&proof_path)
            .map_err(|e| ZkpError::ProofGenerationError(format!("Failed to read proof file: {}", e)))?;

        Ok(proof)
    }

    async fn generate_mock_proof(task_id: &str, input: &serde_json::Value) -> ZkpResult<String> {
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        
        let mock_proof = serde_json::json!({
            "task_id": task_id,
            "input": input,
            "proof": format!("mock_proof_{}", task_id),
            "timestamp": chrono::Utc::now().to_rfc3339(),
        });

        Ok(serde_json::to_string(&mock_proof)?)
    }

    pub fn retrieve_output(&self, task_id: &str) -> ZkpResult<ProofResponse> {
        let proofs = self.active_proofs.lock().unwrap();
        let task = proofs
            .get(task_id)
            .ok_or_else(|| ZkpError::InvalidInput(format!("Task {} not found", task_id)))?;

        let (status, proof, error) = match &task.status {
            ProofStatus::Pending => ("pending".to_string(), None, None),
            ProofStatus::InProgress => ("in_progress".to_string(), None, None),
            ProofStatus::Completed { proof } => ("completed".to_string(), Some(proof.clone()), None),
            ProofStatus::Failed { error } => ("failed".to_string(), None, Some(error.clone())),
        };

        Ok(ProofResponse {
            task_id: task_id.to_string(),
            status,
            proof,
            error,
        })
    }

    pub fn write_state(&self, key: String, value: String) -> ZkpResult<()> {
        let mut state = self.state.lock().unwrap();
        state.insert(key, value);
        Ok(())
    }

    pub fn query_state(&self, key: &str) -> ZkpResult<Option<String>> {
        let state = self.state.lock().unwrap();
        Ok(state.get(key).cloned())
    }

    pub fn consult_x(&self, query: &str) -> ZkpResult<String> {
        Ok(format!("Consult result for: {}", query))
    }

    pub fn submit_x(&self, data: &str) -> ZkpResult<String> {
        let submission_id = format!("sub_{}", uuid::Uuid::new_v4().to_string().replace("-", ""));
        self.write_state(submission_id.clone(), data.to_string())?;
        Ok(submission_id)
    }

    pub fn decrypt_input(&self, encrypted_data: &str) -> ZkpResult<String> {
        let decoded = hex::decode(encrypted_data.trim_start_matches("0x"))
            .map_err(|e| ZkpError::DecryptionError(format!("Failed to decode hex: {}", e)))?;
        Ok(hex::encode(&decoded))
    }
}

#[tokio::main]
async fn main() -> ZkpResult<()> {
    let mock_mode = std::env::var("MOCK_MODE").unwrap_or_else(|_| "false".to_string()) == "true";
    let service = Arc::new(ZkpService::new(mock_mode)?);
    
    let public_key = service.get_public_key()?;
    println!("Public Key: {}", public_key);

    tokio::signal::ctrl_c().await.map_err(|e| ZkpError::IoError(e))?;
    Ok(())
}
