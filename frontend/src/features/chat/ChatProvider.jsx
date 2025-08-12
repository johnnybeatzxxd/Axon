import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  // Conversations, messages, folders
  const initialConversationId = useMemo(() => crypto.randomUUID(), [])

  const [conversations, setConversations] = useState(() => [
    { id: initialConversationId, title: 'New chat', lastMessage: '', updatedAt: Date.now() },
  ])

  const [activeConversationId, setActiveConversationId] = useState(initialConversationId)

  const [messagesByConversation, setMessagesByConversation] = useState(() => ({
    [initialConversationId]: [],
  }))

  const [folders, setFolders] = useState([])

  const truncateTitleFromMessage = useCallback((message) => {
    const max = 24
    const trimmed = message.trim()
    if (trimmed.length <= max) return trimmed
    const slice = trimmed.slice(0, max)
    const lastSpace = slice.lastIndexOf(' ')
    return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trim() + '…'
  }, [])

  const messages = useMemo(
    () => messagesByConversation[activeConversationId] || [],
    [messagesByConversation, activeConversationId]
  )

  const sendMessage = useCallback((text) => {
    const id = crypto.randomUUID()
    setMessagesByConversation((prev) => ({
      ...prev,
      [activeConversationId]: [
        ...(prev[activeConversationId] || []),
        { id, role: 'user', text },
      ],
    }))

    setConversations((prev) => prev.map((c) => {
      if (c.id !== activeConversationId) return c
      const nextTitle = (!c.title || c.title === 'New chat')
        ? truncateTitleFromMessage(text)
        : c.title
      return { ...c, title: nextTitle, lastMessage: text, updatedAt: Date.now() }
    }))

    // Move conversation to top within its folder and move that folder to top
    setFolders((prev) => {
      const index = prev.findIndex((f) => f.conversationIds.includes(activeConversationId))
      if (index === -1) return prev
      const folder = prev[index]
      const newConvIds = [
        activeConversationId,
        ...folder.conversationIds.filter((cid) => cid !== activeConversationId),
      ]
      const updatedFolder = { ...folder, conversationIds: newConvIds }
      const next = [...prev]
      next.splice(index, 1)
      next.unshift(updatedFolder)
      return next
    })
  }, [activeConversationId, truncateTitleFromMessage])

  const createConversation = useCallback((targetFolderId) => {
    // If a folder is targeted, avoid creating a new empty chat if one already exists in that folder.
    if (targetFolderId) {
      const targetFolder = folders.find((f) => f.id === targetFolderId)
      if (targetFolder) {
        const existingEmptyInFolder = targetFolder.conversationIds.find((convId) => {
          const msgs = messagesByConversation[convId]
          return Array.isArray(msgs) && msgs.length === 0
        })
        if (existingEmptyInFolder) {
          setActiveConversationId(existingEmptyInFolder)
          return existingEmptyInFolder
        }
      }
    } else {
      // No folder targeted: try to reuse an existing empty conversation.
      // 1) Reuse any empty unfiled conversation
      const allFiledIds = new Set(
        folders.flatMap((f) => f.conversationIds)
      )
      const emptyUnfiled = conversations.find((c) => {
        if (allFiledIds.has(c.id)) return false
        const msgs = messagesByConversation[c.id]
        return Array.isArray(msgs) && msgs.length === 0
      })
      if (emptyUnfiled) {
        setActiveConversationId(emptyUnfiled.id)
        return emptyUnfiled.id
      }
      // 2) Reuse empty in existing Untitled folder, if present
      const untitled = folders.find((f) => f.name === 'Untitled')
      if (untitled) {
        const emptyInUntitled = untitled.conversationIds.find((convId) => {
          const msgs = messagesByConversation[convId]
          return Array.isArray(msgs) && msgs.length === 0
        })
        if (emptyInUntitled) {
          setActiveConversationId(emptyInUntitled)
          return emptyInUntitled
        }
      }
    }

    const id = crypto.randomUUID()
    const title = 'New chat'
    const newConv = { id, title, lastMessage: '', updatedAt: Date.now() }
    setConversations((prev) => [newConv, ...prev])
    setMessagesByConversation((prev) => ({ ...prev, [id]: [] }))
    setActiveConversationId(id)

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
      return next.map((f) => (
        f.id === untitled.id ? { ...f, conversationIds: [id, ...f.conversationIds] } : f
      ))
    })

    return id
  }, [folders, conversations, messagesByConversation])

  const deleteConversation = useCallback((conversationId) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId))
    setMessagesByConversation((prev) => {
      const next = { ...prev }
      delete next[conversationId]
      return next
    })
    setFolders((prev) => prev.map((f) => ({
      ...f,
      conversationIds: f.conversationIds.filter((id) => id !== conversationId),
    })))
    if (activeConversationId === conversationId) {
      setActiveConversationId((prev) => {
        if (prev !== conversationId) return prev
        return (conversations.find((c) => c.id !== conversationId)?.id) || null
      })
    }
  }, [activeConversationId, conversations])

  const createFolder = useCallback(() => {
    const existingUntitled = folders.find(
      (f) => f.name === 'Untitled' && (!f.conversationIds || f.conversationIds.length === 0)
    )
    if (existingUntitled) return existingUntitled.id
    const id = crypto.randomUUID()
    setFolders((prev) => [{ id, name: 'Untitled', conversationIds: [] }, ...prev])
    return id
  }, [folders])

  const moveConversationToFolder = useCallback((conversationId, folderId) => {
    setFolders((prev) => {
      // Remove from all folders first
      const removed = prev.map((f) => ({
        ...f,
        conversationIds: f.conversationIds.filter((id) => id !== conversationId),
      }))
      if (!folderId) return removed
      return removed.map((f) => (
        f.id === folderId
          ? { ...f, conversationIds: Array.from(new Set([ ...f.conversationIds, conversationId ])) }
          : f
      ))
    })
  }, [])

  const renameFolder = useCallback((folderId, newName) => {
    const name = ((newName ?? '').trim() || 'Untitled').slice(0, 20)
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name } : f)))
  }, [])

  const renameConversation = useCallback((conversationId, newTitle) => {
    const title = (newTitle ?? '').trim() || 'New chat'
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, title } : c)))
  }, [])

  const deleteFolder = useCallback((folderId) => {
    const folder = folders.find((f) => f.id === folderId)
    if (!folder) return
    const toDelete = new Set(folder.conversationIds)

    setFolders((prev) => prev.filter((f) => f.id !== folderId))
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
  }, [folders, activeConversationId])

  const reorderFolders = useCallback((nextFolders) => {
    setFolders(nextFolders)
  }, [])

  const value = useMemo(() => ({
    // state
    conversations,
    activeConversationId,
    messagesByConversation,
    messages,
    folders,
    // actions
    setActiveConversationId,
    sendMessage,
    createConversation,
    deleteConversation,
    createFolder,
    moveConversationToFolder,
    renameFolder,
    renameConversation,
    deleteFolder,
    reorderFolders,
  }), [
    conversations,
    activeConversationId,
    messagesByConversation,
    messages,
    folders,
    sendMessage,
    createConversation,
    deleteConversation,
    createFolder,
    moveConversationToFolder,
    renameFolder,
    renameConversation,
    deleteFolder,
    reorderFolders,
  ])

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}


