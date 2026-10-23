// KeyStorageChoice.tsx — Radio choice of where API keys are kept (settings file or system keychain)

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyStorage, getKeyStorage, setKeyStorage } from '../../lib/engine'

const OPTIONS: KeyStorage[] = ['file', 'keychain']

export default function KeyStorageChoice() {
  const { t } = useTranslation()
  const [value, setValue] = useState<KeyStorage>('file')
  const [error, setError] = useState<string | null>(null)

  const load = () =>
    getKeyStorage()
      .then(setValue)
      .catch((err) => setError(String(err)))

  useEffect(() => {
    void load()
  }, [])

  const change = (next: KeyStorage) => {
    setError(null)
    setKeyStorage(next)
      .then(() => setValue(next))
      .catch((err) => {
        setError(String(err))
        void load()
      })
  }

  const title: Record<KeyStorage, string> = {
    file: t('settings.storageFile'),
    keychain: t('settings.storageKeychain'),
  }
  const help: Record<KeyStorage, string> = {
    file: t('settings.storageFileHelp'),
    keychain: t('settings.storageKeychainHelp'),
  }

  return (
    <div className="flex flex-col gap-3">
      {OPTIONS.map((option) => (
        <label
          key={option}
          className="flex cursor-pointer items-start gap-3 rounded border border-liaotao-border bg-liaotao-bg-secondary p-3"
        >
          <input
            type="radio"
            name="key-storage"
            value={option}
            checked={value === option}
            onChange={() => change(option)}
            className="mt-1"
          />
          <span className="flex flex-col">
            <span className="text-liaotao-text-primary">{title[option]}</span>
            <span className="text-sm text-liaotao-text-secondary">{help[option]}</span>
          </span>
        </label>
      ))}
      {error && <p className="text-liaotao-error">{error}</p>}
    </div>
  )
}
