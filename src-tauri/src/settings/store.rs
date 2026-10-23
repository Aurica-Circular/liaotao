// settings/store.rs — Loads and saves settings.json; resolves each engine's key
//
// Every change is applied to a copy, written to disk, and only then made
// current: a failed write or keychain call leaves the settings unchanged.

use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard};

use super::{secrets, EngineInput, EngineView, KeyStorage, Settings, StoredEngine};
use crate::engine::Engine;

pub struct SettingsStore {
    path: PathBuf,
    data: Mutex<Settings>,
}

impl SettingsStore {
    /// Opens settings.json, or creates it from `seed` (the configured default
    /// engine) on first launch.
    pub fn open(path: PathBuf, seed: Option<&Engine>) -> Result<Self, String> {
        let data = if path.exists() {
            let text = std::fs::read_to_string(&path)
                .map_err(|e| format!("cannot read {}: {e}", path.display()))?;
            serde_json::from_str(&text)
                .map_err(|e| format!("cannot parse {}: {e}", path.display()))?
        } else {
            let mut first = Settings::default();
            if let Some(e) = seed {
                first.engines.push(StoredEngine {
                    id: new_id(),
                    name: e.name.clone(),
                    base_url: e.base_url.clone(),
                    api_key: None,
                    keychain_key: false,
                });
            }
            write_private(&path, &first)?;
            first
        };
        Ok(Self { path, data: Mutex::new(data) })
    }

    fn lock(&self) -> Result<MutexGuard<'_, Settings>, String> {
        self.data.lock().map_err(|e| e.to_string())
    }

    fn commit(&self, current: &mut Settings, next: Settings) -> Result<(), String> {
        write_private(&self.path, &next)?;
        *current = next;
        Ok(())
    }

    pub fn key_storage(&self) -> Result<KeyStorage, String> {
        Ok(self.lock()?.key_storage)
    }

    pub fn engines(&self) -> Result<Vec<EngineView>, String> {
        Ok(self.lock()?.engines.iter().map(view).collect())
    }

    /// The engine ready to call, key included.
    pub fn engine(&self, id: &str) -> Result<Engine, String> {
        let s = self.lock()?;
        let e = find(&s, id)?;
        Ok(Engine { name: e.name.clone(), base_url: e.base_url.clone(), api_key: key_of(&s, e)? })
    }

    pub fn save_engine(&self, input: EngineInput) -> Result<EngineView, String> {
        let name = input.name.trim().to_string();
        let base_url = input.base_url.trim().to_string();
        if name.is_empty() || base_url.is_empty() {
            return Err("an engine needs a name and an address".into());
        }
        let mut current = self.lock()?;
        let mut next = current.clone();
        let idx = match &input.id {
            Some(id) => next.engines.iter().position(|e| &e.id == id)
                .ok_or_else(|| format!("unknown engine {id}"))?,
            None => {
                next.engines.push(StoredEngine {
                    id: new_id(), name: String::new(), base_url: String::new(),
                    api_key: None, keychain_key: false,
                });
                next.engines.len() - 1
            }
        };
        let storage = next.key_storage;
        let e = &mut next.engines[idx];
        e.name = name;
        e.base_url = base_url;
        if let Some(key) = input.api_key.as_deref().map(str::trim) {
            match storage {
                KeyStorage::File => e.api_key = (!key.is_empty()).then(|| key.to_string()),
                KeyStorage::Keychain => {
                    if key.is_empty() { secrets::delete(&e.id)? } else { secrets::set(&e.id, key)? }
                    e.keychain_key = !key.is_empty();
                }
            }
        }
        let saved = view(e);
        self.commit(&mut current, next)?;
        Ok(saved)
    }

    pub fn delete_engine(&self, id: &str) -> Result<(), String> {
        let mut current = self.lock()?;
        let mut next = current.clone();
        let had_keychain_key = find(&next, id)?.keychain_key;
        next.engines.retain(|e| e.id != id);
        self.commit(&mut current, next)?;
        if had_keychain_key {
            if let Err(e) = secrets::delete(id) {
                tracing::warn!(engine = id, error = %e, "keychain entry left behind");
            }
        }
        Ok(())
    }

    /// Switch where keys live, moving every existing key. Keys are copied to
    /// the new place before being removed from the old one.
    pub fn set_key_storage(&self, target: KeyStorage) -> Result<(), String> {
        let mut current = self.lock()?;
        if current.key_storage == target {
            return Ok(());
        }
        let mut next = current.clone();
        next.key_storage = target;
        let mut leftovers = Vec::new();
        for e in &mut next.engines {
            match target {
                KeyStorage::Keychain => {
                    if let Some(key) = e.api_key.take() {
                        secrets::set(&e.id, &key)?;
                        e.keychain_key = true;
                    }
                }
                KeyStorage::File => {
                    if e.keychain_key {
                        e.api_key = secrets::get(&e.id)?;
                        e.keychain_key = false;
                        leftovers.push(e.id.clone());
                    }
                }
            }
        }
        self.commit(&mut current, next)?;
        for id in leftovers {
            if let Err(e) = secrets::delete(&id) {
                tracing::warn!(engine = %id, error = %e, "keychain entry left behind");
            }
        }
        Ok(())
    }
}

fn new_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

fn find<'a>(s: &'a Settings, id: &str) -> Result<&'a StoredEngine, String> {
    s.engines.iter().find(|e| e.id == id).ok_or_else(|| format!("unknown engine {id}"))
}

fn key_of(s: &Settings, e: &StoredEngine) -> Result<Option<String>, String> {
    match s.key_storage {
        KeyStorage::File => Ok(e.api_key.clone()),
        KeyStorage::Keychain if e.keychain_key => secrets::get(&e.id),
        KeyStorage::Keychain => Ok(None),
    }
}

fn view(e: &StoredEngine) -> EngineView {
    EngineView {
        id: e.id.clone(),
        name: e.name.clone(),
        base_url: e.base_url.clone(),
        has_key: e.api_key.is_some() || e.keychain_key,
    }
}

/// Write atomically (temp file + rename), readable by the user's account only.
fn write_private(path: &Path, settings: &Settings) -> Result<(), String> {
    use std::io::Write;
    let text = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    let tmp = path.with_extension("json.tmp");
    let mut options = std::fs::OpenOptions::new();
    options.write(true).create(true).truncate(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let fail = |e: std::io::Error| format!("cannot write {}: {e}", path.display());
    let mut file = options.open(&tmp).map_err(fail)?;
    file.write_all(text.as_bytes()).map_err(fail)?;
    file.sync_all().map_err(fail)?;
    std::fs::rename(&tmp, path).map_err(fail)
}

// ---------------------------------------------------------------------------
#[cfg(test)]
#[path = "store_tests.rs"]
mod tests;
