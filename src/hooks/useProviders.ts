import { useCallback } from 'react'
import { useProviderStore } from '../stores'
import { saveProvider, deleteProvider, testProviderConnection, getProviders } from './useTauriCommands'
import type { ProviderConfig } from '../types'

export function useProviders() {
  const { providers, activeProviderId, addProvider, updateProvider, deleteProvider: deleteProviderStore, setActiveProvider, getActiveProvider } = useProviderStore()

  const loadProviders = useCallback(async () => {
    try {
      const loaded = await getProviders()
      // Sync with store - in a real app, you'd merge these
      // For now, store is the source of truth
    } catch (error) {
      console.error('Failed to load providers:', error)
    }
  }, [])

  const createProvider = useCallback(
    async (provider: Omit<ProviderConfig, 'id'>) => {
      const newProvider: ProviderConfig = {
        ...provider,
        id: `provider-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      }
      addProvider(newProvider)
      await saveProvider(newProvider)
      setActiveProvider(newProvider.id)
      return newProvider
    },
    [addProvider, setActiveProvider]
  )

  const updateProviderConfig = useCallback(
    async (id: string, updates: Partial<ProviderConfig>) => {
      updateProvider(id, updates)
      const provider = providers.find((p) => p.id === id)
      if (provider) {
        await saveProvider({ ...provider, ...updates })
      }
    },
    [providers, updateProvider]
  )

  const removeProvider = useCallback(
    async (id: string) => {
      deleteProviderStore(id)
      await deleteProvider(id)
    },
    [deleteProviderStore]
  )

  const testConnection = useCallback(
    async (provider: ProviderConfig) => {
      return testProviderConnection(provider)
    },
    []
  )

  const switchProvider = useCallback(
    (id: string) => {
      setActiveProvider(id)
    },
    [setActiveProvider]
  )

  return {
    providers,
    activeProviderId,
    activeProvider: getActiveProvider(),
    loadProviders,
    createProvider,
    updateProvider: updateProviderConfig,
    deleteProvider: removeProvider,
    testConnection,
    switchProvider,
  }
}