pub mod migrations;
pub mod models;
pub mod repository;

use sqlx::SqlitePool;
use std::path::PathBuf;
use crate::errors::AppError;

pub async fn init(db_path: PathBuf) -> Result<SqlitePool, AppError> {
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| AppError::Io(e))?;
    }

    let database_url = format!("sqlite://{}?mode=rwc", db_path.display());

    let pool = sqlx::SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    migrations::run(&pool).await?;

    tracing::info!(path = %db_path.display(), "Database initialized");
    Ok(pool)
}