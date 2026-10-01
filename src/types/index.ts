export type ProviderType = 'openai' | 'ollama' | 'llamacpp'

export interface ProviderConfig {
  id: string
  name: string
  type: ProviderType
  endpoint: string
  apiKey?: string
  defaultModel: string
  timeout: number
  headers?: Record<string, string>
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string
  providerId?: string
  createdAt: number
  streaming?: boolean
}

export interface ChatSession {
  id: string
  title: string
  providerId: string
  model: string
  createdAt: number
  updatedAt: number
  messageCount: number
}

export interface ProviderModelsResponse {
  models: Array<{
    id: string
    name?: string
    owned_by?: string
  }>
}

export interface ChatCompletionRequest {
  model: string
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  stream?: boolean
  temperature?: number
  max_tokens?: number
}

export interface ChatCompletionChunk {
  choices: Array<{
    delta: {
      content?: string
    }
    finish_reason: string | null
  }>
}

export interface TauriCommandResult<T> {
  success: boolean
  data?: T
  error?: string
}