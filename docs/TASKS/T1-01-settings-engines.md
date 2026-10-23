# T1.1–1.4 — Settings screen: engines and key storage

## Goal (one sentence)
A Settings panel where the user adds, tests, edits and deletes engines, sees each
engine's models after a test, and chooses where API keys are kept.

## Useful context
- All backend calls already exist in `src/lib/engine.ts`. **Do not modify it.** Use:
  `listEngines()`, `saveEngine(input)`, `deleteEngine(id)`, `listModels(probe)`,
  `getKeyStorage()`, `setKeyStorage(storage)`, and the types `EngineView`,
  `EngineInput`, `EngineProbe`, `KeyStorage`.
- A saved key is NEVER sent to the interface: `EngineView.has_key` only says one exists.
  In `saveEngine`, `api_key` omitted = keep the saved key, `''` = remove it, text = replace it.
- `listModels` rejects with the engine's **raw error message**: show it exactly as received.
- Settings are saved by the backend at once; they survive a restart. No local storage.
- `src/features/chat/ChatScreen.tsx` loads engines in a `useEffect(..., [])` and uses the
  first engine. Its header holds the logo, the engine name and the model `<select>`.
- Icons: `lucide-react` is installed (`import { Settings, X } from 'lucide-react'`).
- Theme classes (tailwind.config.js): `bg-liaotao-bg-primary`, `bg-liaotao-bg-secondary`,
  `bg-liaotao-bg-tertiary`, `text-liaotao-text-primary`, `text-liaotao-text-secondary`,
  `text-liaotao-text-muted`, `text-liaotao-accent`, `bg-liaotao-accent`,
  `border-liaotao-border`, `text-liaotao-error`, `bg-liaotao-error`, `bg-liaotao-success`,
  `text-liaotao-success`.

## Files to modify
- `src/App.tsx`
- `src/features/chat/ChatScreen.tsx` (only the two changes in step 1)
- `src/features/settings/SettingsPanel.tsx` (new)
- `src/features/settings/EngineForm.tsx` (new)
- `src/features/settings/KeyStorageChoice.tsx` (new)
- `src/i18n/en.json`

## Files NOT to touch
- everything else, in particular `src/lib/`, `src/hooks/`, `src-tauri/`, `verify.sh`,
  `package.json`, `tailwind.config.js`

## Steps
1. `ChatScreen.tsx`: add two props, `onOpenSettings: () => void` and `settingsVersion: number`.
   - In the header, after the model `<select>`, a button with the `Settings` icon and
     `aria-label={t('settings.open')}` calling `onOpenSettings`.
   - Add `settingsVersion` to the dependency array of the effect that loads engines, so
     engines and models reload when settings change. Change nothing else in this file.
   - When `listEngines()` returns an empty list, show `t('chat.noEngine')` in the
     conversation area.
2. `App.tsx`: state `settingsOpen` (boolean) and `settingsVersion` (number, starts at 0).
   Always render `ChatScreen` (the conversation must survive opening Settings). When
   `settingsOpen`, render `SettingsPanel` on top of it (fixed, full window,
   `bg-liaotao-bg-primary`). Closing the panel sets `settingsOpen` false and adds 1 to
   `settingsVersion`.
3. `SettingsPanel.tsx` (props: `onClose`): title, close button (`X` icon,
   `aria-label={t('settings.close')}`), then two sections:
   a. **Engines**: one row per engine: name, address, a small "key saved" label when
      `has_key`, buttons Edit and Delete. Delete asks `window.confirm(t('settings.confirmDelete', { name }))`
      first. An "Add engine" button. Edit/Add open `EngineForm` in place of the list.
      After save or delete, reload the list with `listEngines()`.
   b. **API keys**: the `KeyStorageChoice` component.
   Any rejected call: show its message raw, in `text-liaotao-error`.
4. `EngineForm.tsx` (props: `engine?: EngineView`, `onDone: () => void`): fields
   name, address (`base_url`), API key (`type="password"`).
   - Under the address, a hint: `t('settings.addressHint')`.
   - Key placeholder: `t('settings.keyKeep')` when `engine?.has_key`, else `t('settings.keyOptional')`.
   - When `engine?.has_key`: a checkbox `t('settings.keyRemove')`.
   - **Test** button: `listModels({ id: engine?.id, base_url, api_key: typedKey || undefined })`.
     While running, disable it. Success: green dot (`bg-liaotao-success`) +
     `t('settings.testOk', { count })` + the model names in a small list.
     Failure: red dot (`bg-liaotao-error`) + the raw error message.
   - **Save**: `saveEngine({ id: engine?.id, name, base_url, api_key })` where `api_key`
     is `''` if the remove box is checked, the typed key if one was typed, otherwise
     omitted. Then `onDone()`. **Cancel**: `onDone()`.
   - Save is disabled while name or address is empty.
5. `KeyStorageChoice.tsx`: two radio buttons, `file` and `keychain`, each with a title and
   a one-line explanation from `en.json`. Load the current value with `getKeyStorage()`.
   On change: `setKeyStorage(value)`; on failure show the raw message and reload the value.
6. `en.json`: add the keys used above, under `settings` (and `chat.noEngine`). Use exactly
   these texts:
   - `settings.title`: "Settings" · `settings.open`: "Open settings" · `settings.close`: "Close settings"
   - `settings.engines`: "Engines" · `settings.add`: "Add engine" · `settings.edit`: "Edit"
   - `settings.delete`: "Delete" · `settings.confirmDelete`: "Delete the engine {{name}}?"
   - `settings.keySaved`: "key saved" · `settings.name`: "Name" · `settings.address`: "Address"
   - `settings.addressHint`: "OpenAI-compatible address. Ollama: http://localhost:11434/v1 · AiTao: http://localhost:8200/v1"
   - `settings.key`: "API key" · `settings.keyOptional`: "Optional — only online services need one"
   - `settings.keyKeep`: "Saved — leave empty to keep it" · `settings.keyRemove`: "Remove the saved key"
   - `settings.test`: "Test" · `settings.testOk`: "Connected — {{count}} models"
   - `settings.save`: "Save" · `settings.cancel`: "Cancel"
   - `settings.keys`: "API keys"
   - `settings.storageFile`: "Settings file (default)"
   - `settings.storageFileHelp`: "Kept in Liaotao's settings file, outside synced folders, readable by your user account only."
   - `settings.storageKeychain`: "System keychain"
   - `settings.storageKeychainHelp`: "Kept encrypted in the system keychain (Keychain on macOS). Saved keys move there."
   - `chat.noEngine`: "No engine yet. Open the settings to add one."

## Forbidden
- Adding any dependency or library.
- Hard-coded visible text or colours (the judge checks both).
- Rephrasing, translating or shortening an error message.
- Storing anything in `localStorage`.

## How we know it is done
```bash
./verify.sh
```
Then, by hand (`npm run tauri dev`):
- Settings → Add engine "AiTao", `http://localhost:8200/v1` → Test: with AiTao off, the raw
  "Connection refused" error shows; with Ollama's address, models list appears.
- Save two engines, close, quit the app, relaunch: both engines are still there.
- Edit one, delete one: the list follows.
- Switch API keys to System keychain and back: no error.

## If you are stuck
Do not improvise. Write down what blocks you and stop.
