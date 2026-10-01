import { Plus, Trash2, Search, Settings, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../utils/helpers'
import { Button } from '../ui'
import { SessionItem } from './SessionItem'
import { Modal } from '../ui'
import { useChatStore } from '../../stores'
import { useTranslation } from 'react-i18next'

export function Sidebar() {
  const { t } = useTranslation()
  const { sessions, activeSessionId, createSession, setActiveSession, deleteSession, clearAllSessions } = useChatStore()
  const { activeProvider } = useChatStore()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNewChat = () => {
    if (activeProvider) {
      const session = createSession(activeProvider.id, activeProvider.defaultModel)
      setActiveSession(session.id)
    }
  }

  const handleClearHistory = () => {
    setShowClearConfirm(true)
  }

  const confirmClearHistory = () => {
    clearAllSessions()
    setShowClearConfirm(false)
  }

  return (
    <div className="w-72 flex flex-col border-r border-liaotao-border bg-liaotao-bg-secondary">
      {/* Header */}
      <div className="p-4 border-b border-liaotao-border">
        <h1 className="text-lg font-semibold text-liaotao-text-primary flex items-center gap-2">
          <span className="text-liaotao-accent">Liaotao</span>
        </h1>
      </div>

      {/* New Chat Button */}
      <div className="p-3 border-b border-liaotao-border">
        <Button
          variant="primary"
          className="w-full"
          onClick={handleNewChat}
          disabled={!activeProvider}
        >
          <Plus className="h-4 w-4" />
          <span>{t('sidebar.newChat')}</span>
        </Button>
        {!activeProvider && (
          <p className="text-xs text-liaotao-text-muted text-center mt-2">
            Configure a provider in Settings first
          </p>
        )}
      </div>

      {/* Search */}
      <div className="p-3 border-b border-liaotao-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-liaotao-text-muted" />
          <input
            type="text"
            placeholder={t('sidebar.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-liaotao-bg-tertiary border border-liaotao-border rounded-lg text-liaotao-text-primary placeholder-liaotao-text-muted focus:border-liaotao-accent focus:ring-1 focus:ring-liaotao-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredSessions.length === 0 ? (
          <div className="py-8 text-center text-liaotao-text-muted">
            <p className="text-sm">{t('sidebar.noChats')}</p>
            <p className="text-xs mt-1">Click "New Chat" to start</p>
          </div>
        ) : (
          <ul className="space-y-1" role="list" aria-label="Chat sessions">
            {filteredSessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={activeSessionId === session.id}
                onClick={() => setActiveSession(session.id)}
                onDelete={deleteSession}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-liaotao-border space-y-2">
        <Button
          variant="danger"
          className="w-full justify-start"
          onClick={handleClearHistory}
          disabled={sessions.length === 0}
        >
          <Trash2 className="h-4 w-4" />
          <span>{t('sidebar.clearHistory')}</span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            // Navigate to settings - would need routing
            console.openSettings?.()
          }}
        >
          <Settings className="h-4 w-4" />
          <span>{t('sidebar.settings')}</span>
        </Button>
      </div>

      {/* Clear History Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title={t('sidebar.clearHistory')}
        size="sm"
      >
        <p className="text-liaotao-text-secondary mb-6">{t('sidebar.confirmClear')}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={confirmClearHistory}>
            {t('common.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}