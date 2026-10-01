// commands/sessions.rs — Session management commands

use tauri::State;
use sqlx::SqlitePool;
use crate::db::repository::{SessionRepo, new_id};
use crate::db::models::SessionRow;
use crate::errors::AppError;
use serde::{Deserialize, Serialize};
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionDTO {
    pub id: String,
    pub title: String,
    pub provider_id: String,
    pub model: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub message_count: i64,
}

impl From<SessionRow> for SessionDTO {
    fn from(row: SessionRow) -> Self {
        Self {
            id: row.id,
            title: row.title,
            provider_id: row.provider_id,
            model: row.model,
            created_at: row.created_at,
            updated_at: row.updated_at,
            message_count: row.message_count,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateSessionRequest {
    pub provider_id: String,
    pub model: String,
}

#[tauri::command]
pub async fn get_sessions(pool: State<'_, SqlitePool>) -> Result<Vec<SessionDTO>, String> {
    let sessions = SessionRepo::get_all(&pool).await?;
    Ok(sessions.into_iter().map(Into::into).collect())
}

#[tauri::command]
pub async fn create_session(
    pool: State<'_, SqlitePool>,
    request: CreateSessionRequest,
) -> Result<SessionDTO, String> {
    let now = Utc::now().timestamp();
    let session = SessionRow {
        id: new_id("session"),
        title: "New Chat".to_string(),
        provider_id: request.provider_id,
        model: request.model,
        created_at: now,
        updated_at: now,
        message_count: 0,
    };

    SessionRepo::create(&pool, &session).await?;
    Ok(session.into())
}

#[tauri::command]
pub async fn delete_session(pool: State<'_, SqlitePool>, id: String) -> Result<(), String> {
    SessionRepo::delete(&pool, &id).await?;
    Ok(())
}

#[tauri::command]
pub async fn clear_all_sessions(pool: State<'_, SqlitePool>) -> Result<(), String> {
    SessionRepo::clear_all(&pool).await?;
    Ok(())
}

#[tauri::command]
pub async fn update_session_title(
    pool: State<'_, SqlitePool>,
    id: String,
    title: String,
) -> Result<(), String> {
    SessionRepo::update_title(&pool, &id, &title).await?;
    Ok(())
}