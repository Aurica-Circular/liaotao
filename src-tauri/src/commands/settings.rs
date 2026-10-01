// commands/settings.rs — Settings management commands

use tauri::State;
use sqlx::SqlitePool;
use crate::db::repository::SettingsRepo;
use crate::errors::AppError;

#[tauri::command]
pub async fn get_setting(
    pool: State<'_, SqlitePool>,
    key: String,
) -> Result<Option<String>, String> {
    SettingsRepo::get(&pool, &key).await
}

#[tauri::command]
pub async fn set_setting(
    pool: State<'_, SqlitePool>,
    key: String,
    value: String,
) -> Result<(), String> {
    SettingsRepo::set(&pool, &key, &value).await
}