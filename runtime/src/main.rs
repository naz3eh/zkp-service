mod errors;
mod service;
mod types;

use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::Json,
    routing::{delete, get, post},
    Router,
};
use std::sync::Arc;
use tower_http::cors::CorsLayer;

use service::ZkpService;
use types::{
    ConsultXRequest, ConsultXResponse, DecryptInputRequest, DecryptInputResponse,
    DeleteDirectoryRequest, ErrorResponse, GitCloneRequest, GitCloneResponse,
    PaidResourceResponse, PaymentProof, PaymentRequiredResponse, PublicKeyResponse, 
    ProofRequest, ProofResponse, QueryStateResponse,
    SignMessageRequest, SignMessageResponse, SubmitXRequest, SubmitXResponse,
    TrackedDirectoriesResponse, VerifyPaymentResponse, WriteStateRequest,
};

// Shared application state
#[derive(Clone)]
struct AppState {
    service: Arc<ZkpService>,
}

// API Handlers
async fn health_check(State(state): State<AppState>) -> Result<Json<serde_json::Value>, (StatusCode, Json<ErrorResponse>)> {
    // Verify service is actually functional by checking if we can get the public key
    match state.service.get_public_key() {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "healthy",
            "service": "zkp-service",
            "timestamp": chrono::Utc::now().to_rfc3339()
        }))),
        Err(e) => Err((
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse { error: format!("Service unhealthy: {}", e) })
        ))
    }
}

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

async fn sign_message(
    State(state): State<AppState>,
    Json(request): Json<SignMessageRequest>,
) -> Result<Json<SignMessageResponse>, (StatusCode, Json<ErrorResponse>)> {
    let signature = state.service.sign_message(&request.message)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() })))?;
    let public_key = state.service.get_public_key()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: e.to_string() })))?;
    Ok(Json(SignMessageResponse { signature, public_key }))
}

async fn paid_resource(
    headers: HeaderMap,
) -> Result<Json<PaidResourceResponse>, (StatusCode, Json<PaymentRequiredResponse>)> {
    // Get configuration from environment variables
    let facilitator_url = std::env::var("FACILITATOR_URL")
        .unwrap_or_else(|_| "https://zkp-service-facilitator.vercel.app".to_string());
    let required_amount = std::env::var("REQUIRED_AMOUNT")
        .unwrap_or_else(|_| "1000000000000000".to_string()); // 0.001 ETH in wei
    let merchant_address = std::env::var("MERCHANT_ADDRESS")
        .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string());

    // 1. Extract payment proof from request header
    let payment_proof_header = headers.get("x-payment");
    
    if payment_proof_header.is_none() {
        // Return 402 Payment Required
        return Err((
            StatusCode::PAYMENT_REQUIRED,
            Json(PaymentRequiredResponse {
                error: "Payment Required".to_string(),
                amount: required_amount.clone(),
                recipient: merchant_address.clone(),
                currency: Some("ETH".to_string()),
                network: Some("sepolia".to_string()),
            }),
        ));
    }

    // 2. Parse payment proof from header
    let payment_proof_str = payment_proof_header.unwrap()
        .to_str()
        .map_err(|_| {
            (
                StatusCode::BAD_REQUEST,
                Json(PaymentRequiredResponse {
                    error: "Invalid payment header".to_string(),
                    amount: required_amount.clone(),
                    recipient: merchant_address.clone(),
                    currency: Some("ETH".to_string()),
                    network: Some("sepolia".to_string()),
                }),
            )
        })?;

    let payment_proof: PaymentProof = serde_json::from_str(payment_proof_str)
        .map_err(|_| {
            (
                StatusCode::BAD_REQUEST,
                Json(PaymentRequiredResponse {
                    error: "Invalid payment proof format".to_string(),
                    amount: required_amount.clone(),
                    recipient: merchant_address.clone(),
                    currency: Some("ETH".to_string()),
                    network: Some("sepolia".to_string()),
                }),
            )
        })?;

    // 3. Verify payment with facilitator
    // Note: serde will automatically convert snake_case to camelCase due to rename_all
    let verify_request = serde_json::json!({
        "paymentProof": payment_proof,
        "requiredAmount": required_amount,
        "requiredRecipient": merchant_address,
    });

    let client = reqwest::Client::new();
    let verify_url = format!("{}/api/facilitator/verify", facilitator_url);
    
    let response = client
        .post(&verify_url)
        .json(&verify_request)
        .send()
        .await
        .map_err(|e| {
            eprintln!("Payment verification request failed: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(PaymentRequiredResponse {
                    error: format!("Verification failed: {}", e),
                    amount: required_amount.clone(),
                    recipient: merchant_address.clone(),
                    currency: Some("ETH".to_string()),
                    network: Some("sepolia".to_string()),
                }),
            )
        })?;

    let verify_result: VerifyPaymentResponse = response
        .json()
        .await
        .map_err(|e| {
            eprintln!("Failed to parse verification response: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(PaymentRequiredResponse {
                    error: "Failed to parse verification response".to_string(),
                    amount: required_amount.clone(),
                    recipient: merchant_address.clone(),
                    currency: Some("ETH".to_string()),
                    network: Some("sepolia".to_string()),
                }),
            )
        })?;

    if !verify_result.valid {
        return Err((
            StatusCode::PAYMENT_REQUIRED,
            Json(PaymentRequiredResponse {
                error: format!("Invalid payment: {}", verify_result.error.unwrap_or_else(|| "Unknown error".to_string())),
                amount: required_amount.clone(),
                recipient: merchant_address.clone(),
                currency: Some("ETH".to_string()),
                network: Some("sepolia".to_string()),
            }),
        ));
    }

    // 4. Payment verified! Process the request
    println!("Payment verified: {:?}", verify_result.payment_id);
    if let Some(tx_hash) = &verify_result.settlement_tx_hash {
        println!("Settlement TX: {}", tx_hash);
    }

    // Your business logic here
    Ok(Json(PaidResourceResponse {
        success: true,
        data: "Your protected resource".to_string(),
        payment_id: verify_result.payment_id,
    }))
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
        .route("/health", get(health_check))
        .route("/public-key", get(get_public_key))
        .route("/sign-message", post(sign_message))
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
        .route("/api/paid/resource", post(paid_resource))
        .layer(CorsLayer::permissive())
        .with_state(app_state);
    
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    println!("Server listening on http://0.0.0.0:3000");
    println!("API Endpoints:");
    println!("   GET  /health");
    println!("   GET  /public-key");
    println!("   POST /sign-message");
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
    println!("   POST /api/paid/resource");
    
    axum::serve(listener, app).await?;
    
    Ok(())
}
