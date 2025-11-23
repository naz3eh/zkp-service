mod errors;
mod service;
mod types;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{delete, get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower_http::cors::CorsLayer;

use service::ZkpService;
use types::{ProofRequest, ProofResponse};

// Shared application state
#[derive(Clone)]
struct AppState {
    service: Arc<ZkpService>,
}

// Request/Response types for API
#[derive(Debug, Serialize, Deserialize)]
struct PublicKeyResponse {
    public_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct WriteStateRequest {
    key: String,
    value: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct QueryStateResponse {
    value: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ConsultXRequest {
    query: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ConsultXResponse {
    result: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct SubmitXRequest {
    data: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct SubmitXResponse {
    submission_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct DecryptInputRequest {
    encrypted_data: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct DecryptInputResponse {
    decrypted: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct GitCloneRequest {
    gitrepo: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct GitCloneResponse {
    uuid: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct DeleteDirectoryRequest {
    dir_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct TrackedDirectoriesResponse {
    directories: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ErrorResponse {
    error: String,
}

// API Handlers
async fn get_public_key(State(state): State<AppState>) -> Result<Json<PublicKeyResponse>, (StatusCode, Json<ErrorResponse>)> {
    let public_key = state.service.get_public_key()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() })))?;
    Ok(Json(PublicKeyResponse { public_key }))
}

async fn execute_zkp(
    State(state): State<AppState>,
    Json(request): Json<ProofRequest>,
) -> Result<Json<ProofResponse>, (StatusCode, Json<ErrorResponse>)> {
    let response = state.service.execute_zkp(request).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() })))?;
    Ok(Json(response))
}

async fn retrieve_output(
    State(state): State<AppState>,
    Path(task_id): Path<String>,
) -> Result<Json<ProofResponse>, (StatusCode, Json<ErrorResponse>)> {
    let response = state.service.retrieve_output(&task_id)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() })))?;
    Ok(Json(response))
}

async fn write_state(
    State(state): State<AppState>,
    Json(request): Json<WriteStateRequest>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    state.service.write_state(request.key, request.value)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() })))?;
    Ok(StatusCode::OK)
}

async fn query_state(
    State(state): State<AppState>,
    Path(key): Path<String>,
) -> Result<Json<QueryStateResponse>, (StatusCode, Json<ErrorResponse>)> {
    let value = state.service.query_state(&key)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() })))?;
    Ok(Json(QueryStateResponse { value }))
}

async fn consult_x(
    State(state): State<AppState>,
    Json(request): Json<ConsultXRequest>,
) -> Result<Json<ConsultXResponse>, (StatusCode, Json<ErrorResponse>)> {
    let result = state.service.consult_x(&request.query)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() })))?;
    Ok(Json(ConsultXResponse { result }))
}

async fn submit_x(
    State(state): State<AppState>,
    Json(request): Json<SubmitXRequest>,
) -> Result<Json<SubmitXResponse>, (StatusCode, Json<ErrorResponse>)> {
    let submission_id = state.service.submit_x(&request.data)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() })))?;
    Ok(Json(SubmitXResponse { submission_id }))
}

async fn decrypt_input(
    State(state): State<AppState>,
    Json(request): Json<DecryptInputRequest>,
) -> Result<Json<DecryptInputResponse>, (StatusCode, Json<ErrorResponse>)> {
    let decrypted = state.service.decrypt_input(&request.encrypted_data)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() })))?;
    Ok(Json(DecryptInputResponse { decrypted }))
}

async fn git_clone(
    State(state): State<AppState>,
    Json(request): Json<GitCloneRequest>,
) -> Result<Json<GitCloneResponse>, (StatusCode, Json<ErrorResponse>)> {
    let uuid = state.service.git_clone(&request.gitrepo).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() })))?;
    Ok(Json(GitCloneResponse { uuid }))
}

async fn delete_directory_by_uuid(
    State(state): State<AppState>,
    Path(uuid): Path<String>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    state.service.delete_directory_by_uuid(&uuid).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() })))?;
    Ok(StatusCode::OK)
}

async fn delete_directory(
    State(state): State<AppState>,
    Json(request): Json<DeleteDirectoryRequest>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    state.service.delete_directory(&request.dir_path).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() })))?;
    Ok(StatusCode::OK)
}

async fn list_tracked_directories(
    State(state): State<AppState>,
) -> Result<Json<TrackedDirectoriesResponse>, (StatusCode, Json<ErrorResponse>)> {
    let directories = state.service.list_tracked_directories();
    Ok(Json(TrackedDirectoriesResponse { directories }))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mock_mode = std::env::var("MOCK_MODE").unwrap_or_else(|_| "false".to_string()) == "true";
    let service = Arc::new(ZkpService::new(mock_mode)?);
    
    let public_key = service.get_public_key()?;
    println!("ZKP Service starting...");
    println!("Public Key: {}", public_key);
    println!("Mock Mode: {}", mock_mode);
    
    let app_state = AppState { service };
    
    let app = Router::new()
        .route("/public-key", get(get_public_key))
        .route("/execute-zkp", post(execute_zkp))
        .route("/retrieve-output/:task_id", get(retrieve_output))
        .route("/write-state", post(write_state))
        .route("/query-state/:key", get(query_state))
        .route("/consult-x", post(consult_x))
        .route("/submit-x", post(submit_x))
        .route("/decrypt-input", post(decrypt_input))
        .route("/git-clone", post(git_clone))
        .route("/directory/:uuid", delete(delete_directory_by_uuid))
        .route("/directory", delete(delete_directory))
        .route("/tracked-directories", get(list_tracked_directories))
        .layer(CorsLayer::permissive())
        .with_state(app_state);
    
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    println!("Server listening on http://0.0.0.0:3000");
    println!("API Endpoints:");
    println!("   GET  /public-key");
    println!("   POST /execute-zkp");
    println!("   GET  /retrieve-output/:task_id");
    println!("   POST /write-state");
    println!("   GET  /query-state/:key");
    println!("   POST /consult-x");
    println!("   POST /submit-x");
    println!("   POST /decrypt-input");
    println!("   POST /git-clone");
    println!("   DELETE /directory/:uuid");
    println!("   DELETE /directory");
    println!("   GET  /tracked-directories");
    
    axum::serve(listener, app).await?;
    
    Ok(())
}
