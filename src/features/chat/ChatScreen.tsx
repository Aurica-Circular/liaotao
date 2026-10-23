// ChatScreen.tsx — Minimal screen to see an answer stream in; grows into the chat (task 1.6)

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Engine, getDefaultEngine, listModels } from '../../lib/engine'
import { useChatStream } from '../../hooks/useChatStream'
import logo from '../../../Liaotao-logo.svg'

export default function ChatScreen() {
  const { t } = useTranslation()
  const [engine, setEngine] = useState<Engine | null>(null)
  const [models, setModels] = useState<string[]>([])
  const [model, setModel] = useState('')
  const [engineError, setEngineError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const stream = useChatStream()

  useEffect(() => {
    getDefaultEngine()
      .then(async (e) => {
        if (!e) return
        setEngine(e)
        const found = await listModels(e)
        setModels(found)
        setModel(found[0] ?? '')
      })
      .catch((err) => setEngineError(String(err)))
  }, [])

  const send = () => {
    if (!engine || !model || !prompt.trim() || stream.busy) return
    void stream.send({ engine, model, messages: [{ role: 'user', content: prompt }] })
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
      </header>

      {engineError && (
        <p className="text-liaotao-error">{t('chat.engineError', { message: engineError })}</p>
      )}

      <section className="flex-1 overflow-auto whitespace-pre-wrap rounded border bg-liaotao-bg-secondary p-4">
        {stream.text}
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
