import { useState } from 'react'
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from './utils/helpers'
import { Sidebar } from './components/sidebar'
import { ChatArea } from './components/chat'
import { SettingsPanel } from './components/settings'
import { useChatStore, useUISettingsStore } from './stores'
import { useTranslation } from 'react-i18next'

function App() {
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const { compactMode } = useUISettingsStore()
  const { activeSessionId } = useChatStore()

  return (
    <div className="h-screen w-screen flex flex-col bg-liaotao-bg-primary text-liaotao-text-primary">
      {/* Top Bar */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-liaotao-border bg-liaotao-bg-secondary/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-liaotao-bg-tertiary transition-colors lg:hidden"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="text-lg font-semibold text-liaotao-text-primary flex items-center gap-2">
            <span className="text-liaotao-accent">Liaotao</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-liaotao-bg-tertiary transition-colors"
            aria-label={showSettings ? 'Close settings' : 'Open settings'}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <aside
          className={cn(
            'w-72 flex-shrink-0 flex flex-col transition-all duration-200 ease-in-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            showSettings && !sidebarOpen && 'lg:hidden'
          )}
        >
          {showSettings ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-liaotao-border">
                <h2 className="text-lg font-medium">{t('settings.title')}</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 rounded-lg hover:bg-liaotao-bg-tertiary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SettingsPanel />
            </div>
          ) : (
            <Sidebar />
          )}
        </aside>

        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && !showSettings && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          {showSettings ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-liaotao-border">
                <h2 className="text-lg font-medium">{t('settings.title')}</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-lg hover:bg-liaotao-bg-tertiary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SettingsPanel />
            </div>
          ) : (
            <ChatArea />
          )}
        </main>

        {/* Settings Panel (Desktop - Right Sidebar) */}
        {showSettings && sidebarOpen && (
          <aside className="w-96 flex-shrink-0 flex flex-col border-l border-liaotao-border bg-liaotao-bg-secondary lg:block hidden">
            <div className="flex items-center justify-between p-4 border-b border-liaotao-border">
              <h2 className="text-lg font-medium">{t('settings.title')}</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-lg hover:bg-liaotao-bg-tertiary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SettingsPanel />
          </aside>
        )}
      </div>
    </div>
  )
}

export default App