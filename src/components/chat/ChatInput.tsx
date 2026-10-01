import { useRef, useState, useCallback, useEffect, KeyboardEvent } from 'react'
import { Send, X, Paperclip, Mic, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/helpers'
import { Button } from '../ui'
import { useTranslation } from 'react-i18next'

interface ChatInputProps {
  onSend: (content: string) => void
  onStop?: () => void
  onAttachFile?: () => void
  isStreaming?: boolean
  disabled?: boolean
  placeholder?: string
  model?: string
  onModelChange?: (model: string) => void
  availableModels?: string[]
}

export function ChatInput({
  onSend,
  onStop,
  onAttachFile,
  isStreaming,
  disabled,
  placeholder,
  model,
  onModelChange,
  availableModels = [],
}: ChatInputProps) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [showModelSelector, setShowModelSelector] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [height, setHeight] = useState(44)

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      const ta = textareaRef.current
      ta.style.height = 'auto'
      const newHeight = Math.min(ta.scrollHeight, 200)
      setHeight(newHeight)
      ta.style.height = `${newHeight}px`
    }
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [text, adjustHeight])

  const handleSubmit = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (text.trim() && !isStreaming && !disabled) {
          onSend(text.trim())
          setText('')
          setHeight(44)
        }
      }
    },
    [text, isStreaming, disabled, onSend]
  )

  const handleStop = useCallback(() => {
    onStop?.()
  }, [onStop])

  return (
    <div className="border-t border-liaotao-border bg-liaotao-bg-secondary/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto p-4 space-y-3">
        {availableModels.length > 1 && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="w-full justify-between text-liaotao-text-secondary hover:text-liaotao-text-primary"
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', showModelSelector && 'rotate-180')} />
              <span className="truncate max-w-[200px]">{model || t('chat.modelSelector')}</span>
            </Button>

            {showModelSelector && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-liaotao-bg-secondary border border-liaotao-border rounded-lg shadow-lg overflow-hidden z-10">
                {availableModels.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      onModelChange?.(m)
                      setShowModelSelector(false)
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-sm text-left hover:bg-liaotao-bg-tertiary transition-colors',
                      model === m && 'bg-liaotao-accent/10 text-liaotao-accent'
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-end gap-2">
          {onAttachFile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAttachFile}
              disabled={isStreaming || disabled}
              aria-label={t('chat.attachFile')}
              className="h-10 flex-shrink-0"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          )}

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleSubmit}
              placeholder={placeholder || t('chat.placeholder', { model: model || '' })}
              disabled={isStreaming || disabled}
              className={cn(
                'w-full px-4 py-3 pr-12 text-sm bg-liaotao-bg-tertiary border border-liaotao-border rounded-xl text-liaotao-text-primary placeholder-liaotao-text-muted resize-none transition-colors',
                'focus:border-liaotao-accent focus:ring-1 focus:ring-liaotao-accent focus:outline-none',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              style={{ height: `${height}px`, minHeight: '44px', maxHeight: '200px' }}
              rows={1}
              aria-label="Chat input"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStop}
              disabled={!isStreaming}
              aria-label="Stop generation"
              className="h-10 flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (text.trim() && !isStreaming && !disabled) {
                  onSend(text.trim())
                  setText('')
                  setHeight(44)
                }
              }}
              disabled={!text.trim() || isStreaming || disabled}
              aria-label={t('chat.send')}
              className="h-10 flex-shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}