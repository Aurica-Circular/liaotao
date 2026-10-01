// db/migrations.rs — Database migrations

use sqlx::{SqlitePool, migrate::MigrateDatabase};
use crate::errors::AppError;

/// Run all pending migrations
pub async fn run(pool: &SqlitePool) -> Result<(), AppError> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS providers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            endpoint TEXT NOT NULL,
            api_key TEXT,
            default_model TEXT NOT NULL,
            timeout INTEGER NOT NULL DEFAULT 120000,
            headers TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL DEFAULT 'New Chat',
            provider_id TEXT NOT NULL,
            model TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            message_count INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            model TEXT,
            provider_id TEXT,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    // Create indexes
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_sessions_provider ON sessions(provider_id)")
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at DESC)")
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id)")
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at)")
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    // Settings table for key-value storage
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    tracing::info!("Database migrations completed");
    Ok(())
}