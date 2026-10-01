# Adapter: tauri-rust

## What this adapter provides
- `src-tauri/src/config.rs` — layered TOML config with validation
- `src-tauri/src/paths.rs` — safe path manager with allowed_roots guard
- `src-tauri/src/logger.rs` — tracing-based structured logging (JSON file + console)
- `src-tauri/src/errors.rs` — centralized error types
- `src-tauri/src/main.rs` — Tauri 2 entry point wiring the above

## Requirements
- Rust stable (rustup: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- Node.js >= 20 (recommended via nvm or fnm)
- Tauri prerequisites: https://tauri.app/start/prerequisites/

## Getting started
```bash
npm install
npm run tauri dev
```

## Running tests
```bash
cd src-tauri && cargo test
```

## Config layers
1. `config/default.toml` (bundled with the app)
2. `~/.config/<app>/user.toml` (optional user overrides)
3. `config/project.toml` (optional local project overrides, not committed)
4. Environment variables with prefix `APP__` (for example `APP__APP__MODE=normal`)

## Notes
- Always start in `mode = "debug"` until workflow is validated.
- Logs are written to `logs/app.YYYY-MM-DD.log` in JSON format.
- All write operations are restricted to `path_manager.allowed_roots`.
