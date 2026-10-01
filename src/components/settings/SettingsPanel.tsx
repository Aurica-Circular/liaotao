import { useState } from 'react'
import { Settings, Database, Palette, Globe } from 'lucide-react'
import { cn } from '../../utils/helpers'
import { Button, Card } from '../ui'
import { ProviderSettings } from './ProviderSettings'
import { useTranslation } from 'react-i18next'
import { useUISettingsStore } from '../../stores'

const TABS = [
  { id: 'providers', label: 'Providers', icon: Settings },
  { id: 'ui', label: 'Appearance', icon: Palette },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'language', label: 'Language', icon: Globe },
] as const

export function SettingsPanel() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TABS[number]['id']>('providers')
  const { fontSize, setFontSize, compactMode, setCompactMode, showTimestamps, setShowTimestamps } = useUISettingsStore()

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center gap-4 border-b border-liaotao-border pb-4">
        <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-liaotao-bg-tertiary rounded-lg p-1" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === id
                ? 'bg-liaotao-bg-primary text-liaotao-text-primary'
                : 'text-liaotao-text-secondary hover:text-liaotao-text-primary hover:bg-liaotao-bg-primary/50'
            )}
          >
            <Icon className="h-4 w-4" />
            {t(`settings.${label.toLowerCase()}`) || label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'providers' && <ProviderSettings />}

        {activeTab === 'ui' && (
          <Card>
            <h2 className="text-lg font-medium mb-4">{t('settings.ui') || 'Appearance'}</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-liaotao-text-secondary mb-2">
                  Font Size: {fontSize}px
                </label>
                <input
                  type="range"
                  min="11"
                  max="18"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-2 bg-liaotao-bg-primary rounded-lg appearance-none accent-liaotao-accent"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Compact Mode</p>
                  <p className="text-sm text-liaotao-text-muted">Reduce padding and spacing</p>
                </div>
                <button
                  onClick={() => setCompactMode(!compactMode)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors',
                    compactMode ? 'bg-liaotao-accent' : 'bg-liaotao-bg-tertiary'
                  )}
                  role="switch"
                  aria-checked={compactMode}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
                      compactMode && 'translate-x-5'
                    )}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Timestamps</p>
                  <p className="text-sm text-liaotao-text-muted">Display message timestamps</p>
                </div>
                <button
                  onClick={() => setShowTimestamps(!showTimestamps)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors',
                    showTimestamps ? 'bg-liaotao-accent' : 'bg-liaotao-bg-tertiary'
                  )}
                  role="switch"
                  aria-checked={showTimestamps}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
                      showTimestamps && 'translate-x-5'
                    )}
                  />
                </button>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'data' && (
          <Card>
            <h2 className="text-lg font-medium mb-4">{t('settings.data') || 'Data Management'}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-liaotao-bg-tertiary rounded-lg">
                <div>
                  <p className="font-medium">Export Conversations</p>
                  <p className="text-sm text-liaotao-text-muted">Download all chats as JSON</p>
                </div>
                <Button variant="secondary" size="sm">Export</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-liaotao-bg-tertiary rounded-lg">
                <div>
                  <p className="font-medium">Import Conversations</p>
                  <p className="text-sm text-liaotao-text-muted">Upload a JSON export</p>
                </div>
                <Button variant="secondary" size="sm">Import</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-liaotao-error/10 border border-liaotao-error/20 rounded-lg">
                <div>
                  <p className="font-medium text-liaotao-error">Clear All Data</p>
                  <p className="text-sm text-liaotao-error/80">Permanently delete all chats and settings</p>
                </div>
                <Button variant="danger" size="sm">Clear All</Button>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'language' && (
          <Card>
            <h2 className="text-lg font-medium mb-4">{t('settings.language') || 'Language'}</h2>
            <div className="space-y-4">
              <p className="text-liaotao-text-secondary">More languages coming soon. Currently only English is available.</p>
              <Select
                label="Language"
                options={[
                  { value: 'en', label: 'English' },
                ]}
                value="en"
                onChange={() => {}}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}