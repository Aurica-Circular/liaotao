// MessageBubble.tsx — One message of the conversation, as a bubble, with an optional line under it

import { ReactNode } from 'react'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content?: string
  children?: ReactNode
  /** Shown under the bubble, aligned like it */
  footer?: ReactNode
}

export default function MessageBubble({ role, content = '', children, footer }: MessageBubbleProps) {
  const isUser = role === 'user'
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[75%] whitespace-pre-wrap rounded-lg px-4 py-2 ${
          isUser ? 'bg-liaotao-bg-tertiary' : 'bg-liaotao-bg-secondary'
        }`}
      >
        {content}
        {children}
      </div>
      {footer}
    </div>
  )
}
