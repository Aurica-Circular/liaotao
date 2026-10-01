// db/repository.rs — Database operations

use sqlx::SqlitePool;
use crate::db::models::{ProviderRow, SessionRow, MessageRow, SettingRow};
use crate::errors::AppError;
use chrono::Utc;
use uuid::Uuid;

pub struct ProviderRepo;

impl ProviderRepo {
    pub async fn create(pool: &SqlitePool, provider: &ProviderRow) -> Result<(), AppError> {
        sqlx::query(
            r#"
            INSERT INTO providers (id, name, type, endpoint, api_key, default_model, timeout, headers, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&provider.id)
        .bind(&provider.name)
        .bind(&provider.r#type)
        .bind(&provider.endpoint)
        .bind(&provider.api_key)
        .bind(&provider.default_model)
        .bind(provider.timeout)
        .bind(&provider.headers)
        .bind(provider.created_at)
        .bind(provider.updated_at)
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn get_all(pool: &SqlitePool) -> Result<Vec<ProviderRow>, AppError> {
        let rows = sqlx::query_as::<_, ProviderRow>("SELECT * FROM providers ORDER BY created_at DESC")
            .fetch_all(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(rows)
    }

    pub async fn get_by_id(pool: &SqlitePool, id: &str) -> Result<Option<ProviderRow>, AppError> {
        let row = sqlx::query_as::<_, ProviderRow>("SELECT * FROM providers WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(row)
    }

    pub async fn update(pool: &SqlitePool, provider: &ProviderRow) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE providers
            SET name = ?, type = ?, endpoint = ?, api_key = ?, default_model = ?, timeout = ?, headers = ?, updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(&provider.name)
        .bind(&provider.r#type)
        .bind(&provider.endpoint)
        .bind(&provider.api_key)
        .bind(&provider.default_model)
        .bind(provider.timeout)
        .bind(&provider.headers)
        .bind(provider.updated_at)
        .bind(&provider.id)
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn delete(pool: &SqlitePool, id: &str) -> Result<(), AppError> {
        sqlx::query("DELETE FROM providers WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }
}

pub struct SessionRepo;

impl SessionRepo {
    pub async fn create(pool: &SqlitePool, session: &SessionRow) -> Result<(), AppError> {
        sqlx::query(
            r#"
            INSERT INTO sessions (id, title, provider_id, model, created_at, updated_at, message_count)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&session.id)
        .bind(&session.title)
        .bind(&session.provider_id)
        .bind(&session.model)
        .bind(session.created_at)
        .bind(session.updated_at)
        .bind(session.message_count)
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn get_all(pool: &SqlitePool) -> Result<Vec<SessionRow>, AppError> {
        let rows = sqlx::query_as::<_, SessionRow>("SELECT * FROM sessions ORDER BY updated_at DESC")
            .fetch_all(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(rows)
    }

    pub async fn get_by_id(pool: &SqlitePool, id: &str) -> Result<Option<SessionRow>, AppError> {
        let row = sqlx::query_as::<_, SessionRow>("SELECT * FROM sessions WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(row)
    }

    pub async fn update_title(pool: &SqlitePool, id: &str, title: &str) -> Result<(), AppError> {
        let now = Utc::now().timestamp();
        sqlx::query("UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?")
            .bind(title)
            .bind(now)
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn increment_message_count(pool: &SqlitePool, id: &str) -> Result<(), AppError> {
        let now = Utc::now().timestamp();
        sqlx::query("UPDATE sessions SET message_count = message_count + 1, updated_at = ? WHERE id = ?")
            .bind(now)
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn decrement_message_count(pool: &SqlitePool, id: &str) -> Result<(), AppError> {
        sqlx::query("UPDATE sessions SET message_count = MAX(0, message_count - 1) WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn delete(pool: &SqlitePool, id: &str) -> Result<(), AppError> {
        sqlx::query("DELETE FROM sessions WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn clear_all(pool: &SqlitePool) -> Result<(), AppError> {
        sqlx::query("DELETE FROM sessions")
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }
}

pub struct MessageRepo;

impl MessageRepo {
    pub async fn create(pool: &SqlitePool, message: &MessageRow) -> Result<(), AppError> {
        sqlx::query(
            r#"
            INSERT INTO messages (id, session_id, role, content, model, provider_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&message.id)
        .bind(&message.session_id)
        .bind(&message.role)
        .bind(&message.content)
        .bind(&message.model)
        .bind(&message.provider_id)
        .bind(message.created_at)
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn get_by_session(pool: &SqlitePool, session_id: &str) -> Result<Vec<MessageRow>, AppError> {
        let rows = sqlx::query_as::<_, MessageRow>(
            "SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC"
        )
        .bind(session_id)
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(rows)
    }

    pub async fn get_by_id(pool: &SqlitePool, id: &str) -> Result<Option<MessageRow>, AppError> {
        let row = sqlx::query_as::<_, MessageRow>("SELECT * FROM messages WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(row)
    }

    pub async fn update_content(pool: &SqlitePool, id: &str, content: &str) -> Result<(), AppError> {
        sqlx::query("UPDATE messages SET content = ? WHERE id = ?")
            .bind(content)
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn delete(pool: &SqlitePool, id: &str) -> Result<(), AppError> {
        sqlx::query("DELETE FROM messages WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn clear_session(pool: &SqlitePool, session_id: &str) -> Result<(), AppError> {
        sqlx::query("DELETE FROM messages WHERE session_id = ?")
            .bind(session_id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }
}

pub struct SettingsRepo;

impl SettingsRepo {
    pub async fn get(pool: &SqlitePool, key: &str) -> Result<Option<String>, AppError> {
        let row = sqlx::query_as::<_, SettingRow>("SELECT * FROM settings WHERE key = ?")
            .bind(key)
            .fetch_optional(pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(row.map(|r| r.value))
    }

    pub async fn set(pool: &SqlitePool, key: &str, value: &str) -> Result<(), AppError> {
        let now = Utc::now().timestamp();
        sqlx::query(
            r#"
            INSERT INTO settings (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
            "#,
        )
        .bind(key)
        .bind(value)
        .bind(now)
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }
}

/// Generate a new unique ID with prefix
pub fn new_id(prefix: &str) -> String {
    format!("{}-{}", prefix, Uuid::new_v4().simple())
}