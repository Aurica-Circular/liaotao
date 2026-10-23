// SettingsPanel.tsx — Settings screen: engines (list, add, edit, delete) and API key storage

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { EngineView, deleteEngine, listEngines } from '../../lib/engine'
import EngineForm from './EngineForm'
import KeyStorageChoice from './KeyStorageChoice'

interface SettingsPanelProps {
  onClose: () => void
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { t } = useTranslation()
  const [engines, setEngines] = useState<EngineView[]>([])
  // null = list, 'new' = add form, an engine = edit form
  const [editing, setEditing] = useState<EngineView | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = () =>
    listEngines()
      .then(setEngines)
      .catch((err) => setError(String(err)))

  useEffect(() => {
    void reload()
  }, [])

  const remove = (engine: EngineView) => {
    if (!window.confirm(t('settings.confirmDelete', { name: engine.name }))) return
    setError(null)
    deleteEngine(engine.id)
      .then(reload)
      .catch((err) => setError(String(err)))
  }

  const finishEdit = () => {
    setEditing(null)
    void reload()
  }

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-lg text-liaotao-text-primary">{t('settings.title')}</h1>
        <button
          className="rounded p-1 text-liaotao-text-secondary hover:text-liaotao-accent"
          onClick={onClose}
          aria-label={t('settings.close')}
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {error && <p className="text-liaotao-error">{error}</p>}

      <section className="flex flex-col gap-3">
        <h2 className="text-liaotao-text-secondary">{t('settings.engines')}</h2>

        {editing !== null ? (
          <EngineForm
            engine={editing === 'new' ? undefined : editing}
            onDone={finishEdit}
          />
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {engines.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded border border-liaotao-border bg-liaotao-bg-secondary p-3"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="text-liaotao-text-primary">
                      {e.name}
                      {e.has_key && (
                        <span className="ml-2 text-sm text-liaotao-text-muted">
                          {t('settings.keySaved')}
                        </span>
                      )}
                    </span>
                    <span className="truncate text-sm text-liaotao-text-secondary">{e.base_url}</span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      className="rounded border border-liaotao-border px-3 py-1 text-liaotao-accent"
                      onClick={() => setEditing(e)}
                    >
                      {t('settings.edit')}
                    </button>
                    <button
                      className="rounded border border-liaotao-border px-3 py-1 text-liaotao-error"
                      onClick={() => remove(e)}
                    >
                      {t('settings.delete')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button
              className="self-start rounded border px-4 py-2 text-liaotao-accent"
              onClick={() => setEditing('new')}
            >
              {t('settings.add')}
            </button>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-liaotao-text-secondary">{t('settings.keys')}</h2>
        <KeyStorageChoice />
      </section>
    </main>
  )
}
