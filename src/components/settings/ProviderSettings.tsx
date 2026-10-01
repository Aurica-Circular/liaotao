import { useState } from 'react'
import { Plus, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '../../utils/helpers'
import { Button, Input, Select, Modal, Card } from '../ui'
import { useProviders } from '../../hooks/useProviders'
import { useTranslation } from 'react-i18next'
import type { ProviderConfig, ProviderType } from '../../types'

const PROVIDER_TYPES: Array<{ value: ProviderType; label: string }> = [
  { value: 'openai', label: 'OpenAI Compatible' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'llamacpp', label: 'llama.cpp' },
]

const DEFAULT_ENDPOINTS: Record<ProviderType, string> = {
  openai: 'https://api.openai.com/v1',
  ollama: 'http://localhost:11434',
  llamacpp: 'http://localhost:8080',
}

const DEFAULT_MODELS: Record<ProviderType, string> = {
  openai: 'gpt-3.5-turbo',
  ollama: 'llama3.1',
  llamacpp: 'llama-3.1',
}

export function ProviderSettings() {
  const { t } = useTranslation()
  const { providers, createProvider, updateProvider, deleteProvider, testConnection } = useProviders()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<ProviderConfig>>({
    type: 'openai',
    name: '',
    endpoint: '',
    apiKey: '',
    defaultModel: '',
    timeout: 120000,
  })

  const handleTypeChange = (type: ProviderType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      endpoint: DEFAULT_ENDPOINTS[type],
      defaultModel: DEFAULT_MODELS[type],
    }))
  }

  const resetForm = () => {
    setFormData({
      type: 'openai',
      name: '',
      endpoint: DEFAULT_ENDPOINTS.openai,
      apiKey: '',
      defaultModel: DEFAULT_MODELS.openai,
      timeout: 120000,
    })
    setEditingProvider(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingProvider) {
      await updateProvider(editingProvider.id, formData)
    } else {
      await createProvider(formData as Omit<ProviderConfig, 'id'>)
    }
    resetForm()
    setShowAddModal(false)
  }

  const handleEdit = (provider: ProviderConfig) => {
    setEditingProvider(provider)
    setFormData({
      name: provider.name,
      type: provider.type,
      endpoint: provider.endpoint,
      apiKey: provider.apiKey,
      defaultModel: provider.defaultModel,
      timeout: provider.timeout,
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm(t('common.confirm'))) {
      await deleteProvider(id)
    }
  }

  const handleTest = async (provider: ProviderConfig) => {
    setTestingId(provider.id)
    try {
      const result = await testConnection(provider)
      if (result.success) {
        alert(t('settings.connectionSuccess'))
      } else {
        alert(t('settings.connectionFailed', { error: result.error || 'Unknown error' }))
      }
    } finally {
      setTestingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Providers List */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-liaotao-border flex items-center justify-between">
          <h2 className="text-lg font-medium">{t('settings.providers')}</h2>
          <Button variant="primary" size="sm" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus className="h-4 w-4" />
            {t('settings.addProvider')}
          </Button>
        </div>

        {providers.length === 0 ? (
          <div className="p-8 text-center text-liaotao-text-muted">
            <p>{t('settings.providers')}</p>
            <p className="text-sm mt-1">Click "Add Provider" to configure your first LLM provider</p>
          </div>
        ) : (
          <div className="divide-y divide-liaotao-border">
            {providers.map((provider) => (
              <div key={provider.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{provider.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-liaotao-bg-tertiary rounded">{provider.type}</span>
                  </div>
                  <p className="text-sm text-liaotao-text-muted truncate mt-1">
                    {provider.endpoint} • {provider.defaultModel}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTest(provider)}
                    disabled={testingId === provider.id}
                  >
                    {testingId === provider.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {provider.lastTestSuccess ? (
                          <CheckCircle className="h-4 w-4 text-liaotao-success" />
                        ) : provider.lastTestError ? (
                          <AlertCircle className="h-4 w-4 text-liaotao-error" />
                        ) : (
                          <span>{t('settings.testConnection')}</span>
                        )}
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(provider)}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(provider.id)} className="text-liaotao-error hover:text-liaotao-error">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}