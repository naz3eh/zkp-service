use serde::{Deserialize, Serialize};
use secp256k1::{Secp256k1, SecretKey as SecpSecretKey};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub enum ProofStatus {
    Pending,
    InProgress,
    Completed { proof: String },
    Failed { error: String },
}

#[derive(Debug, Clone)]
pub struct ProofTask {
    pub status: ProofStatus,
}

#[derive(Debug, Clone)]
pub struct QueuedProofTask {
    pub task_id: String,
    pub circuit_path: String,
    pub input: serde_json::Value,
    pub mock_mode: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[allow(dead_code)]
pub struct ProofRequest {
    pub circuit_path: String,
    pub input: serde_json::Value,
    pub mock: bool,
}

#[derive(Debug, Clone, Serialize)]
#[allow(dead_code)]
pub struct ProofResponse {
    pub task_id: String,
    pub status: String,
    pub proof: Option<String>,
    pub error: Option<String>,
}

#[allow(dead_code)]
pub struct ZkpService {
    pub secp: Arc<Secp256k1<secp256k1::All>>,
    pub secret_key: Arc<SecpSecretKey>,
    pub state: Arc<Mutex<HashMap<String, String>>>,
    pub active_proofs: Arc<Mutex<HashMap<String, ProofTask>>>,
    pub task_sender: mpsc::UnboundedSender<QueuedProofTask>,
    pub mock_mode: bool,
    pub tracked_directories: Arc<Mutex<HashMap<String, String>>>,
}

// API Request/Response types
#[derive(Debug, Serialize, Deserialize)]
pub struct PublicKeyResponse {
    pub public_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WriteStateRequest {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryStateResponse {
    pub value: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConsultXRequest {
    pub query: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConsultXResponse {
    pub result: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubmitXRequest {
    pub data: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubmitXResponse {
    pub submission_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DecryptInputRequest {
    pub encrypted_data: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DecryptInputResponse {
    pub decrypted: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitCloneRequest {
    pub gitrepo: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitCloneResponse {
    pub uuid: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteDirectoryRequest {
    pub dir_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrackedDirectoriesResponse {
    pub directories: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignMessageRequest {
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignMessageResponse {
    pub signature: String,
    pub public_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
}
