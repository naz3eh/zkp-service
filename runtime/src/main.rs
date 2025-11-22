mod errors;

use errors::{ZkpError, ZkpResult};
use rand::RngCore;
use secp256k1::{Secp256k1, SecretKey as SecpSecretKey};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::process::Command;
use tokio::sync::mpsc;
use uuid::Uuid;

impl ZkpService {
    pub fn new(mock_mode: bool) -> ZkpResult<Self> {
        let secp = Secp256k1::new();
        let mut rng = rand::thread_rng();
        let mut key_bytes = [0u8; 32];
        rng.fill_bytes(&mut key_bytes);
        let secret_key = SecpSecretKey::from_slice(&key_bytes)
            .map_err(|e| ZkpError::KeyGenerationError(format!("Failed to generate secret key: {}", e)))?;
        
        let (task_sender, task_receiver) = mpsc::unbounded_channel::<QueuedProofTask>();
        let active_proofs = Arc::new(Mutex::new(HashMap::<String, ProofTask>::new()));
        
        // Start worker pool - share receiver across workers using Arc<tokio::sync::Mutex<>>
        let num_workers = num_cpus::get();
        let active_proofs_clone = active_proofs.clone();
        let mock_mode_clone = mock_mode;
        let shared_receiver = Arc::new(tokio::sync::Mutex::new(task_receiver));
        
        for _ in 0..num_workers {
            let receiver = shared_receiver.clone();
            let proofs = active_proofs_clone.clone();
            let mock = mock_mode_clone;
            
            tokio::spawn(async move {
                loop {
                    let task = {
                        let mut recv_guard = receiver.lock().await;
                        recv_guard.recv().await
                    };
                    
                    let task = match task {
                        Some(task) => task,
                        None => break, // Channel closed
                    };
                    
                    // Update status to InProgress
                    {
                        let mut proofs = proofs.lock().unwrap();
                        if let Some(proof_task) = proofs.get_mut(&task.task_id) {
                            proof_task.status = ProofStatus::InProgress;
                        }
                    }
                    
                    // Process the proof
                    let result = if task.mock_mode || mock {
                        Self::generate_mock_proof(&task.task_id, &task.input).await
                    } else {
                        Self::generate_noir_proof(&task.circuit_path, &task.input).await
                    };
                    
                    // Update status based on result
                    {
                        let mut proofs = proofs.lock().unwrap();
                        if let Some(proof_task) = proofs.get_mut(&task.task_id) {
                            match result {
                                Ok(proof) => {
                                    proof_task.status = ProofStatus::Completed { proof };
                                }
                                Err(e) => {
                                    proof_task.status = ProofStatus::Failed {
                                        error: e.to_string(),
                                    };
                                }
                            }
                        }
                    }
                }
            });
        }
        
        Ok(Self {
            secp: Arc::new(secp),
            secret_key: Arc::new(secret_key),
            state: Arc::new(Mutex::new(HashMap::new())),
            active_proofs,
            task_sender,
            mock_mode,
            tracked_directories: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    pub fn get_public_key(&self) -> ZkpResult<String> {
        let public_key = secp256k1::PublicKey::from_secret_key(&self.secp, &self.secret_key);
        let serialized = public_key.serialize_uncompressed();
        Ok(format!("0x{}", hex::encode(&serialized)))
    }

    pub async fn execute_zkp(&self, request: ProofRequest) -> ZkpResult<ProofResponse> {
        let task_id = format!("proof_{}", uuid::Uuid::new_v4().to_string().replace("-", ""));
        
        // Register task as pending
        {
            let mut proofs = self.active_proofs.lock().unwrap();
            proofs.insert(
                task_id.clone(),
                ProofTask {
                    status: ProofStatus::Pending,
                },
            );
        }

        // Enqueue task for processing
        let queued_task = QueuedProofTask {
            task_id: task_id.clone(),
            circuit_path: request.circuit_path.clone(),
            input: request.input.clone(),
            mock_mode: self.mock_mode || request.mock,
        };

        self.task_sender
            .send(queued_task)
            .map_err(|e| ZkpError::StateError(format!("Failed to enqueue task: {}", e)))?;

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

    //Here will have the logic to submit the data to the blockchain and verify the data
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

    pub async fn git_clone(&self, gitrepo: &str) -> ZkpResult<String> {
        let base_dir = Uuid::new_v4();
        let uuid_string = base_dir.to_string();
        let dir_path = format!("/zkservice/dir/{}", base_dir);
        
        std::fs::create_dir_all(&dir_path)
            .map_err(|e| ZkpError::GitCloneError(format!("Failed to create directory: {}", e)))?;
        
        let write_dir = Command::new("git")
            .arg("clone")
            .arg(gitrepo)
            .arg(&dir_path)
            .output()
            .await?;
        
        if !write_dir.status.success() {
            return Err(ZkpError::GitCloneError(format!(
                "Failed to clone repository: {}",
                String::from_utf8_lossy(&write_dir.stderr)
            )));
        }
        
        {
            let mut dirs = self.tracked_directories.lock().unwrap();
            dirs.insert(uuid_string.clone(), dir_path);
        }
        
        Ok(uuid_string)
    }

    pub async fn delete_directory_by_uuid(&self, uuid: &str) -> ZkpResult<()> {
        let dir_path = {
            let dirs = self.tracked_directories.lock().unwrap();
            dirs.get(uuid)
                .ok_or_else(|| {
                    ZkpError::InvalidInput(format!("UUID not found in tracked directories: {}", uuid))
                })?
                .clone()
        };

        let path = std::path::Path::new(&dir_path);
        
        if !path.exists() {
            let mut dirs = self.tracked_directories.lock().unwrap();
            dirs.remove(uuid);
            return Err(ZkpError::IoError(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                format!("Directory not found: {}", dir_path),
            )));
        }

        if !path.is_dir() {
            return Err(ZkpError::IoError(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                format!("Path is not a directory: {}", dir_path),
            )));
        }

        tokio::fs::remove_dir_all(path)
            .await
            .map_err(|e| {
                ZkpError::IoError(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("Failed to delete directory {}: {}", dir_path, e),
                ))
            })?;

        {
            let mut dirs = self.tracked_directories.lock().unwrap();
            dirs.remove(uuid);
        }

        Ok(())
    }

    pub async fn delete_directory(&self, dir_path: &str) -> ZkpResult<()> {
        let path = std::path::Path::new(dir_path);
        
        if !path.exists() {
            return Err(ZkpError::IoError(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                format!("Directory not found: {}", dir_path),
            )));
        }

        if !path.is_dir() {
            return Err(ZkpError::IoError(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                format!("Path is not a directory: {}", dir_path),
            )));
        }

        tokio::fs::remove_dir_all(path)
            .await
            .map_err(|e| {
                ZkpError::IoError(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("Failed to delete directory {}: {}", dir_path, e),
                ))
            })?;

        {
            let mut dirs = self.tracked_directories.lock().unwrap();
            dirs.retain(|_, v| v != dir_path);
        }

        Ok(())
    }

    pub fn list_tracked_directories(&self) -> Vec<String> {
        let dirs = self.tracked_directories.lock().unwrap();
        dirs.keys().cloned().collect()
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
