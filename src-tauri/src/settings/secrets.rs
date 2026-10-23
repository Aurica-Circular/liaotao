// settings/secrets.rs — API keys in the OS credential store, one entry per engine id

use keyring::{Entry, Error};

const SERVICE: &str = "liaotao";

fn entry(engine_id: &str) -> Result<Entry, String> {
    Entry::new(SERVICE, engine_id).map_err(|e| e.to_string())
}

pub fn get(engine_id: &str) -> Result<Option<String>, String> {
    match entry(engine_id)?.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

pub fn set(engine_id: &str, key: &str) -> Result<(), String> {
    entry(engine_id)?.set_password(key).map_err(|e| e.to_string())
}

pub fn delete(engine_id: &str) -> Result<(), String> {
    match entry(engine_id)?.delete_credential() {
        Ok(()) | Err(Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}
