// engine.ts — Typed bridge to the Rust engine commands (src-tauri/src/commands/chat.rs)

import { Channel, invoke } from '@tauri-apps/api/core'

/** Field names follow the Rust structs (snake_case). */
export interface Engine {
  name: string
  base_url: string
  api_key?: string | null
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  engine: Engine
  model: string
  messages: ChatMessage[]
  temperature?: number
}

/** Exactly one `finished` or `failed` ends every generation. */
export type StreamEvent =
  | { event: 'started' }
  | { event: 'delta'; text: string }
  | { event: 'finished'; durationMs: number; stopped: boolean; lastChunk: unknown }
  | { event: 'failed'; message: string }

export function getDefaultEngine(): Promise<Engine | null> {
  return invoke('default_engine')
}

export function listModels(engine: Engine): Promise<string[]> {
  return invoke('engine_models', { engine })
}

/** Resolves once the generation has ended; events arrive through `onEvent`. */
export function streamChat(
  id: string,
  request: ChatRequest,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const channel = new Channel<StreamEvent>()
  channel.onmessage = onEvent
  return invoke('chat_stream', { id, request, onEvent: channel })
}

export function stopChat(id: string): Promise<void> {
  return invoke('chat_stop', { id })
}
