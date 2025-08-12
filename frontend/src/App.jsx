import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import LeftNavigator from './components/LeftNavigator'
import { routes } from './router/routes'
import { ChatProvider, useChat } from './features/chat/ChatProvider'

// Module-level chat route element to keep component identity stable across renders
function ChatRouteElement({ openNav, onFirstMessage, messages, sendMessage }) {
  const { id } = useParams()
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
  } = useChat()

  useEffect(() => {
    if (!id) return
    if (conversations.some((c) => c.id === id) && id !== activeConversationId) {
      setActiveConversationId(id)
    }
  }, [id, conversations, activeConversationId, setActiveConversationId])

  const ChatPage = routes.find((r) => r.isChat)?.component
  return (
    <ChatPage
      messages={messages}
      onSend={(text) => {
        const wasEmpty = (messages?.length || 0) === 0
        sendMessage(text)
        // If this was the first message in the conversation, update URL immediately
        if (wasEmpty) onFirstMessage()
      }}
      onOpenNav={openNav}
    />
  )
}

function AppShell() {
  const navigate = useNavigate()
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
    setActiveConversationId,
    messagesByConversation,
    messages,
    folders,
    createConversation,
    createFolder,
    moveConversationToFolder,
    renameFolder,
    renameConversation,
    deleteConversation,
    reorderFolders,
    deleteFolder,
    sendMessage,
  } = useChat()

  const openNav = useCallback(() => setIsMobileNavOpen(true), [])

  // (removed shadowing inner ChatRouteElement)

  return (
    <div className={isNavCollapsed ? 'app app--nav-collapsed' : 'app'}>
      <LeftNavigator
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          setActiveConversationId(id)
          if (isMobileNavOpen) setIsMobileNavOpen(false)
          const hasMessages = (messagesByConversation?.[id]?.length || 0) > 0
          navigate(hasMessages ? `/chat/${id}` : `/`)
        }}
        onNewConversation={(targetFolderId) => {
          const newId = createConversation(targetFolderId)
          // Navigate to root for new chats - they get an ID in URL only after first message
          // The new chat is already set as active in the provider, so navigation will work correctly
          navigate(`/`)
        }}
        onOpenSettings={() => alert('Settings panel coming soon')}
        folders={folders}
        onCreateFolder={createFolder}
        onMoveConversationToFolder={moveConversationToFolder}
        onRenameFolder={renameFolder}
        onRenameConversation={renameConversation}
        onDeleteConversation={deleteConversation}
        onReorderFolders={reorderFolders}
        isCollapsed={isNavCollapsed}
        onToggleCollapsed={() => setIsNavCollapsed((v) => !v)}
        isPinned={isNavPinned}
        onPin={() => { setIsNavPinned(true); setIsNavCollapsed(false) }}
        onUnpin={() => { setIsNavPinned(false); setIsNavCollapsed(true) }}
        onHoverEnter={() => { if (!isNavPinned) setIsNavCollapsed(false) }}
        onHoverLeave={() => { if (!isNavPinned) setIsNavCollapsed(true) }}
        onDeleteFolder={deleteFolder}
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

      <Suspense fallback={null}>
        <Routes>
          {routes.map(({ path, component: Component, isChat }) => (
            <Route
              key={path}
              path={path}
              element={
                isChat ? (
                  <ChatRouteElement 
                    openNav={openNav} 
                    onFirstMessage={() => navigate(`/chat/${activeConversationId}`)} 
                    messages={messages}
                    sendMessage={sendMessage}
                  />
                ) : (
                  <Component />
                )
              }
            />
          ))}
          <Route path="/home" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default function App() {
  return (
    <ChatProvider>
      <AppShell />
    </ChatProvider>
  )
}
