// commands/mod.rs — Tauri command handlers

pub mod providers;
pub mod sessions;
pub mod messages;
pub mod settings;

use tauri::State;
use sqlx::SqlitePool;
use crate::db::repository::*;
use crate::llm::client::create_client;
use crate::llm::types::ProviderConfig;
use crate::errors::AppError;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProviderDTO {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub endpoint: String,
    pub api_key: Option<String>,
    pub default_model: String,
    pub timeout: u64,
    pub headers: Option<serde_json::Value>,
    pub created_at: i64,
    pub updated_at: i64,
}

impl From<crate::db::models::ProviderRow> for ProviderDTO {
    fn from(row: crate::db::models::ProviderRow) -> Self {
        Self {
            id: row.id,
            name: row.name,
            r#type: row.r#type,
            endpoint: row.endpoint,
            api_key: row.api_key,
            default_model: row.default_model,
            timeout: row.timeout as u64,
            headers: row.headers_parsed().ok().flatten(),
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateProviderRequest {
    pub name: String,
    pub r#type: String,
    pub endpoint: String,
    pub api_key: Option<String>,
    pub default_model: String,
    pub timeout: Option<u64>,
    pub headers: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProviderRequest {
    pub name: Option<String>,
    pub endpoint: Option<String>,
    pub api_key: Option<String>,
    pub default_model: Option<String>,
    pub timeout: Option<u64>,
    pub headers: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct TestConnectionResult {
    pub success: bool,
    pub models: Option<Vec<String>>,
    pub error: Option<String>,
}