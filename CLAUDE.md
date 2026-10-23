# Liaotao — Repository rules

These rules apply to every change, whatever the task. They override any habit or default.

## The three objects

| Object | Where | Role |
|---|---|---|
| Rules | this file | What is always forbidden |
| Task cards | `docs/TASKS/` | What to do, exactly |
| The judge | `./verify.sh` | GREEN or RED. Not negotiable. |

## Rules

1. **Only modify files listed under `Files to modify` in your task card.** If another file
   seems necessary, stop and say so.
2. **Never add, remove or upgrade a dependency** (`package.json`, `src-tauri/Cargo.toml`).
   If one seems necessary, stop and say so.
3. **Never edit `verify.sh`, an existing test, or a git tag to make a task pass.** That is a
   failure, not a fix. Never create or move the `deps-approved` tag.
4. **Run `./verify.sh` before saying a task is done.** RED means not done.
5. **No source file over 350 lines.** Split it.
6. **No hard-coded user-visible text.** Every string lives in `src/i18n/en.json` and is
   rendered with `t('key')` from `react-i18next`.
7. **No hard-coded colour.** Use the theme classes `liaotao-*` defined in
   `tailwind.config.js`. No hex, `rgb()`, or Tailwind palette classes such as `text-red-500`.
8. **Code, comments and documentation in English.**
9. **Do not reformat, reorganise or "improve" code outside the scope of your task card.**
10. **When in doubt, stop and ask.** Never improvise.
11. **Do not push, and do not commit unless your task card says so.**

## Project facts

- Desktop app: Tauri 2 (Rust, `src-tauri/`) + React 18 / TypeScript / Vite 5 / Tailwind 3 (`src/`).
- Dev run: `npm run tauri dev` (front on port 5173).
- Every source file starts with a one-line header comment: `// file.ext — purpose`.
- Configuration: `config/default.toml`; all filesystem paths go through `src-tauri/src/paths.rs`.
- Tests that need a real engine (Ollama) are marked `#[ignore]` and run with `./verify.sh --live`.
- Licence: Apache-2.0. Contributions are signed off (DCO), see `CONTRIBUTING.md`.
