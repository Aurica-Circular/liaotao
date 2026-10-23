// ChatScreen.tsx — The conversation: bubbles, streamed answer, send and stop

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import { ChatMessage, EngineView, listEngines, listModels } from '../../lib/engine'
import { useChatStream } from '../../hooks/useChatStream'
import logo from '../../../Liaotao-logo.svg'
import MessageBubble from './MessageBubble'

interface ChatScreenProps {
  onOpenSettings: () => void
  settingsVersion: number
}

export default function ChatScreen({ onOpenSettings, settingsVersion }: ChatScreenProps) {
  const { t } = useTranslation()
  const [engine, setEngine] = useState<EngineView | null>(null)
  const [models, setModels] = useState<string[]>([])
  const [model, setModel] = useState('')
  const [noEngine, setNoEngine] = useState(false)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const endRef = useRef<HTMLDivElement>(null)
  const stream = useChatStream()

  // Keep each finished answer in the conversation, once. Layout effect: the
  // answer moves into the list before paint, so its bubble never blinks.
  useLayoutEffect(() => {
    if ((stream.status === 'done' || stream.status === 'stopped') && stream.text !== '') {
      setMessages((m) => [...m, { role: 'assistant', content: stream.text }])
    }
  }, [stream.status])

  // Follow the conversation as messages are added and the answer grows
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, stream.text])

  useEffect(() => {
    setEngineError(null)
    listEngines()
      .then(async (engines) => {
        const e = engines[0]
        if (!e) {
          setEngine(null)
          setModels([])
          setModel('')
          setNoEngine(true)
          return
        }
        setNoEngine(false)
        setEngine(e)
        const found = await listModels({ id: e.id, base_url: e.base_url })
        setModels(found)
        setModel(found[0] ?? '')
      })
      .catch((err) => setEngineError(String(err)))
  }, [settingsVersion])

  const send = () => {
    if (!engine || !model || !prompt.trim() || stream.busy) return
    const next: ChatMessage[] = [...messages, { role: 'user', content: prompt }]
    setMessages(next)
    setPrompt('')
    void stream.send({ engine_id: engine.id, model, messages: next })
  }

  return (
    <main className="flex h-full flex-col gap-4 p-6">
      <header className="flex items-center gap-3">
        <img src={logo} alt={t('app.name')} className="h-8 w-8" />
        <span className="text-liaotao-text-secondary">{engine?.name}</span>
        <select
          className="rounded border bg-liaotao-bg-secondary px-2 py-1"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          aria-label={t('chat.model')}
        >
          {models.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <button
          className="rounded p-1 text-liaotao-text-secondary hover:text-liaotao-accent"
          onClick={onOpenSettings}
          aria-label={t('settings.open')}
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {engineError && (
        <p className="text-liaotao-error">{t('chat.engineError', { message: engineError })}</p>
      )}

      <section className="flex flex-1 flex-col gap-3 overflow-auto rounded border p-4">
        {noEngine && (
          <p className="text-liaotao-text-secondary">{t('chat.noEngine')}</p>
        )}
        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            role={m.role === 'user' ? 'user' : 'assistant'}
            content={m.content}
          />
        ))}
        {stream.busy && (
          <MessageBubble role="assistant" content={stream.text}>
            {(stream.status === 'waiting' || stream.status === 'thinking') && (
              <span className="flex items-center gap-2 text-liaotao-text-secondary">
                <span className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-liaotao-accent" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-liaotao-accent [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-liaotao-accent [animation-delay:300ms]" />
                </span>
                {t(stream.status === 'thinking' ? 'chat.thinking' : 'chat.waiting')}
              </span>
            )}
          </MessageBubble>
        )}
        <div ref={endRef} />
      </section>

      {stream.error && (
        <p className="text-liaotao-error">{t('chat.engineError', { message: stream.error })}</p>
      )}
      {stream.durationMs !== null && (
        <p className="text-sm text-liaotao-text-muted">
          {t(stream.status === 'stopped' ? 'chat.stoppedAfter' : 'chat.doneIn', {
            seconds: (stream.durationMs / 1000).toFixed(1),
          })}
        </p>
      )}

      <footer className="flex gap-3">
        <textarea
          className="flex-1 resize-none rounded border bg-liaotao-bg-secondary p-2"
          rows={3}
          value={prompt}
          placeholder={t('chat.placeholder')}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
        />
        {stream.busy ? (
          <button className="rounded border px-4 text-liaotao-accent" onClick={stream.stop}>
            {t('chat.stop')}
          </button>
        ) : (
          <button
            className="rounded border px-4 text-liaotao-accent disabled:opacity-50"
            onClick={send}
            disabled={!model || !prompt.trim()}
          >
            {t('chat.send')}
          </button>
        )}
      </footer>
    </main>
  )
}
