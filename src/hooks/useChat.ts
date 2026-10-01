import { useCallback, useRef, useEffect } from 'react'
import { useChatStore, useProviderStore } from '../stores'
import {
  streamChatCompletion,
  chatCompletion,
  fetchModels,
  saveMessage,
  createSession,
  updateSessionTitle,
} from './useTauriCommands'
import type { ChatMessage, ProviderConfig } from '../types'

export function useChat() {
  const {
    activeSessionId,
    sessions,
    messages,
    isStreaming,
    createSession: createSessionStore,
    setActiveSession,
    addMessage,
    updateMessage,
    deleteMessage,
    updateSessionTitle: updateSessionTitleStore,
    setStreaming,
    getActiveSession,
  } = useChatStore()

  const { getActiveProvider } = useProviderStore()
  const abortControllerRef = useRef<AbortController | null>(null)
  const streamingMessageIdRef = useRef<string | null>(null)

  const activeSession = getActiveSession()
  const activeProvider = getActiveProvider()
  const activeMessages = messages[activeSessionId || ''] || []

  const sendMessage = useCallback(
    async (content: string, options?: { model?: string; regenerate?: boolean }) => {
      const provider = activeProvider
      const session = activeSession
      const model = options?.model || session?.model || provider?.defaultModel

      if (!provider || !model) {
        throw new Error('No provider or model selected')
      }

      // Create session if needed
      let sessionId = activeSessionId
      if (!sessionId) {
        const newSession = createSessionStore(provider.id, model)
        sessionId = newSession.id
        setActiveSession(sessionId)
      }

      // Handle regeneration - remove last assistant message
      if (options?.regenerate) {
        const lastAssistantMsg = [...activeMessages].reverse().find((m) => m.role === 'assistant')
        if (lastAssistantMsg) {
          deleteMessage(lastAssistantMsg.id)
        }
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        sessionId,
        role: 'user',
        content,
        createdAt: Date.now(),
      }
      addMessage(sessionId!, userMessage)
      await saveMessage(userMessage)

      // Add placeholder assistant message
      const assistantMessageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        sessionId,
        role: 'assistant',
        content: '',
        model,
        providerId: provider.id,
        createdAt: Date.now(),
        streaming: true,
      }
      addMessage(sessionId!, assistantMessage)
      streamingMessageIdRef.current = assistantMessageId
      setStreaming(true)

      // Prepare messages for API
      const apiMessages = activeMessages
        .filter((m) => m.id !== assistantMessageId)
        .map((m) => ({ role: m.role, content: m.content }))
        .concat({ role: 'user', content })

      // Abort any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      try {
        let fullContent = ''

        // Stream the response
        for await (const chunk of streamChatCompletion(
          { model, messages: apiMessages, stream: true },
          provider,
          abortControllerRef.current.signal
        )) {
          fullContent += chunk
          updateMessage(sessionId!, assistantMessageId, { content: fullContent })
        }

        // Mark as complete
        updateMessage(sessionId!, assistantMessageId, { streaming: false, content: fullContent })
        streamingMessageIdRef.current = null
        setStreaming(false)

        // Save final message
        await saveMessage({
          ...assistantMessage,
          content: fullContent,
          streaming: false,
        })

        // Auto-generate title from first user message
        if (session?.title === 'New Chat' && apiMessages.length === 1) {
          const title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
          updateSessionTitleStore(sessionId!, title)
          await updateSessionTitle(sessionId!, title)
        }

        return fullContent
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // User stopped generation
          updateMessage(sessionId!, assistantMessageId, {
            content: fullContent + '\n\n*[Stopped]*',
            streaming: false,
          })
        } else {
          // Error
          updateMessage(sessionId!, assistantMessageId, {
            content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            streaming: false,
          })
        }
        streamingMessageIdRef.current = null
        setStreaming(false)
        throw error
      }
    },
    [
      activeProvider,
      activeSession,
      activeSessionId,
      activeMessages,
      createSessionStore,
      setActiveSession,
      addMessage,
      updateMessage,
      deleteMessage,
      updateSessionTitleStore,
      setStreaming,
      saveMessage,
      updateSessionTitle,
    ]
  )

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const regenerateMessage = useCallback(
    (messageId: string) => {
      const userMessage = activeMessages.find((m) => m.id === messageId)
      if (userMessage && userMessage.role === 'user') {
        return sendMessage(userMessage.content, { regenerate: true })
      }
    },
    [activeMessages, sendMessage]
  )

  const newChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setActiveSession(null)
  }, [setActiveSession])

  const loadModels = useCallback(async (provider: ProviderConfig) => {
    try {
      return await fetchModels(provider)
    } catch {
      return []
    }
  }, [])

  return {
    activeSession,
    activeProvider,
    activeMessages,
    isStreaming,
    sendMessage,
    stopGeneration,
    regenerateMessage,
    newChat,
    loadModels,
    setActiveSession,
  }
}