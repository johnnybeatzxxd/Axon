import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LeftNavigator from './components/LeftNavigator'
import ChatPage from './pages/ChatPage'
import SettingsPage from './pages/SettingsPage'
import LibraryPage from './pages/LibraryPage'
import NotFoundPage from './pages/NotFoundPage'
import useChatState from './state/useChatState'

function App() {
  const [isNavCollapsed, setIsNavCollapsed] = useState(true)
  const [isNavPinned, setIsNavPinned] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  // Close mobile drawer on viewport resize to desktop to avoid stuck state
  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 768 && isMobileNavOpen) setIsMobileNavOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isMobileNavOpen])

  const {
    conversations,
    activeConversationId,
    messagesByConversation,
    messages,
    folders,
    setActiveConversationId,
    handleSend,
    handleNewConversation,
    handleOpenSettings,
    handleCreateFolder,
    handleMoveConversationToFolder,
    handleRenameFolder,
    handleRenameConversation,
    handleDeleteConversation,
    handleDeleteFolder,
    handleReorderFolders,
  } = useChatState()

  return (
    <div className={isNavCollapsed ? 'app app--nav-collapsed' : 'app'}>
      <LeftNavigator
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          setActiveConversationId(id)
          // navigate handled by link buttons in the nav in future
          if (isMobileNavOpen) setIsMobileNavOpen(false)
        }}
        onNewConversation={handleNewConversation}
        onOpenSettings={handleOpenSettings}
        folders={folders}
        onCreateFolder={handleCreateFolder}
        onMoveConversationToFolder={handleMoveConversationToFolder}
        onRenameFolder={handleRenameFolder}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onReorderFolders={handleReorderFolders}
        isCollapsed={isNavCollapsed}
        onToggleCollapsed={() => setIsNavCollapsed((v) => !v)}
        isPinned={isNavPinned}
        onPin={() => {
          setIsNavPinned(true)
          setIsNavCollapsed(false)
        }}
        onUnpin={() => {
          setIsNavPinned(false)
          setIsNavCollapsed(true)
        }}
        onHoverEnter={() => {
          if (!isNavPinned) setIsNavCollapsed(false)
        }}
        onHoverLeave={() => {
          if (!isNavPinned) setIsNavCollapsed(true)
        }}
        onDeleteFolder={handleDeleteFolder}
        isDrawerOpen={isMobileNavOpen}
        onRequestCloseDrawer={() => setIsMobileNavOpen(false)}
      />

      {isMobileNavOpen && (
        <button
          className="drawer-overlay"
          aria-label="Close navigator"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      <Routes>
        <Route path="/" element={<ChatPage messages={messages} onSend={handleSend} onOpenNav={() => setIsMobileNavOpen(true)} />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/chat/:id" element={<ChatPage messages={messages} onSend={handleSend} onOpenNav={() => setIsMobileNavOpen(true)} />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default App
