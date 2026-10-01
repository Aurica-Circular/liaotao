// commands/messages.rs — Message management commands

use tauri::State;
use sqlx::SqlitePool;
use crate::db::repository::{MessageRepo, new_id};
use crate::db::models::MessageRow;
use crate::errors::AppError;
use serde::{Deserialize, Serialize};
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageDTO {
    pub id: String,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub model: Option<String>,
    pub provider_id: Option<String>,
    pub created_at: i64,
}

impl From<MessageRow> for MessageDTO {
    fn from(row: MessageRow) -> Self {
        Self {
            id: row.id,
            session_id: row.session_id,
            role: row.role,
            content: row.content,
            model: row.model,
            provider_id: row.provider_id,
            created_at: row.created_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct SaveMessageRequest {
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub model: Option<String>,
    pub provider_id: Option<String>,
}

#[tauri::command]
pub async fn get_messages(
    pool: State<'_, SqlitePool>,
    session_id: String,
) -> Result<Vec<MessageDTO>, String> {
    let messages = MessageRepo::get_by_session(&pool, &session_id).await?;
    Ok(messages.into_iter().map(Into::into).collect())
}

#[tauri::command]
pub async fn save_message(
    pool: State<'_, SqlitePool>,
    request: SaveMessageRequest,
) -> Result<MessageDTO, String> {
    let now = Utc::now().timestamp();
    let message = MessageRow {
        id: new_id("msg"),
        session_id: request.session_id,
        role: request.role,
        content: request.content,
        model: request.model,
        provider_id: request.provider_id,
        created_at: now,
    };

    MessageRepo::create(&pool, &message).await?;
    Ok(message.into())
}

#[tauri::command]
pub async fn delete_message(pool: State<'_, SqlitePool>, id: String) -> Result<(), String> {
    MessageRepo::delete(&pool, &id).await?;
    Ok(())
}

#[tauri::command]
pub async fn clear_session_messages(
    pool: State<'_, SqlitePool>,
    session_id: String,
) -> Result<(), String> {
    MessageRepo::clear_session(&pool, &session_id).await?;
    Ok(())
}