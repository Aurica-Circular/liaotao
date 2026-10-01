import { invoke } from '@tauri-apps/api/core'
import type { ProviderConfig, ChatSession, ChatMessage, ChatCompletionRequest } from '../types'

// Provider commands
export async function getProviders(): Promise<ProviderConfig[]> {
  return invoke('get_providers')
}

export async function saveProvider(provider: ProviderConfig): Promise<void> {
  return invoke('save_provider', { provider })
}

export async function deleteProvider(id: string): Promise<void> {
  return invoke('delete_provider', { id })
}

export async function testProviderConnection(provider: ProviderConfig): Promise<{ success: boolean; models?: string[]; error?: string }> {
  return invoke('test_provider_connection', { provider })
}

// Session commands
export async function getSessions(): Promise<ChatSession[]> {
  return invoke('get_sessions')
}

export async function createSession(providerId: string, model: string): Promise<ChatSession> {
  return invoke('create_session', { providerId, model })
}

export async function deleteSession(id: string): Promise<void> {
  return invoke('delete_session', { id })
}

export async function clearAllSessions(): Promise<void> {
  return invoke('clear_all_sessions')
}

export async function updateSessionTitle(id: string, title: string): Promise<void> {
  return invoke('update_session_title', { id, title })
}

// Message commands
export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  return invoke('get_messages', { sessionId })
}

export async function saveMessage(message: ChatMessage): Promise<void> {
  return invoke('save_message', { message })
}

export async function deleteMessage(id: string): Promise<void> {
  return invoke('delete_message', { id })
}

export async function clearSessionMessages(sessionId: string): Promise<void> {
  return invoke('clear_session_messages', { sessionId })
}

// LLM streaming
export async function* streamChatCompletion(
  request: ChatCompletionRequest,
  provider: ProviderConfig,
  signal: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${provider.endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {}),
      ...provider.headers,
    },
    body: JSON.stringify({ ...request, stream: true }),
    signal,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`HTTP ${response.status}: ${error}`)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) return

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) yield content
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// Non-streaming completion
export async function chatCompletion(
  request: ChatCompletionRequest,
  provider: ProviderConfig
): Promise<string> {
  const response = await fetch(`${provider.endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {}),
      ...provider.headers,
    },
    body: JSON.stringify({ ...request, stream: false }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`HTTP ${response.status}: ${error}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

// Models fetching
export async function fetchModels(provider: ProviderConfig): Promise<string[]> {
  const endpoint = provider.type === 'ollama'
    ? `${provider.endpoint}/api/tags`
    : `${provider.endpoint}/models`

  const response = await fetch(endpoint, {
    headers: provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {},
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`)
  }

  const data = await response.json()

  if (provider.type === 'ollama') {
    return data.models?.map((m: any) => m.name) || []
  }

  return data.data?.map((m: any) => m.id) || []
}