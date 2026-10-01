import { useRef, useState, useEffect, useCallback } from 'react'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { useChat } from '../../hooks'
import type { ChatMessage } from '../../types'

export function ChatArea() {
  const {
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
  } = useChat()

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [availableModels, setAvailableModels] = useState<string[]>([])

  // Load models when provider changes
  useEffect(() => {
    if (activeProvider) {
      loadModels(activeProvider).then(setAvailableModels)
    }
  }, [activeProvider, loadModels])

  const handleSend = useCallback(
    async (content: string) => {
      await sendMessage(content)
    },
    [sendMessage]
  )

  const handleRegenerate = useCallback(
    (messageId: string) => {
      regenerateMessage(messageId)
    },
    [regenerateMessage]
  )

  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content)
    // Toast notification would go here
  }, [])

  const handleDelete = useCallback((messageId: string) => {
    // This would need to be implemented in the store
    console.log('Delete message:', messageId)
  }, [])

  const handleModelChange = useCallback(
    (model: string) => {
      if (activeSession) {
        setActiveSession(activeSession.id)
        // Update session model - would need a store action
      }
    },
    [activeSession, setActiveSession]
  )

  if (!activeSession) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <svg className="h-16 w-16 text-liaotao-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h2 className="mt-4 text-xl font-medium text-liaotao-text-primary">Welcome to Liaotao</h2>
        <p className="mt-2 text-liaotao-text-secondary">Select a provider and start a new chat</p>
        <button
          onClick={newChat}
          className="mt-6 px-6 py-3 bg-liaotao-accent text-liaotao-bg-primary rounded-lg font-medium hover:bg-liaotao-accent-hover transition-colors"
        >
          New Chat
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <MessageList
        ref={scrollAreaRef}
        messages={activeMessages}
        onRegenerate={handleRegenerate}
        onCopy={handleCopy}
        onDelete={handleDelete}
        isStreaming={isStreaming}
      />
      <ChatInput
        onSend={handleSend}
        onStop={stopGeneration}
        isStreaming={isStreaming}
        model={activeSession.model}
        availableModels={availableModels}
        onModelChange={handleModelChange}
        placeholder={activeProvider?.defaultModel ? `Message ${activeProvider.defaultModel}...` : undefined}
      />
    </div>
  )
}