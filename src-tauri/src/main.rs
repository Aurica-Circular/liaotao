// main.rs — Application entry point for Liaotao AI Chat

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod config;
mod errors;
mod logger;
mod paths;
mod db;
mod llm;
mod commands;

use errors::AppError;
use std::path::PathBuf;
use crate::config::AppConfig;
use crate::paths::RuntimePaths;

fn main() -> Result<(), AppError> {
    // 1. Load merged config (default → user → project → runtime)
    let cfg = config::load()?;

    // 2. Initialize logger (console + JSON file)
    let _guard = logger::init(&cfg.logger)?;

    // 3. Build and validate runtime paths
    let paths = paths::build(&cfg)?;

    // 4. Initialize database
    let db_path = paths.logs_dir.parent()
        .unwrap_or(&PathBuf::from("."))
        .join("liaotao.db");

    let pool = tauri::async_runtime::block_on(async {
        db::init(db_path.clone()).await
    })?;

    tracing::info!(
        app    = cfg.app.name.as_str(),
        version = cfg.app.version.as_str(),
        mode   = cfg.app.mode.as_str(),
        logs   = paths.logs_dir.display().to_string().as_str(),
        db     = %db_path.display(),
        "startup"
    );

    // 5. Launch Tauri
    tauri::Builder::default()
        .manage(cfg)
        .manage(paths)
        .manage(pool)
        .invoke_handler(tauri::generate_handler![
            // Provider commands
            commands::providers::get_providers,
            commands::providers::save_provider,
            commands::providers::update_provider,
            commands::providers::delete_provider,
            commands::providers::test_provider_connection,
            // Session commands
            commands::sessions::get_sessions,
            commands::sessions::create_session,
            commands::sessions::delete_session,
            commands::sessions::clear_all_sessions,
            commands::sessions::update_session_title,
            // Message commands
            commands::messages::get_messages,
            commands::messages::save_message,
            commands::messages::delete_message,
            commands::messages::clear_session_messages,
            // Settings commands
            commands::settings::get_setting,
            commands::settings::set_setting,
        ])
        .run(tauri::generate_context!())
        .map_err(|e| AppError::Tauri(e.to_string()))
}