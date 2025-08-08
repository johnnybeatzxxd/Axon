import { Routes, Route, Navigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import LeftNavigator from './components/LeftNavigator'
import ChatWindow from './components/ChatWindow'
import SettingsPage from './pages/SettingsPage'
import LibraryPage from './pages/LibraryPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const [isNavCollapsed, setIsNavCollapsed] = useState(true)
  const [isNavPinned, setIsNavPinned] = useState(false)
  const [conversations, setConversations] = useState([
    { id: 'design', title: 'Design Tips', lastMessage: 'Let’s refine dark gradients', updatedAt: Date.now() - 5000 },
  ])
  const [activeConversationId, setActiveConversationId] = useState('design')
  const [messagesByConversation, setMessagesByConversation] = useState({
    design: [
      { id: 'm2', role: 'assistant', text: 'We can iterate on your UI ideas.' },
    ],
  })

  // Folder state: each folder owns an ordered list of conversationIds
  const [folders, setFolders] = useState([
    { id: 'ideas', name: 'Ideas', conversationIds: ['design'] },
  ])

  function truncateTitleFromMessage(message) {
    const max = 24
    const trimmed = message.trim()
    if (trimmed.length <= max) return trimmed
    const slice = trimmed.slice(0, max)
    const lastSpace = slice.lastIndexOf(' ')
    return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trim() + '…'
  }

  const messages = useMemo(() => messagesByConversation[activeConversationId] || [], [messagesByConversation, activeConversationId])

  function handleSend(text) {
    const id = crypto.randomUUID()
    setMessagesByConversation((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), { id, role: 'user', text }],
    }))
    setConversations((prev) => prev.map((c) => {
      if (c.id !== activeConversationId) return c
      const nextTitle = (!c.title || c.title === 'New chat') ? truncateTitleFromMessage(text) : c.title
      return { ...c, title: nextTitle, lastMessage: text, updatedAt: Date.now() }
    }))

    // Move conversation to top within its folder and move that folder to top
    setFolders((prev) => {
      const index = prev.findIndex((f) => f.conversationIds.includes(activeConversationId))
      if (index === -1) return prev
      const folder = prev[index]
      const newConvIds = [activeConversationId, ...folder.conversationIds.filter((cid) => cid !== activeConversationId)]
      const updatedFolder = { ...folder, conversationIds: newConvIds }
      const next = [...prev]
      next.splice(index, 1)
      next.unshift(updatedFolder)
      return next
    })
  }

  function handleNewConversation(targetFolderId) {
    const id = crypto.randomUUID()
    const title = 'New chat'
    const newConv = { id, title, lastMessage: '', updatedAt: Date.now() }
    setConversations((prev) => [newConv, ...prev])
    setMessagesByConversation((prev) => ({ ...prev, [id]: [] }))
    setActiveConversationId(id)
    // Place into target folder or Untitled
    setFolders((prev) => {
      const next = [...prev]
      if (targetFolderId) {
        const index = next.findIndex((f) => f.id === targetFolderId)
        if (index !== -1) {
          const folder = next[index]
          const updatedFolder = { ...folder, conversationIds: [id, ...folder.conversationIds] }
          next.splice(index, 1)
          next.unshift(updatedFolder)
          return next
        }
      }
      // Fallback to Untitled
      let untitled = next.find((f) => f.name === 'Untitled')
      if (!untitled) {
        const newFolder = { id: crypto.randomUUID(), name: 'Untitled', conversationIds: [id] }
        next.unshift(newFolder)
        return next
      }
      return next.map((f) =>
        f.id === untitled.id ? { ...f, conversationIds: [id, ...f.conversationIds] } : f
      )
    })
  }

  function handleOpenSettings() {
    alert('Settings panel coming soon')
  }

  function handleCreateFolder() {
    const existingUntitled = folders.find(
      (f) => f.name === 'Untitled' && (!f.conversationIds || f.conversationIds.length === 0)
    )
    if (existingUntitled) {
      return existingUntitled.id
    }
    const id = crypto.randomUUID()
    setFolders((prev) => [{ id, name: 'Untitled', conversationIds: [] }, ...prev])
    return id
  }

  function handleMoveConversationToFolder(conversationId, folderId) {
    setFolders((prev) => {
      // Remove from all folders first
      const removed = prev.map((f) => ({
        ...f,
        conversationIds: f.conversationIds.filter((id) => id !== conversationId),
      }))
      if (!folderId) return removed
      return removed.map((f) =>
        f.id === folderId
          ? { ...f, conversationIds: Array.from(new Set([...
              f.conversationIds,
              conversationId,
            ])) }
          : f
      )
    })
  }

  function handleRenameFolder(folderId, newName) {
    const name = ((newName ?? '').trim() || 'Untitled').slice(0, 20)
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name } : f)))
  }

  function handleRenameConversation(conversationId, newTitle) {
    const title = (newTitle ?? '').trim() || 'New chat'
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, title } : c)))
  }

  function handleDeleteConversation(conversationId) {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId))
    setMessagesByConversation((prev) => {
      const next = { ...prev }
      delete next[conversationId]
      return next
    })
    setFolders((prev) => prev.map((f) => ({ ...f, conversationIds: f.conversationIds.filter((id) => id !== conversationId) })))
    if (activeConversationId === conversationId) {
      const first = conversations.find((c) => c.id !== conversationId)?.id || null
      setActiveConversationId(first)
    }
  }

  function handleDeleteFolder(folderId) {
    const folder = folders.find((f) => f.id === folderId)
    if (!folder) return
    const toDelete = new Set(folder.conversationIds)
    // Remove folder
    setFolders((prev) => prev.filter((f) => f.id !== folderId))
    // Remove conversations and messages inside the folder
    if (toDelete.size > 0) {
      setConversations((prev) => {
        const remaining = prev.filter((c) => !toDelete.has(c.id))
        if (toDelete.has(activeConversationId)) {
          const nextActive = remaining[0]?.id || null
          setActiveConversationId(nextActive)
        }
        return remaining
      })
      setMessagesByConversation((prev) => {
        const next = { ...prev }
        for (const id of toDelete) delete next[id]
        return next
      })
    }
  }

  function handleReorderFolders(nextFolders) {
    setFolders(nextFolders)
  }

  return (
    <div className={isNavCollapsed ? 'app app--nav-collapsed' : 'app'}>
      <LeftNavigator
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          setActiveConversationId(id)
          // navigate handled by link buttons in the nav in future
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
      />

      <Routes>
        <Route path="/" element={<ChatWindow messages={messages} onSend={handleSend} />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/chat/:id" element={<ChatWindow messages={messages} onSend={handleSend} />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default App
