// settings/mod.rs — User settings: engines, and where their API keys are kept

mod secrets;
mod store;

pub use store::SettingsStore;

use serde::{Deserialize, Serialize};

/// Where API keys live. The user chooses in Settings; `File` is the default.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum KeyStorage {
    /// In settings.json, readable by the user's account only (mode 600).
    #[default]
    File,
    /// In the OS credential store (macOS Keychain, Windows Credential Manager, Secret Service).
    Keychain,
}

/// An engine as written to settings.json.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredEngine {
    pub id:       String,
    pub name:     String,
    pub base_url: String,
    /// Present only in `File` mode.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub api_key:  Option<String>,
    /// `Keychain` mode: a key exists in the credential store. Kept here so that
    /// listing engines never has to open the keychain.
    #[serde(default)]
    pub keychain_key: bool,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Settings {
    #[serde(default)]
    pub key_storage: KeyStorage,
    #[serde(default)]
    pub engines:     Vec<StoredEngine>,
}

/// What the interface sees of an engine: never the key itself.
#[derive(Debug, Clone, Serialize)]
pub struct EngineView {
    pub id:       String,
    pub name:     String,
    pub base_url: String,
    pub has_key:  bool,
}

/// An engine to create (no `id`) or update.
/// `api_key`: absent = keep the current key, empty = remove it, text = replace it.
#[derive(Debug, Clone, Deserialize)]
pub struct EngineInput {
    #[serde(default)]
    pub id:       Option<String>,
    pub name:     String,
    pub base_url: String,
    #[serde(default)]
    pub api_key:  Option<String>,
}
