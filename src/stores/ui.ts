import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UISettings {
  fontSize: number
  showTimestamps: boolean
  compactMode: boolean
  language: string
  setFontSize: (size: number) => void
  setShowTimestamps: (show: boolean) => void
  setCompactMode: (compact: boolean) => void
  setLanguage: (lang: string) => void
}

export const useUISettingsStore = create<UISettings>()(
  persist(
    (set) => ({
      fontSize: 13,
      showTimestamps: true,
      compactMode: false,
      language: 'en',
      setFontSize: (fontSize) => set({ fontSize }),
      setShowTimestamps: (showTimestamps) => set({ showTimestamps }),
      setCompactMode: (compactMode) => set({ compactMode }),
      setLanguage: (language) => set({ language }),
    }),
    { name: 'liaotao-ui-settings' }
  )
)