# Changelog

Format: [Keep a Changelog](https://keepachangelog.com). Versions follow
[Semantic Versioning](https://semver.org).

## [Unreleased]

Fresh rebuild on Tauri 2 + React. Earlier generations (Wails/Go, Kotlin Compose) are
archived under the `archive/*` tags.

### Added
- Streaming chat with any OpenAI-compatible engine (Ollama, AiTao), with Stop.
- Loader while waiting for the engine and while the model is thinking.
- Conversation with history and bubbles.
- Settings: add, test, edit and delete engines; models listed after a test.
- API key storage chosen by the user: private settings file (default) or system keychain.
- Engine and model selectors in the chat.
- `npm run diag`: one-line engine status without the app.
- `./verify.sh`: single green/red quality gate; DCO sign-off check on pull requests.
- Licence: Apache-2.0.
