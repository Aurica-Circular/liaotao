<p align="center">
  <img src="Liaotao-logo.svg" alt="Liaotao" width="128" height="128">
</p>

<h1 align="center">Liaotao 聊道</h1>

<p align="center">
  A local-first desktop chat for the AI engine of your choice — and it shows where answers come from.
</p>

---

> **Status: early development.** Liaotao is being rebuilt from scratch (Tauri 2 + React).
> There is no installable release of the new version yet. Earlier generations of the
> project (Wails/Go, Kotlin Compose) are archived under the `archive/*` tags.

## Why Liaotao

- **Everything stays on your machine.** Liaotao talks to engines you run yourself, such as
  [Ollama](https://ollama.com) or [AiTao](https://github.com/Aurica-Circular/AiTao), and to online
  services only if you add them.
- **You see where an answer comes from.** When the engine cites documents, Liaotao is meant
  to show them — *a notary, not an oracle*. *(planned)*
- **You add what you need.** A small free core; advanced features come as modules. *(planned)*
- **Your paid AI can delegate simple work to your local models**, and you see what they did.
  *(planned)*

The name joins 聊 (*liáo*, to chat) and 道 (*dào*, the way), in traditional characters.

## What works today

- Chat with any **OpenAI-compatible engine** (`/v1/chat/completions`): Ollama, AiTao, and others.
- Answers **stream in** as they are written; a **Stop** button ends a generation at once.
- A loader shows when the engine is loading a model or when the model is **thinking**.
- A **conversation** keeps its history: each question is sent with what was said before.
- **Settings:** add, test, edit and delete engines; the test lists the engine's models
  or shows the engine's exact error.
- **API keys**, for online services only, are kept where you choose: the private settings
  file (default) or the system keychain. Keys never reach the interface.
- Switch **engine or model** in the middle of a conversation.

## Run it from source

Requirements: [Rust](https://rustup.rs) (stable), [Node.js](https://nodejs.org) 20 or later,
and the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your system.
Developed and tested on macOS (Apple Silicon).

```bash
npm install
npm run tauri dev
```

On first launch, Liaotao offers a local Ollama at `http://localhost:11434/v1`.
Add other engines from **Settings** (the gear icon).

Check that an engine answers, without opening the app:

```bash
npm run diag                              # Ollama, by default
npm run diag -- http://localhost:8200/v1  # any OpenAI-compatible address
```

## Check your changes

One command builds everything, runs the tests and checks the project rules. It answers
**GREEN** or **RED**:

```bash
./verify.sh          # build, tests, no hard-coded text or colour, file size,
                     # dependencies, secrets
./verify.sh --live   # also runs the tests that need a real Ollama
```

## Project layout

```
src/                 interface (React, TypeScript, Tailwind)
  features/          screens: chat, settings
  i18n/en.json       every visible text
src-tauri/src/       Rust core
  engine/            OpenAI-compatible client, streaming
  settings/          engines and API key storage
  commands/          what the interface can call
config/default.toml  default configuration
docs/                architecture, changelog, task cards
verify.sh            the green/red judge
```

More detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md): commits are
signed off ([DCO](https://developercertificate.org/)), and `./verify.sh` must be green.
Assistants and contributors follow the repository rules in [CLAUDE.md](CLAUDE.md).

Security issues: see [SECURITY.md](SECURITY.md) — please do not open a public issue.

## Licence

[Apache License 2.0](LICENSE). Copyright 2026 Aurica Circular Co. Ltd. (歐瑞卡有限公司).
