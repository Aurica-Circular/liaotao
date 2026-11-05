// useChatStream.ts — One streamed answer: text as it arrives, status, raw error, metrics

import { useCallback, useRef, useState } from 'react'
import { ChatInput, GenerationMetrics, StreamEvent, stopChat, streamChat } from '../lib/engine'

/** waiting: request sent, nothing back yet · thinking: reasoning, no answer text yet */
export type StreamStatus =
  | 'idle' | 'waiting' | 'thinking' | 'streaming' | 'done' | 'stopped' | 'failed'

export function useChatStream() {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<GenerationMetrics | null>(null)
  const currentId = useRef<string | null>(null)

  const send = useCallback(async (input: ChatInput) => {
    const id = crypto.randomUUID()
    currentId.current = id
    setText('')
    setError(null)
    setMetrics(null)
    setStatus('waiting')

    const onEvent = (e: StreamEvent) => {
      if (currentId.current !== id) return // a newer generation replaced this one
      switch (e.event) {
        case 'started':
          break // still waiting until the first piece of thought or text
        case 'thinking':
          setStatus((s) => (s === 'streaming' ? s : 'thinking'))
          break
        case 'delta':
          setStatus('streaming')
          setText((t) => t + e.text)
          break
        case 'finished':
          setMetrics(e.metrics)
          setStatus(e.stopped ? 'stopped' : 'done')
          break
        case 'failed':
          setError(e.message)
          setStatus('failed')
          break
      }
    }

    try {
      await streamChat(id, input, onEvent)
    } catch (err) {
      setError(String(err))
      setStatus('failed')
    }
  }, [])

  const stop = useCallback(() => {
    if (currentId.current) void stopChat(currentId.current)
  }, [])

  const busy = status === 'waiting' || status === 'thinking' || status === 'streaming'
  return { text, status, error, metrics, busy, send, stop }
}
