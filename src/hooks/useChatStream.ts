// useChatStream.ts — One streamed answer: text as it arrives, status, raw error, duration

import { useCallback, useRef, useState } from 'react'
import { ChatRequest, StreamEvent, stopChat, streamChat } from '../lib/engine'

export type StreamStatus = 'idle' | 'waiting' | 'streaming' | 'done' | 'stopped' | 'failed'

export function useChatStream() {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [durationMs, setDurationMs] = useState<number | null>(null)
  const currentId = useRef<string | null>(null)

  const send = useCallback(async (request: ChatRequest) => {
    const id = crypto.randomUUID()
    currentId.current = id
    setText('')
    setError(null)
    setDurationMs(null)
    setStatus('waiting')

    const onEvent = (e: StreamEvent) => {
      if (currentId.current !== id) return // a newer generation replaced this one
      switch (e.event) {
        case 'started':
          setStatus('streaming')
          break
        case 'delta':
          setText((t) => t + e.text)
          break
        case 'finished':
          setDurationMs(e.durationMs)
          setStatus(e.stopped ? 'stopped' : 'done')
          break
        case 'failed':
          setError(e.message)
          setStatus('failed')
          break
      }
    }

    try {
      await streamChat(id, request, onEvent)
    } catch (err) {
      setError(String(err))
      setStatus('failed')
    }
  }, [])

  const stop = useCallback(() => {
    if (currentId.current) void stopChat(currentId.current)
  }, [])

  const busy = status === 'waiting' || status === 'streaming'
  return { text, status, error, durationMs, busy, send, stop }
}
