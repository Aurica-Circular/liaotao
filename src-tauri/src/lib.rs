// lib.rs — Application bootstrap for Liaotao AI Chat

mod commands;
mod config;
pub mod engine;
mod errors;
mod logger;
mod paths;

use commands::chat::{self, Generations};
use errors::AppError;

pub fn run() -> Result<(), AppError> {
    // 1. Load merged config (default → user → project → runtime)
    let cfg = config::load()?;

    // 2. Initialize logger (console + JSON file)
    let _guard = logger::init(&cfg.logger)?;

    // 3. Build and validate runtime paths
    let paths = paths::build(&cfg)?;

    tracing::info!(
        app    = cfg.app.name.as_str(),
        version = cfg.app.version.as_str(),
        mode   = cfg.app.mode.as_str(),
        logs   = paths.logs_dir.display().to_string().as_str(),
        "startup"
    );

    // 4. Launch Tauri
    tauri::Builder::default()
        .manage(cfg)
        .manage(paths)
        .manage(Generations::default())
        .invoke_handler(tauri::generate_handler![
            chat::chat_stream,
            chat::chat_stop,
            chat::engine_models,
            chat::default_engine,
        ])
        .run(tauri::generate_context!())
        .map_err(|e| AppError::Tauri(e.to_string()))
}
