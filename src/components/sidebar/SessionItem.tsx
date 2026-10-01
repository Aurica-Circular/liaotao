import { formatTime, truncate } from '../../utils/helpers'
import { cn } from '../../utils/helpers'
import { Button } from '../ui'
import type { ChatSession } from '../../types'
import { useTranslation } from 'react-i18next'

interface SessionItemProps {
  session: ChatSession
  isActive: boolean
  onClick: () => void
  onDelete?: (id: string, e: React.MouseEvent) => void
}

export function SessionItem({ session, isActive, onClick, onDelete }: SessionItemProps) {
  const { t } = useTranslation()

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={cn(
          'sidebar-item w-full text-left',
          isActive && 'sidebar-item-active'
        )}
        aria-current={isActive ? 'true' : 'false'}
      >
        <div className="flex-1 min-w-0 text-left">
          <p className="font-medium truncate">{session.title || 'Untitled'}</p>
          <p className="text-xs truncate text-liaotao-text-muted">
            {session.model} • {formatTime(session.updatedAt)}
          </p>
        </div>
      </button>

      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(session.id, e)
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={t('common.delete')}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Button>
      )}
    </div>
  )
}