// engine.ts — Typed bridge to the Rust commands (src-tauri/src/commands/)

import { Channel, invoke } from '@tauri-apps/api/core'

/** Field names follow the Rust structs (snake_case). A saved key is never sent back. */
export interface EngineView {
  id: string
  name: string
  base_url: string
  has_key: boolean
}

/**
 * An engine to create (no `id`) or update.
 * `api_key`: omitted = keep the saved key, '' = remove it, text = replace it.
 */
export interface EngineInput {
  id?: string
  name: string
  base_url: string
  api_key?: string
}

/** An engine to test, saved or not. Without `api_key`, the saved key of `id` is used. */
export interface EngineProbe {
  id?: string
  base_url: string
  api_key?: string
}

/** Where API keys are kept: settings file (default) or the system keychain. */
export type KeyStorage = 'file' | 'keychain'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatInput {
  engine_id: string
  model: string
  messages: ChatMessage[]
  temperature?: number
}

/** Exactly one `finished` or `failed` ends every generation. */
export type StreamEvent =
  | { event: 'started' }
  | { event: 'thinking'; text: string }
  | { event: 'delta'; text: string }
  | { event: 'finished'; durationMs: number; stopped: boolean; lastChunk: unknown }
  | { event: 'failed'; message: string }

export function listEngines(): Promise<EngineView[]> {
  return invoke('engines_list')
}

export function saveEngine(input: EngineInput): Promise<EngineView> {
  return invoke('engine_save', { input })
}

export function deleteEngine(id: string): Promise<void> {
  return invoke('engine_delete', { id })
}

/** Resolves with the model list; rejects with the engine's raw error message. */
export function listModels(probe: EngineProbe): Promise<string[]> {
  return invoke('engine_models', { probe })
}

export function getKeyStorage(): Promise<KeyStorage> {
  return invoke('key_storage_get')
}

/** Moves every saved key to the chosen place. */
export function setKeyStorage(storage: KeyStorage): Promise<void> {
  return invoke('key_storage_set', { storage })
}

/** Resolves once the generation has ended; events arrive through `onEvent`. */
export function streamChat(
  id: string,
  input: ChatInput,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const channel = new Channel<StreamEvent>()
  channel.onmessage = onEvent
  return invoke('chat_stream', { id, input, onEvent: channel })
}

export function stopChat(id: string): Promise<void> {
  return invoke('chat_stop', { id })
}
