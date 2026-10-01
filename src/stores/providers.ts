import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProviderConfig, ChatSession, ChatMessage } from '../types'

interface ProviderState {
  providers: ProviderConfig[]
  activeProviderId: string | null
  addProvider: (provider: ProviderConfig) => void
  updateProvider: (id: string, provider: Partial<ProviderConfig>) => void
  deleteProvider: (id: string) => void
  setActiveProvider: (id: string | null) => void
  getActiveProvider: () => ProviderConfig | undefined
}

export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
      providers: [],
      activeProviderId: null,

      addProvider: (provider) =>
        set((state) => ({
          providers: [...state.providers, provider],
          activeProviderId: state.activeProviderId ?? provider.id,
        })),

      updateProvider: (id, updates) =>
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deleteProvider: (id) =>
        set((state) => ({
          providers: state.providers.filter((p) => p.id !== id),
          activeProviderId: state.activeProviderId === id ? null : state.activeProviderId,
        })),

      setActiveProvider: (id) => set({ activeProviderId: id }),

      getActiveProvider: () => {
        const { providers, activeProviderId } = get()
        return providers.find((p) => p.id === activeProviderId)
      },
    }),
    {
      name: 'liaotao-providers',
      partialize: (state) => ({
        providers: state.providers,
        activeProviderId: state.activeProviderId,
      }),
    }
  )
)