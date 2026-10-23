// commands/settings.rs — Engines and key storage, as seen by the Settings screen

use serde::Deserialize;
use tauri::State;

use crate::engine::{self, Engine};
use crate::settings::{EngineInput, EngineView, KeyStorage, SettingsStore};

#[tauri::command]
pub fn engines_list(store: State<'_, SettingsStore>) -> Result<Vec<EngineView>, String> {
    store.engines()
}

#[tauri::command]
pub fn engine_save(input: EngineInput, store: State<'_, SettingsStore>) -> Result<EngineView, String> {
    store.save_engine(input)
}

#[tauri::command]
pub fn engine_delete(id: String, store: State<'_, SettingsStore>) -> Result<(), String> {
    store.delete_engine(&id)
}

#[tauri::command]
pub fn key_storage_get(store: State<'_, SettingsStore>) -> Result<KeyStorage, String> {
    store.key_storage()
}

#[tauri::command]
pub fn key_storage_set(storage: KeyStorage, store: State<'_, SettingsStore>) -> Result<(), String> {
    store.set_key_storage(storage)
}

/// An engine to test, saved or not. Without `api_key`, a saved engine's key is used.
#[derive(Debug, Deserialize)]
pub struct EngineProbe {
    #[serde(default)]
    pub id:       Option<String>,
    pub base_url: String,
    #[serde(default)]
    pub api_key:  Option<String>,
}

/// Test an engine: its model list on success, the raw error otherwise.
#[tauri::command]
pub async fn engine_models(probe: EngineProbe, store: State<'_, SettingsStore>) -> Result<Vec<String>, String> {
    let typed = probe.api_key.map(|k| k.trim().to_string()).filter(|k| !k.is_empty());
    let api_key = match (typed, &probe.id) {
        (Some(key), _) => Some(key),
        (None, Some(id)) => store.engine(id)?.api_key,
        (None, None) => None,
    };
    let engine = Engine { name: String::new(), base_url: probe.base_url.trim().to_string(), api_key };
    engine::list_models(&engine).await
}
