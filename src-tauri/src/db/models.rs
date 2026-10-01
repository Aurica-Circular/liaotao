// db/models.rs — Database models matching the schema

use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProviderRow {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub endpoint: String,
    pub api_key: Option<String>,
    pub default_model: String,
    pub timeout: i64,
    pub headers: Option<String>, // JSON string
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SessionRow {
    pub id: String,
    pub title: String,
    pub provider_id: String,
    pub model: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub message_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MessageRow {
    pub id: String,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub model: Option<String>,
    pub provider_id: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SettingRow {
    pub key: String,
    pub value: String,
    pub updated_at: i64,
}

impl ProviderRow {
    pub fn headers_parsed(&self) -> Result<Option<serde_json::Value>, serde_json::Error> {
        self.headers.as_ref().map(|h| serde_json::from_str(h)).transpose()
    }
}

impl SessionRow {
    pub fn created_datetime(&self) -> DateTime<Utc> {
        DateTime::from_timestamp(self.created_at, 0).unwrap_or_default()
    }

    pub fn updated_datetime(&self) -> DateTime<Utc> {
        DateTime::from_timestamp(self.updated_at, 0).unwrap_or_default()
    }
}

impl MessageRow {
    pub fn created_datetime(&self) -> DateTime<Utc> {
        DateTime::from_timestamp(self.created_at, 0).unwrap_or_default()
    }
}