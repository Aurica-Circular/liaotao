// AnswerMeta.tsx — One line under an answer: engine, model, duration, first word, speed, tokens

import { useTranslation } from 'react-i18next'
import { GenerationMetrics } from '../../lib/engine'

/** Who wrote an answer and how it went. Set when the answer ends. */
export interface AnswerInfo {
  engineName: string
  model: string
  metrics: GenerationMetrics
  /** Ended by the Stop button. */
  stopped: boolean
}

interface AnswerMetaProps {
  meta: AnswerInfo
}

const seconds = (ms: number) => (ms / 1000).toFixed(1)

export default function AnswerMeta({ meta }: AnswerMetaProps) {
  const { t } = useTranslation()
  const { metrics } = meta

  const parts: string[] = [
    t('chat.meta', {
      engine: meta.engineName,
      model: meta.model,
      seconds: seconds(metrics.durationMs),
    }),
  ]
  if (meta.stopped) {
    parts.push(t('chat.metaStopped'))
  }
  if (metrics.firstTokenMs !== null) {
    parts.push(t('chat.metaFirstToken', { seconds: seconds(metrics.firstTokenMs) }))
  }
  if (metrics.speed !== null) {
    parts.push(t('chat.metaSpeed', { speed: metrics.speed.toFixed(1), unit: metrics.speedUnit }))
  }
  if (metrics.completionTokens !== null) {
    parts.push(t('chat.metaTokens', { count: metrics.completionTokens }))
  }

  return <p className="text-sm text-liaotao-text-muted">{parts.join(' · ')}</p>
}
