# T1.9 + T1.10 — System prompt, temperature, and measures under each answer

## Goal (one sentence)
Let the user set a system prompt and a temperature for the conversation, and show under
every answer which engine and model wrote it, how long it took and how fast it went.

## Useful context
- `src/hooks/useChatStream.ts` returns `{ text, status, error, metrics, busy, send, stop }`.
  `metrics` (type `GenerationMetrics` in `src/lib/engine.ts`) is set when an answer ends
  (`status` becomes `done` or `stopped`). **Do not modify the hook or `src/lib/`.**
  Fields: `durationMs`, `firstTokenMs` (null if nothing came), `thinkingMs`, `writingMs`,
  `answerChars`, `thinkingChars`, `promptTokens`, `completionTokens`,
  `speed` (null if too short), `speedUnit` (`'tokens/s'` or `'chars/s'`).
- The backend already measures and **logs** these numbers; you only display them.
- `ChatInput` (`src/lib/engine.ts`) accepts `temperature?: number`. A system prompt is a
  message `{ role: 'system', content }` placed **first** in `messages`.
- `src/features/chat/ChatScreen.tsx` holds `messages: ChatMessage[]`, appends the answer in
  a `useLayoutEffect` on `stream.status`, and shows a duration line using
  `stream.metrics.durationMs` with keys `chat.doneIn` / `chat.stoppedAfter`.
- `src/features/chat/MessageBubble.tsx` renders one bubble (`role`, `content`, `children`).
- Icons: `lucide-react` (`SlidersHorizontal`). Theme classes as in `tailwind.config.js`
  (`liaotao-*` only).

## Files to modify
- `src/features/chat/ChatScreen.tsx`
- `src/features/chat/MessageBubble.tsx`
- `src/features/chat/ConversationSettings.tsx` (new)
- `src/features/chat/AnswerMeta.tsx` (new)
- `src/i18n/en.json`

## Files NOT to touch
- everything else, in particular `src/lib/`, `src/hooks/`, `src-tauri/`, `verify.sh`,
  `package.json`, `tailwind.config.js`

## Steps
1. **Turns with their measures.** In `ChatScreen.tsx`, replace `messages: ChatMessage[]` by
   `turns: Turn[]` with
   `type Turn = ChatMessage & { meta?: { engineName: string; model: string; metrics: GenerationMetrics } }`.
   When the answer is appended (existing `useLayoutEffect`), store
   `meta: { engineName: engine.name, model, metrics: stream.metrics }` with it, using the
   engine and model **that were used for this answer** (remember them in a `useRef` at send time).
2. **Sending.** Build `messages` for `stream.send` as: the system message first if
   `systemPrompt.trim()` is not empty, then every turn mapped to `{ role, content }`
   (drop `meta`). Pass `temperature` only when it is not `null`.
3. **ConversationSettings.tsx** (props: `systemPrompt`, `onSystemPrompt`, `temperature: number | null`,
   `onTemperature`): a panel with
   - a textarea for the system prompt (label `t('chat.systemPrompt')`, placeholder `t('chat.systemPromptHint')`);
   - a checkbox `t('chat.temperatureDefault')`, checked when `temperature === null`;
     unchecking sets `0.7`; checking sets `null`;
   - when not null: a range input `min=0 max=2 step=0.1` and the value shown with one decimal,
     label `t('chat.temperature')`.
   In `ChatScreen.tsx`, a header button with the `SlidersHorizontal` icon
   (`aria-label={t('chat.settings')}`) shows or hides this panel above the conversation.
   State `systemPrompt` (starts `''`) and `temperature` (starts `null`) live in `ChatScreen`.
4. **AnswerMeta.tsx** (props: the `meta` object): one small line, `text-sm text-liaotao-text-muted`:
   `t('chat.meta', { engine, model, seconds })` — seconds = `durationMs / 1000` with one decimal;
   then, each only when its value is not null:
   `t('chat.metaFirstToken', { seconds })` (from `firstTokenMs`),
   `t('chat.metaSpeed', { speed, unit })` (from `speed`, `speedUnit`),
   `t('chat.metaTokens', { count })` (from `completionTokens`).
   Separate the parts with ` · `.
5. **MessageBubble.tsx**: add an optional prop `footer?: ReactNode`, rendered **under** the
   bubble, aligned like it. In `ChatScreen.tsx`, pass `<AnswerMeta meta={turn.meta} />` as
   `footer` for assistant turns that have `meta`.
6. Remove the old single duration line under the conversation (now shown per answer).
   Keep the error line.
7. `en.json`, under `chat`, exactly:
   - `settings`: "Conversation settings"
   - `systemPrompt`: "System prompt"
   - `systemPromptHint`: "Instructions sent before the conversation, e.g. \"Answer in French.\""
   - `temperature`: "Temperature"
   - `temperatureDefault`: "Engine default temperature"
   - `meta`: "{{engine}} · {{model}} · {{seconds}} s"
   - `metaFirstToken`: "first word after {{seconds}} s"
   - `metaSpeed`: "{{speed}} {{unit}}"
   - `metaTokens`: "{{count}} tokens"
   Remove `doneIn` only if nothing uses it any more; keep `stoppedAfter` unused keys out too.

## Forbidden
- Adding any dependency; hard-coded text or colours; `window.alert/confirm/prompt`.
- Changing how errors are displayed (raw, never rephrased).
- Storing anything in `localStorage`.

## How we know it is done
```bash
./verify.sh
```
Then, by hand (`npm run tauri dev`):
- System prompt "Answer only in French." → the next answer is in French.
- Temperature 0 then 1.5 on the same question: answers differ in style.
- Each answer shows a line like "Ollama · granite4.2:3b · 44.0 s · first word after 18.9 s ·
  22.8 tokens/s · 571 tokens"; switching model, the next line names the new model.

## If you are stuck
Do not improvise. Write down what blocks you and stop.
