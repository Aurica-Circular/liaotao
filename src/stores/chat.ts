import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatSession, ChatMessage } from '../types'

interface ChatState {
  sessions: ChatSession[]
  activeSessionId: string | null
  messages: Record<string, ChatMessage[]>
  isStreaming: boolean

  createSession: (providerId: string, model: string) => ChatSession
  setActiveSession: (id: string | null) => void
  deleteSession: (id: string) => void
  clearAllSessions: () => void
  updateSessionTitle: (id: string, title: string) => void

  addMessage: (sessionId: string, message: ChatMessage) => void
  updateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void
  deleteMessage: (sessionId: string, messageId: string) => void
  clearSessionMessages: (sessionId: string) => void

  setStreaming: (streaming: boolean) => void
  getActiveSession: () => ChatSession | undefined
  getActiveMessages: () => ChatMessage[]
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      messages: {},
      isStreaming: false,

      createSession: (providerId, model) => {
        const now = Date.now()
        const session: ChatSession = {
          id: `session-${now}-${Math.random().toString(36).slice(2, 9)}`,
          title: 'New Chat',
          providerId,
          model,
          createdAt: now,
          updatedAt: now,
          messageCount: 0,
        }
        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSessionId: session.id,
          messages: { ...state.messages, [session.id]: [] },
        }))
        return session
      },

      setActiveSession: (id) => set({ activeSessionId: id }),

      deleteSession: (id) =>
        set((state) => {
          const { [id]: _, ...restMessages } = state.messages
          const newSessions = state.sessions.filter((s) => s.id !== id)
          const newActiveId = state.activeSessionId === id
            ? newSessions[0]?.id ?? null
            : state.activeSessionId
          return {
            sessions: newSessions,
            activeSessionId: newActiveId,
            messages: restMessages,
          }
        }),

      clearAllSessions: () =>
        set({ sessions: [], activeSessionId: null, messages: {} }),

      updateSessionTitle: (id, title) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title, updatedAt: Date.now() } : s
          ),
        })),

      addMessage: (sessionId, message) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [sessionId]: [...(state.messages[sessionId] || []), message],
          },
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, messageCount: s.messageCount + 1, updatedAt: Date.now() }
              : s
          ),
        })),

      updateMessage: (sessionId, messageId, updates) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [sessionId]: (state.messages[sessionId] || []).map((m) =>
              m.id === messageId ? { ...m, ...updates } : m
            ),
          },
        })),

      deleteMessage: (sessionId, messageId) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [sessionId]: (state.messages[sessionId] || []).filter((m) => m.id !== messageId),
          },
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, messageCount: Math.max(0, s.messageCount - 1) }
              : s
          ),
        })),

      clearSessionMessages: (sessionId) =>
        set((state) => ({
          messages: { ...state.messages, [sessionId]: [] },
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, messageCount: 0 } : s
          ),
        })),

      setStreaming: (streaming) => set({ isStreaming: streaming }),

      getActiveSession: () => {
        const { sessions, activeSessionId } = get()
        return sessions.find((s) => s.id === activeSessionId)
      },

      getActiveMessages: () => {
        const { messages, activeSessionId } = get()
        return activeSessionId ? messages[activeSessionId] || [] : []
      },
    }),
    {
      name: 'liaotao-chats',
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        messages: state.messages,
      }),
    }
  )
)