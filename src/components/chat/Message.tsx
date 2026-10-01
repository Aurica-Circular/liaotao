import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { Copy, RotateCcw, Trash2, Loader2 } from 'lucide-react'
import { useState, useCallback } from 'react'
import { cn, formatTime } from '../../utils/helpers'
import { Button } from '../ui'
import type { ChatMessage } from '../../types'
import { useTranslation } from 'react-i18next'

interface MessageProps {
  message: ChatMessage
  onRegenerate?: (id: string) => void
  onCopy?: (content: string) => void
  onDelete?: (id: string) => void
  showActions?: boolean
}

export function Message({ message, onRegenerate, onCopy, onDelete, showActions = true }: MessageProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = useCallback(() => {
    if (onCopy && message.content) {
      onCopy(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [message.content, onCopy])

  if (!message.content && !message.streaming) return null

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'justify-end' : 'justify-start',
        message.streaming && 'animate-pulse'
      )}
      data-message-id={message.id}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-liaotao-accent/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-liaotao-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
      )}

      <div className={cn('max-w-[85%]', isUser ? 'text-right' : 'text-left')}>
        <div
          className={cn(
            'relative px-4 py-2.5 rounded-2xl',
            isUser
              ? 'bg-liaotao-accent/10 text-liaotao-text-primary rounded-tr-sm'
              : 'bg-liaotao-bg-tertiary text-liaotao-text-primary rounded-tl-sm'
          )}
        >
          {!isUser && message.streaming && (
            <div className="absolute -top-2 -right-2 flex items-center gap-1 text-xs text-liaotao-text-muted bg-liaotao-bg-secondary px-2 py-0.5 rounded">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{t('chat.thinking')}</span>
            </div>
          )}

          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[
              [rehypeHighlight, { ignoreMissing: true }],
            ]}
            components={{
              code: ({ children, ...props }) => (
                <pre className="code-block my-2" {...props}>
                  <code className="hljs">{children}</code>
                </pre>
              ),
              inlineCode: ({ children }) => (
                <code className="inline-code">{children}</code>
              ),
              p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
            }}
          >
            {message.content || ' '}
          </ReactMarkdown>
        </div>

        {showActions && message.content && (
          <div
            className={cn(
              'flex items-center gap-1 mt-1.5 opacity-0 transition-opacity group-hover:opacity-100',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            {!isUser && !message.streaming && onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRegenerate?.(message.id)}
                aria-label={t('chat.regenerate')}
                className="h-7 w-7 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              aria-label={copied ? t('chat.copied') : t('chat.copy')}
              className="h-7 w-7 p-0"
            >
              <Copy className={cn('h-4 w-4', copied && 'text-liaotao-success')} />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(message.id)}
                aria-label={t('chat.delete')}
                className="h-7 w-7 p-0 text-liaotao-error hover:text-liaotao-error"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {message.createdAt && (
          <div className={cn('text-xs text-liaotao-text-muted mt-1', isUser ? 'text-right' : 'text-left')}>
            {formatTime(message.createdAt)}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-liaotao-bg-tertiary flex items-center justify-center">
          <svg className="w-5 h-5 text-liaotao-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  )
}