// EngineForm.tsx — Add or edit one engine: fields, connection test, save

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EngineInput, EngineView, listModels, saveEngine } from '../../lib/engine'

interface EngineFormProps {
  engine?: EngineView
  onDone: () => void
}

type TestResult = { ok: true; models: string[] } | { ok: false; message: string }

export default function EngineForm({ engine, onDone }: EngineFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(engine?.name ?? '')
  const [baseUrl, setBaseUrl] = useState(engine?.base_url ?? '')
  const [typedKey, setTypedKey] = useState('')
  const [removeKey, setRemoveKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const canSave = name.trim() !== '' && baseUrl.trim() !== '' && !saving

  const test = () => {
    setTesting(true)
    setResult(null)
    listModels({ id: engine?.id, base_url: baseUrl, api_key: typedKey || undefined })
      .then((models) => setResult({ ok: true, models }))
      .catch((err) => setResult({ ok: false, message: String(err) }))
      .finally(() => setTesting(false))
  }

  const save = () => {
    const input: EngineInput = { id: engine?.id, name, base_url: baseUrl }
    if (removeKey) input.api_key = ''
    else if (typedKey) input.api_key = typedKey
    setSaving(true)
    setSaveError(null)
    saveEngine(input)
      .then(() => onDone())
      .catch((err) => setSaveError(String(err)))
      .finally(() => setSaving(false))
  }

  return (
    <form
      className="flex flex-col gap-4 rounded border border-liaotao-border bg-liaotao-bg-secondary p-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSave) save()
      }}
    >
      <label className="flex flex-col gap-1 text-liaotao-text-secondary">
        {t('settings.name')}
        <input
          className="rounded border bg-liaotao-bg-tertiary px-2 py-1 text-liaotao-text-primary"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-liaotao-text-secondary">
        {t('settings.address')}
        <input
          className="rounded border bg-liaotao-bg-tertiary px-2 py-1 text-liaotao-text-primary"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
        />
        <span className="text-sm text-liaotao-text-muted">{t('settings.addressHint')}</span>
      </label>

      <label className="flex flex-col gap-1 text-liaotao-text-secondary">
        {t('settings.key')}
        <input
          type="password"
          className="rounded border bg-liaotao-bg-tertiary px-2 py-1 text-liaotao-text-primary"
          value={typedKey}
          placeholder={engine?.has_key ? t('settings.keyKeep') : t('settings.keyOptional')}
          onChange={(e) => setTypedKey(e.target.value)}
        />
      </label>

      {engine?.has_key && (
        <label className="flex items-center gap-2 text-liaotao-text-secondary">
          <input
            type="checkbox"
            checked={removeKey}
            onChange={(e) => setRemoveKey(e.target.checked)}
          />
          {t('settings.keyRemove')}
        </label>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="self-start rounded border px-4 py-1 text-liaotao-accent disabled:opacity-50"
          onClick={test}
          disabled={testing || baseUrl.trim() === ''}
        >
          {t('settings.test')}
        </button>
        {result?.ok === true && (
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-liaotao-success">
              <span className="h-2 w-2 rounded-full bg-liaotao-success" />
              {t('settings.testOk', { count: result.models.length })}
            </span>
            <ul className="ml-4 list-disc text-sm text-liaotao-text-secondary">
              {result.models.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
        {result?.ok === false && (
          <span className="flex items-center gap-2 text-liaotao-error">
            <span className="h-2 w-2 rounded-full bg-liaotao-error" />
            {result.message}
          </span>
        )}
      </div>

      {saveError && <p className="text-liaotao-error">{saveError}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded border px-4 py-1 text-liaotao-accent disabled:opacity-50"
          disabled={!canSave}
        >
          {t('settings.save')}
        </button>
        <button
          type="button"
          className="rounded border border-liaotao-border px-4 py-1 text-liaotao-text-secondary"
          onClick={onDone}
        >
          {t('settings.cancel')}
        </button>
      </div>
    </form>
  )
}
