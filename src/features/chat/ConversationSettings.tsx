// ConversationSettings.tsx — Panel for the system prompt and the temperature of the conversation

import { useTranslation } from 'react-i18next'

/** Temperature used when the engine default is unticked. */
const DEFAULT_CHOICE = 0.7

interface ConversationSettingsProps {
  systemPrompt: string
  onSystemPrompt: (value: string) => void
  /** null = the engine's own default temperature */
  temperature: number | null
  onTemperature: (value: number | null) => void
}

export default function ConversationSettings({
  systemPrompt,
  onSystemPrompt,
  temperature,
  onTemperature,
}: ConversationSettingsProps) {
  const { t } = useTranslation()
  const useDefault = temperature === null

  return (
    <section className="flex flex-col gap-3 rounded border border-liaotao-border bg-liaotao-bg-secondary p-4">
      <label className="flex flex-col gap-1">
        <span className="text-liaotao-text-secondary">{t('chat.systemPrompt')}</span>
        <textarea
          className="resize-none rounded border bg-liaotao-bg-tertiary p-2"
          rows={2}
          value={systemPrompt}
          placeholder={t('chat.systemPromptHint')}
          onChange={(e) => onSystemPrompt(e.target.value)}
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useDefault}
            onChange={(e) => onTemperature(e.target.checked ? null : DEFAULT_CHOICE)}
          />
          <span>{t('chat.temperatureDefault')}</span>
        </label>

        {temperature !== null && (
          <label className="flex min-w-[240px] flex-1 items-center gap-3">
            <span className="text-liaotao-text-secondary">{t('chat.temperature')}</span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              className="flex-1 accent-liaotao-accent"
              onChange={(e) => onTemperature(Number(e.target.value))}
            />
            <span className="w-8 text-right tabular-nums">{temperature.toFixed(1)}</span>
          </label>
        )}
      </div>
    </section>
  )
}
