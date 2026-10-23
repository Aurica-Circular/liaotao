// MessageBubble.tsx — One message of the conversation, as a bubble

import { ReactNode } from 'react'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content?: string
  children?: ReactNode
}

export default function MessageBubble({ role, content = '', children }: MessageBubbleProps) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] whitespace-pre-wrap rounded-lg px-4 py-2 ${
          isUser ? 'bg-liaotao-bg-tertiary' : 'bg-liaotao-bg-secondary'
        }`}
      >
        {content}
        {children}
      </div>
    </div>
  )
}
