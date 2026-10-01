import { ScrollArea } from '../ui'
import { Message } from './Message'
import type { ChatMessage } from '../../types'

interface MessageListProps {
  messages: ChatMessage[]
  onRegenerate?: (id: string) => void
  onCopy?: (content: string) => void
  onDelete?: (id: string) => void
  isStreaming?: boolean
  scrollAreaRef?: React.RefObject<HTMLDivElement>
}

export function MessageList({
  messages,
  onRegenerate,
  onCopy,
  onDelete,
  isStreaming,
  scrollAreaRef,
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-liaotao-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="mt-4 text-liaotao-text-secondary">No messages yet</p>
          <p className="text-sm text-liaotao-text-muted">Start a conversation below</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 space-y-4" autoScroll={!isStreaming}>
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
          onRegenerate={onRegenerate}
          onCopy={onCopy}
          onDelete={onDelete}
        />
      ))}
      {isStreaming && (
        <div className="flex justify-center py-2" aria-live="polite">
          <div className="flex items-center gap-2 text-liaotao-text-muted">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Generating response...</span>
          </div>
        </div>
      )}
    </ScrollArea>
  )
}