// lib.rs — Application bootstrap for Liaotao AI Chat

mod commands;
mod config;
pub mod engine;
mod errors;
mod logger;
mod paths;
mod settings;

use commands::chat::{self, Generations};
use commands::settings as settings_cmd;
use errors::AppError;
use settings::SettingsStore;

pub fn run() -> Result<(), AppError> {
    // 1. Load merged config (default → user → project → runtime)
    let cfg = config::load()?;

    // 2. Build and validate runtime paths (the logger needs logs_dir)
    let paths = paths::build(&cfg)?;

    // 3. Initialize logger (JSON file in logs_dir)
    let _guard = logger::init(&cfg.logger, &paths.logs_dir)?;

    tracing::info!(
        app    = cfg.app.name.as_str(),
        version = cfg.app.version.as_str(),
        mode   = cfg.app.mode.as_str(),
        logs   = paths.logs_dir.display().to_string().as_str(),
        "startup"
    );

    // 4. User settings (engines); first launch starts with the configured default engine
    let store = SettingsStore::open(paths.settings_file.clone(), cfg.default_engine.as_ref())
        .map_err(AppError::Config)?;

    // 5. Launch Tauri
    tauri::Builder::default()
        .manage(cfg)
        .manage(paths)
        .manage(store)
        .manage(Generations::default())
        .invoke_handler(tauri::generate_handler![
            chat::chat_stream,
            chat::chat_stop,
            settings_cmd::engines_list,
            settings_cmd::engine_save,
            settings_cmd::engine_delete,
            settings_cmd::engine_models,
            settings_cmd::key_storage_get,
            settings_cmd::key_storage_set,
        ])
        .run(tauri::generate_context!())
        .map_err(|e| AppError::Tauri(e.to_string()))
}
