use thiserror::Error;

#[derive(Error, Debug)]
#[allow(dead_code)]
pub enum ZkpError {
    #[error("Noir command execution failed: {0}")]
    NoirCommandError(String),
    
    #[error("Proof generation failed: {0}")]
    ProofGenerationError(String),
    
    #[error("Key generation failed: {0}")]
    KeyGenerationError(String),
    
    #[error("State operation failed: {0}")]
    StateError(String),
    
    #[error("Decryption failed: {0}")]
    DecryptionError(String),
    
    #[error("Invalid input: {0}")]
    InvalidInput(String),
    
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    
    #[error("JSON serialization error: {0}")]
    JsonError(#[from] serde_json::Error),

    #[error("Git clone failed: {0}")]
    GitCloneError(String),
}

pub type ZkpResult<T> = Result<T, ZkpError>;

