import { useEffect, useMemo, useRef, useState } from 'react'
import { ChatWebSocketClient, resolveWebSocketUrl } from '@/services/wsClient'

// Helpers
function truncateTitleFromMessage(message) {
  const max = 24
  const trimmed = (message || '').trim()
  if (trimmed.length <= max) return trimmed
  const slice = trimmed.slice(0, max)
  const lastSpace = slice.lastIndexOf(' ')
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trim() + '…'
}

function getFirstTextPart(message) {
  if (!message) return ''
  if (Array.isArray(message.parts)) {
    const p = message.parts.find((pt) => pt.type === 'text')
    return p?.text ?? ''
  }
  return typeof message.text === 'string' ? message.text : ''
}

export default function useChatState() {
  // Conversations list
  const initialConversationId = useMemo(() => crypto.randomUUID(), [])
  const [conversations, setConversations] = useState(() => [
    { id: initialConversationId, title: 'New chat', lastMessage: '', updatedAt: Date.now() },
  ])
  const [activeConversationId, setActiveConversationId] = useState(initialConversationId)

  // Messages per conversation (seeded with a sample for testing)
  const [messagesByConversation, setMessagesByConversation] = useState(() => ({
    [initialConversationId]: [
      {
        id: 'm1',
        role: 'user',
        parts: [{ type: 'text', text: 'Build me a dark themed landing page in Next.js...' }],
      },
      {
        id: 'm2',
        role: 'assistant',
        parts: [
          { type: 'reasoning', text: 'I will plan the sections and verify styling approach.' },
          { type: 'tasks', title: 'Build Axon from the ground up', items: ['Scaffold page', 'Add hero', 'Add features', 'Add pricing'] },
          { type: 'tools', header: { type: 'web.search', state: 'output-available' }, input: { query: 'dark theme Tailwind UX' }, output: '• Prefer neutral grays...' },
          { type: 'text', text: 'Here is the page:\n```py\n const name = \"Johnnybeatz\"\n```' },
        ],
      },
    ],
  }))

  // Folders
  const [folders, setFolders] = useState([])

  // Derived messages for active conversation
  const messages = useMemo(
    () => messagesByConversation[activeConversationId] || [],
    [messagesByConversation, activeConversationId]
  )

  // Track current active conversation for routing incoming messages
  const activeConvRef = useRef(activeConversationId)
  useEffect(() => {
    activeConvRef.current = activeConversationId
  }, [activeConversationId])

  // WebSocket client
  const wsRef = useRef(null)
  useEffect(() => {
    const client = new ChatWebSocketClient({ url: resolveWebSocketUrl() })
    wsRef.current = client
    client.connect()
    const off = client.addMessageListener((data) => {
      // Expecting backend to send assistant message frames
      // Accept both { conversationId, message } or { role, parts, id }
      const { conversationId, message, id, role, parts, text } = data || {}
      const targetConversationId = conversationId || activeConvRef.current
      if (!targetConversationId) return

      let msg = message
      if (!msg && (role && (parts || text))) {
        msg = { id: id || crypto.randomUUID(), role, parts: Array.isArray(parts) ? parts : [{ type: 'text', text }] }
      }
      if (!msg) return

      setMessagesByConversation((prev) => ({
        ...prev,
        [targetConversationId]: [...(prev[targetConversationId] || []), msg],
      }))
    })
    // Keepalive ping
    const keepalive = setInterval(() => {
      const ping = { event: 'ping', ts: Date.now() }
      try { wsRef.current?.sendJson(ping) } catch (_) {}
    }, 15000)

    return () => {
      off?.()
      clearInterval(keepalive)
      client.disconnect()
    }
  // Connect once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handlers
  function handleSend(text) {
    if (!text || !text.trim()) return
    const id = crypto.randomUUID()
    const newMsg = { id, role: 'user', parts: [{ type: 'text', text }] }

    setMessagesByConversation((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), newMsg],
    }))

    setConversations((prev) => prev.map((c) => {
      if (c.id !== activeConversationId) return c
      const titleSource = getFirstTextPart(newMsg) || text
      const nextTitle = (!c.title || c.title === 'New chat') ? truncateTitleFromMessage(titleSource) : c.title
      return { ...c, title: nextTitle, lastMessage: titleSource, updatedAt: Date.now() }
    }))

    // Send to backend via WebSocket
    try {
      wsRef.current?.sendJson({ event: 'user_message', payload: { conversationId: activeConversationId, message: newMsg } })
    } catch (_) { /* ignore send errors */ }
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

  return {
    // state
    conversations,
    activeConversationId,
    messagesByConversation,
    messages,
    folders,
    // setters when needed externally
    setActiveConversationId,
    setConversations,
    setMessagesByConversation,
    setFolders,
    // actions
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
  }
}


