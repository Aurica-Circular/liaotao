// App.tsx — Application root

import { useState } from 'react'
import ChatScreen from './features/chat/ChatScreen'
import SettingsPanel from './features/settings/SettingsPanel'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsVersion, setSettingsVersion] = useState(0)

  // The chat stays mounted under the settings panel, so the conversation survives
  return (
    <>
      <ChatScreen
        onOpenSettings={() => setSettingsOpen(true)}
        settingsVersion={settingsVersion}
      />
      {settingsOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-liaotao-bg-primary">
          <SettingsPanel
            onClose={() => {
              setSettingsOpen(false)
              setSettingsVersion((v) => v + 1)
            }}
          />
        </div>
      )}
    </>
  )
}
