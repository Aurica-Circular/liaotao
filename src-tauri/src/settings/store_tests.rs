// settings/store_tests.rs — Tests for the settings store (file mode; keychain is live-only)

use super::*;

fn ollama() -> Engine {
    Engine { name: "Ollama".into(), base_url: "http://localhost:11434/v1".into(), api_key: None }
}

fn input(id: Option<&str>, key: Option<&str>) -> EngineInput {
    EngineInput {
        id: id.map(String::from),
        name: "Cloud".into(),
        base_url: "https://example.org/v1".into(),
        api_key: key.map(String::from),
    }
}

fn open(dir: &tempfile::TempDir) -> SettingsStore {
    SettingsStore::open(dir.path().join("settings.json"), Some(&ollama())).unwrap()
}

#[test]
fn first_launch_seeds_the_default_engine_in_a_private_file() {
    let dir = tempfile::tempdir().unwrap();
    let store = open(&dir);
    let engines = store.engines().unwrap();
    assert_eq!(engines.len(), 1);
    assert_eq!(engines[0].name, "Ollama");
    assert_eq!(store.key_storage().unwrap(), KeyStorage::File);

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mode = std::fs::metadata(dir.path().join("settings.json")).unwrap().permissions().mode();
        assert_eq!(mode & 0o777, 0o600);
    }
}

#[test]
fn the_key_is_resolved_for_calls_but_never_shown() {
    let dir = tempfile::tempdir().unwrap();
    let store = open(&dir);
    let saved = store.save_engine(input(None, Some("sk-secret"))).unwrap();
    assert!(saved.has_key);
    assert!(!format!("{:?}", store.engines().unwrap()).contains("sk-secret"));
    assert_eq!(store.engine(&saved.id).unwrap().api_key.as_deref(), Some("sk-secret"));
}

#[test]
fn absent_key_keeps_it_and_empty_key_removes_it() {
    let dir = tempfile::tempdir().unwrap();
    let store = open(&dir);
    let id = store.save_engine(input(None, Some("sk-secret"))).unwrap().id;

    store.save_engine(input(Some(&id), None)).unwrap();
    assert_eq!(store.engine(&id).unwrap().api_key.as_deref(), Some("sk-secret"));

    store.save_engine(input(Some(&id), Some(""))).unwrap();
    assert_eq!(store.engine(&id).unwrap().api_key, None);
}

#[test]
fn settings_survive_a_restart() {
    let dir = tempfile::tempdir().unwrap();
    let id = open(&dir).save_engine(input(None, Some("sk-secret"))).unwrap().id;
    let reopened = open(&dir);
    assert_eq!(reopened.engines().unwrap().len(), 2);
    assert_eq!(reopened.engine(&id).unwrap().api_key.as_deref(), Some("sk-secret"));
}

#[test]
fn deleting_removes_the_engine() {
    let dir = tempfile::tempdir().unwrap();
    let store = open(&dir);
    let id = store.save_engine(input(None, None)).unwrap().id;
    store.delete_engine(&id).unwrap();
    assert_eq!(store.engines().unwrap().len(), 1);
    assert!(store.engine(&id).is_err());
}

#[test]
fn invalid_changes_leave_settings_untouched() {
    let dir = tempfile::tempdir().unwrap();
    let store = open(&dir);
    assert!(store.save_engine(input(Some("nope"), None)).is_err());
    let mut blank = input(None, None);
    blank.name = "  ".into();
    assert!(store.save_engine(blank).is_err());
    assert_eq!(store.engines().unwrap().len(), 1);
}

/// Touches the real OS keychain. Run: ./verify.sh --live
#[test]
#[ignore]
fn keys_move_to_the_keychain_and_back() {
    let dir = tempfile::tempdir().unwrap();
    let store = open(&dir);
    let id = store.save_engine(input(None, Some("sk-move-me"))).unwrap().id;

    store.set_key_storage(KeyStorage::Keychain).unwrap();
    let file = std::fs::read_to_string(dir.path().join("settings.json")).unwrap();
    assert!(!file.contains("sk-move-me"), "key still in the file");
    assert_eq!(store.engine(&id).unwrap().api_key.as_deref(), Some("sk-move-me"));

    store.set_key_storage(KeyStorage::File).unwrap();
    assert_eq!(store.engine(&id).unwrap().api_key.as_deref(), Some("sk-move-me"));
    assert_eq!(secrets::get(&id).unwrap(), None, "keychain entry left behind");
}
