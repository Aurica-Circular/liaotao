// commands/providers.rs — Provider management commands

use tauri::State;
use sqlx::SqlitePool;
use crate::db::repository::{ProviderRepo, new_id};
use crate::llm::client::create_client;
use crate::commands::{ProviderDTO, CreateProviderRequest, UpdateProviderRequest, TestConnectionResult};
use crate::llm::types::{ProviderConfig, ProviderType};
use crate::errors::AppError;
use serde_json::json;
use chrono::Utc;

#[tauri::command]
pub async fn get_providers(pool: State<'_, SqlitePool>) -> Result<Vec<ProviderDTO>, String> {
    let providers = ProviderRepo::get_all(&pool).await?;
    Ok(providers.into_iter().map(Into::into).collect())
}

#[tauri::command]
pub async fn save_provider(
    pool: State<'_, SqlitePool>,
    request: CreateProviderRequest,
) -> Result<ProviderDTO, String> {
    let now = Utc::now().timestamp();
    let provider_type = match request.r#type.as_str() {
        "openai" => ProviderType::OpenAI,
        "ollama" => ProviderType::Ollama,
        "llamacpp" => ProviderType::LlamaCpp,
        _ => return Err("Invalid provider type".to_string()),
    };

    let provider = ProviderConfig {
        id: new_id("provider"),
        name: request.name,
        r#type: provider_type,
        endpoint: request.endpoint,
        api_key: request.api_key,
        default_model: request.default_model,
        timeout: request.timeout.unwrap_or(120000),
        headers: request.headers.and_then(|v| v.as_object().map(|m| {
            m.iter().map(|(k, v)| (k.clone(), v.as_str().unwrap_or("").to_string())).collect()
        })),
    };

    let row = crate::db::models::ProviderRow {
        id: provider.id.clone(),
        name: provider.name.clone(),
        r#type: provider.r#type.to_string(),
        endpoint: provider.endpoint.clone(),
        api_key: provider.api_key.clone(),
        default_model: provider.default_model.clone(),
        timeout: provider.timeout as i64,
        headers: provider.headers.as_ref().map(|h| json!(h).to_string()),
        created_at: now,
        updated_at: now,
    };

    ProviderRepo::create(&pool, &row).await?;
    Ok(row.into())
}

#[tauri::command]
pub async fn update_provider(
    pool: State<'_, SqlitePool>,
    id: String,
    request: UpdateProviderRequest,
) -> Result<ProviderDTO, String> {
    let mut provider = ProviderRepo::get_by_id(&pool, &id).await?
        .ok_or_else(|| "Provider not found".to_string())?;

    if let Some(name) = request.name { provider.name = name; }
    if let Some(endpoint) = request.endpoint { provider.endpoint = endpoint; }
    if let Some(api_key) = request.api_key { provider.api_key = Some(api_key); }
    if let Some(default_model) = request.default_model { provider.default_model = default_model; }
    if let Some(timeout) = request.timeout { provider.timeout = timeout as i64; }
    if let Some(headers) = request.headers {
        provider.headers = Some(headers.to_string());
    }
    provider.updated_at = Utc::now().timestamp();

    ProviderRepo::update(&pool, &provider).await?;
    Ok(provider.into())
}

#[tauri::command]
pub async fn delete_provider(pool: State<'_, SqlitePool>, id: String) -> Result<(), String> {
    ProviderRepo::delete(&pool, &id).await?;
    Ok(())
}

#[tauri::command]
pub async fn test_provider_connection(
    request: CreateProviderRequest,
) -> Result<TestConnectionResult, String> {
    let provider_type = match request.r#type.as_str() {
        "openai" => ProviderType::OpenAI,
        "ollama" => ProviderType::Ollama,
        "llamacpp" => ProviderType::LlamaCpp,
        _ => return Err("Invalid provider type".to_string()),
    };

    let config = ProviderConfig {
        id: "test".to_string(),
        name: request.name,
        r#type: provider_type,
        endpoint: request.endpoint,
        api_key: request.api_key,
        default_model: request.default_model,
        timeout: request.timeout.unwrap_or(120000),
        headers: request.headers.and_then(|v| v.as_object().map(|m| {
            m.iter().map(|(k, v)| (k.clone(), v.as_str().unwrap_or("").to_string())).collect()
        })),
    };

    match create_client(config) {
        Ok(client) => {
            match client.test_connection().await {
                Ok(true) => {
                    let models = client.list_models().await.unwrap_or_default();
                    Ok(TestConnectionResult {
                        success: true,
                        models: Some(models),
                        error: None,
                    })
                }
                Ok(false) => Ok(TestConnectionResult {
                    success: false,
                    models: None,
                    error: Some("Connection test failed".to_string()),
                }),
                Err(e) => Ok(TestConnectionResult {
                    success: false,
                    models: None,
                    error: Some(e.to_string()),
                }),
            }
        }
        Err(e) => Ok(TestConnectionResult {
            success: false,
            models: None,
            error: Some(e.to_string()),
        }),
    }
}