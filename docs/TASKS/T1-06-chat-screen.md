# T1.6 — Chat screen: conversation with bubbles

## Goal (one sentence)
Turn the single question/answer screen into a conversation: every user message and
every answer stays on screen as a bubble, and each new question is sent with the
whole conversation so the model remembers what was said.

## Useful context
- `src/hooks/useChatStream.ts` streams ONE answer. It exposes
  `{ text, status, error, durationMs, busy, send, stop }`.
  `status` is one of `idle | waiting | thinking | streaming | done | stopped | failed`.
  `send(request)` clears `text` and starts a new answer. **Do not modify this file.**
- `src/lib/engine.ts` defines `ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }`
  and `ChatRequest`. **Do not modify this file.**
- `src/features/chat/ChatScreen.tsx` is the current screen. Keep its header (logo, engine
  name, model selector), its loader (the three bouncing dots), its error line, its
  duration line, its textarea and its Send/Stop button. You rearrange the middle part.
- Theme classes available (tailwind.config.js): `bg-liaotao-bg-primary`,
  `bg-liaotao-bg-secondary`, `bg-liaotao-bg-tertiary`, `text-liaotao-text-primary`,
  `text-liaotao-text-secondary`, `text-liaotao-text-muted`, `text-liaotao-accent`,
  `bg-liaotao-accent`, `border-liaotao-border`, `text-liaotao-error`.

## Files to modify
- `src/features/chat/ChatScreen.tsx`
- `src/features/chat/MessageBubble.tsx` (new)
- `src/i18n/en.json` (only if you add a visible text)

## Files NOT to touch
- everything else, in particular `src/hooks/`, `src/lib/`, `src-tauri/`, `verify.sh`,
  `package.json`, `tailwind.config.js`

## Steps
1. Create `MessageBubble.tsx`: a component taking `{ role: 'user' | 'assistant'; content: string }`
   (and optional `children` for the loader). First line: the header comment
   `// MessageBubble.tsx — One message of the conversation, as a bubble`.
   - user: aligned right, `bg-liaotao-bg-tertiary`, rounded, max width 75%.
   - assistant: aligned left, `bg-liaotao-bg-secondary`, rounded, max width 75%.
   - keep line breaks: `whitespace-pre-wrap`.
2. In `ChatScreen.tsx`, add state `messages: ChatMessage[]` (starts empty).
3. On send (Enter or button):
   a. build `next = [...messages, { role: 'user', content: prompt }]`;
   b. `setMessages(next)`; clear the textarea (`setPrompt('')`);
   c. call `stream.send({ engine, model, messages: next })`.
4. When `stream.status` becomes `done` or `stopped` and `stream.text` is not empty,
   append `{ role: 'assistant', content: stream.text }` to `messages` exactly once
   (use a `useEffect` on `stream.status`).
5. Render, in a scrollable column: every message of `messages` as a `MessageBubble`;
   then, while `stream.busy`, one extra assistant bubble showing `stream.text`, or the
   existing loader (dots + waiting/thinking text) while `stream.text` is empty.
6. Scroll to the bottom whenever a message is added or `stream.text` grows
   (a `ref` on an empty div at the end + `scrollIntoView()`).
7. The error line and the duration line stay under the conversation, as today.

## Forbidden
- Adding any dependency or any library.
- Hard-coded visible text (use `t('...')` and `src/i18n/en.json`).
- Hard-coded colours (hex, rgb, `text-red-500`...): only the theme classes above.
- Changing how errors are displayed: they stay raw, never rephrased.

## How we know it is done
```bash
./verify.sh
```
Then, by hand (`npm run tauri dev`, model `granite4.2:3b`):
- I ask "My name is Phil.", then "What is my name?": both questions and both answers
  stay on screen as bubbles, and the second answer says Phil.
- The answer appears inside its bubble as it is written; the dots show before.

## If you are stuck
Do not improvise. Write down what blocks you and stop.
