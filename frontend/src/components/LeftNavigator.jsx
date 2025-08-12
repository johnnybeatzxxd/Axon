import { Settings, FolderClosed } from 'lucide-react'
import PropTypes from 'prop-types'
import React, { memo, useMemo, useState, useRef, useEffect, useCallback } from 'react'
 import { Link, useLocation } from 'react-router-dom'
 import AxonIcon from '../assets/Axon-icon.png'
 import ContextMenu from './ContextMenu'
 import { ConfirmDialog } from './Modal'
function IconButton({ label, onClick, children, noExpand = false }) {
  return (
    <button
      className="icon-button"
      aria-label={label}
      title={label}
      onClick={onClick}
      data-no-expand={noExpand ? 'true' : undefined}
    >
      {children}
    </button>
  )
}

IconButton.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  noExpand: PropTypes.bool,
}

function LeftNavigator({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onOpenSettings,
  folders = [],
  onCreateFolder,
  onMoveConversationToFolder,
  onRenameFolder,
  onRenameConversation,
  onDeleteConversation,
  onReorderFolders,
  isCollapsed = false,
  onToggleCollapsed,
  onDeleteFolder,
  isDrawerOpen = false,
  onRequestCloseDrawer,
  isPinned = false,
  onPin,
  onUnpin,
  onHoverEnter,
  onHoverLeave,
}) {
  const location = useLocation()
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  }, [conversations])

  // Sort folders by the most-recently updated conversation they contain
  const sortedFolders = useMemo(() => {
    // Keep provided order (allows drag-and-drop), but we'll still compute recency if needed elsewhere
    return folders || []
  }, [folders])

  const [editingFolderId, setEditingFolderId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingConvId, setEditingConvId] = useState(null)
  const [editingConvTitle, setEditingConvTitle] = useState('')
  const inputRef = useRef(null)
  const convInputRef = useRef(null)
  const [openMenuConvId, setOpenMenuConvId] = useState(null)
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [folderMenu, setFolderMenu] = useState(null)
  const [pendingDeleteFolderId, setPendingDeleteFolderId] = useState(null)

  useEffect(() => {
    if (editingFolderId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingFolderId])

  useEffect(() => {
    if (editingConvId && convInputRef.current) {
      convInputRef.current.focus()
      convInputRef.current.select()
    }
  }, [editingConvId])

  useEffect(() => {
    function handleDocClick() {
      setOpenMenuConvId(null)
    }
    document.addEventListener('click', handleDocClick)
    return () => document.removeEventListener('click', handleDocClick)
  }, [])

  function beginEditFolder(folderId, name) {
    return () => {
      setEditingFolderId(folderId)
      setEditingName(name || 'Untitled')
    }
  }

  function commitEdit() {
    if (editingFolderId) {
      onRenameFolder?.(editingFolderId, editingName)
      setEditingFolderId(null)
      setEditingName('')
    }
  }

  function cancelEdit() {
    setEditingFolderId(null)
    setEditingName('')
  }

  function beginEditConversation(convId, title) {
    setEditingConvId(convId)
    setEditingConvTitle(title || 'New chat')
  }

  function commitConvEdit() {
    if (editingConvId) {
      onRenameConversation?.(editingConvId, editingConvTitle)
      setEditingConvId(null)
      setEditingConvTitle('')
    }
  }

  function cancelConvEdit() {
    setEditingConvId(null)
    setEditingConvTitle('')
  }

  const handleSelectConversation = useCallback((id) => {
    if (id === activeConversationId) return
    onSelectConversation(id)
  }, [onSelectConversation, activeConversationId])

  return (
    <aside
      className={
        isDrawerOpen
          ? 'left-nav left-nav--drawer-open'
          : isCollapsed
            ? 'left-nav left-nav--collapsed'
            : 'left-nav'
      }
      role="complementary"
      /* Hover-to-expand disabled: expand via click only */
      // Use bubbling phase so child clicks (e.g., selecting a conversation) run first
      onClick={(e) => {
        if (isPinned) return
        const target = e.target
        if (!target || typeof target.closest !== 'function') return
        // Ignore clicks on explicit controls to avoid unintended pinning
        if (
          target.closest('.dock-toggle') ||
          target.closest('.menu') ||
          target.closest('input') ||
          target.closest('a.icon-button') ||
          target.closest('[data-no-expand="true"]') ||
          target.closest('[noexpand]') ||
          target.closest('[noexpand="true"]')
        ) return
        // Allow conversation selection to occur first, then pin the nav
        if (isDrawerOpen) onRequestCloseDrawer?.()
        else onPin?.()
      }}
    >
      <div className="left-nav__top">
        <div className="brand">
          <img src={AxonIcon} alt="Axon" className="brand__logo" />
          {/* Brand shows full text when expanded, single letter when collapsed */}
        </div>

        {/* Row actions in expanded state */}
        <div className="left-nav__actions">
          <IconButton label="New chat" noExpand onClick={() => onNewConversation(selectedFolderId)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </IconButton>
          <IconButton
            label="New folder"
            onClick={() => {
              const id = onCreateFolder?.()
              if (id) {
                setEditingFolderId(id)
                setEditingName('Untitled')
                setSelectedFolderId(id)
              }
            }}
          >
            <FolderClosed size={18} />
           </IconButton>
           <Link to="/settings" aria-label="Settings" className="icon-button" noExpand title="Settings">
             <Settings size={18} />
           </Link>
         </div>
        {/* Vertical rail in collapsed state */}
        <div className="left-nav__rail">
          <IconButton label="New chat" noExpand onClick={() => onNewConversation(selectedFolderId)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </IconButton>
          <IconButton label="New folder" onClick={() => {
             if (isCollapsed) {
               onPin?.()
             }
             const id = onCreateFolder?.()
             if (id) {
               setEditingFolderId(id)
               setEditingName('Untitled')
               setSelectedFolderId(id)
             }
           }}>
             <FolderClosed size={18} />
           </IconButton>
           <Link to="/settings" aria-label="Settings" className="icon-button" title="Settings">
             <Settings size={18} />
           </Link>
         </div>      </div>

      <div className="left-nav__label">Conversations</div>

      {!isCollapsed && (
        <div className="left-nav__scroll">
          {/* Folders */}
          {sortedFolders?.length > 0 && (
            <ul className="conversation-list" role="list" aria-label="Folders">
              {sortedFolders.map((folder, index) => (
                <li
                  key={folder.id}
                  draggable
                  onDragStart={(e) => {
                    // Begin folder drag only if the drag originates from folder header/background, not from a conversation
                    // Allow drag by header via data attribute check; otherwise stop propagation on conversation rows
                    e.dataTransfer.setData('drag-type', 'folder')
                    e.dataTransfer.setData('text/folder-index', String(index))
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const dragType = e.dataTransfer.getData('drag-type')
                    if (dragType === 'folder') {
                      const fromIndexStr = e.dataTransfer.getData('text/folder-index')
                      const fromIndex = Number(fromIndexStr)
                      if (Number.isNaN(fromIndex)) return
                      const toIndex = index
                      if (fromIndex === toIndex) return
                      const next = [...sortedFolders]
                      const [moved] = next.splice(fromIndex, 1)
                      next.splice(toIndex, 0, moved)
                      onReorderFolders?.(next)
                    } else {
                      // If a conversation is dropped over the folder wrapper, move it here
                      const convId = e.dataTransfer.getData('text/conv-id') || e.dataTransfer.getData('text/plain')
                      if (convId) onMoveConversationToFolder?.(convId, folder.id)
                    }
                  }}
                >
                  <div className={selectedFolderId === folder.id ? 'folder folder--selected' : 'folder'}
                       onDragOver={(e) => e.preventDefault()}
                       onDrop={(e) => {
                         const convId = e.dataTransfer.getData('text/conv-id') || e.dataTransfer.getData('text/plain')
                         if (!convId) return
                         onMoveConversationToFolder?.(convId, folder.id)
                       }}
                  >
                    <div
                      className="folder__header"
                      draggable
                      onDragStart={(e) => {
                        // Explicitly mark header drags as folder drags
                        e.dataTransfer.setData('drag-type', 'folder')
                        e.dataTransfer.setData('text/folder-index', String(index))
                      }}
                      onClick={() => setSelectedFolderId(folder.id)}
                      onDoubleClick={beginEditFolder(folder.id, folder.name)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setSelectedFolderId(folder.id)
                        setFolderMenu({ folderId: folder.id, x: e.clientX, y: e.clientY })
                      }}
                    >
                      <span className="folder__icon" aria-hidden>
                         <FolderClosed size={16} />
                       </span>
                       {editingFolderId === folder.id ? (
                          <input
                            ref={inputRef}
                            className="folder__input"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit()
                            else if (e.key === 'Escape') cancelEdit()
                          }}
                          aria-label="Folder name"
                        />
                      ) : (
                        <div className="folder__title">{folder.name}</div>
                      )}
                    </div>
                    {/* Conversations inside folder */}
                    {sortedConversations
                      .filter((c) => folder.conversationIds.includes(c.id))
                      .map((conv) => {
                        if (!conv) return null
                        const isActive = conv.id === activeConversationId
                        return (
                          <div
                            key={conv.id}
                            className={isActive ? 'conversation conversation--active' : 'conversation'}
                            draggable
                            onDragStart={(e) => {
                              // Start dragging this conversation (not the folder)
                              e.stopPropagation()
                              e.dataTransfer.effectAllowed = 'move'
                              e.dataTransfer.setData('text/conv-id', conv.id)
                              e.dataTransfer.setData('text/plain', conv.id)
                            }}
                          >
                            <button
                              className="conversation__main"
                              onMouseDown={(e) => {
                                if (e.button !== 0) return
                                if (conv.id !== activeConversationId) onSelectConversation(conv.id)
                              }}
                              onClick={() => {
                                if (conv.id !== activeConversationId) onSelectConversation(conv.id)
                              }}
                            >
                              <span className="conversation__icon" aria-hidden>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M4 5h16v10H7l-3 3V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                              <div className="conversation__meta">
                                {editingConvId === conv.id ? (
                                  <input
                                    ref={convInputRef}
                                    className="conversation__input"
                                    value={editingConvTitle}
                                    onChange={(e) => setEditingConvTitle(e.target.value)}
                                    onBlur={commitConvEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') commitConvEdit()
                                      else if (e.key === 'Escape') cancelConvEdit()
                                    }}
                                    aria-label="Conversation title"
                                  />
                                ) : (
                                  <div className="conversation__title">{conv.title}</div>
                                )}
                              </div>
                            </button>
                            <div
                              className={openMenuConvId === conv.id ? 'conversation__menu open' : 'conversation__menu'}
                        onClick={(e) => e.stopPropagation()}
                            >
                            <button
                              className="menu-trigger"
                                aria-label="More actions"
                                title="More"
                               onClick={(e) => {
                                 e.stopPropagation()
                                 setOpenMenuConvId((v) => (v === conv.id ? null : conv.id))
                               }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm-6 0a1 1 0 1 1 0-2 1 1 0  0 1 0 2Zm12 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" fill="currentColor" />
                                </svg>
                              </button>
                              <div className="menu">
                                <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setOpenMenuConvId(null)
                                        handleSelectConversation(conv.id)
                                      }}
                                >
                                  Open
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenMenuConvId(null)
                                    beginEditConversation(conv.id, conv.title)
                                  }}
                                >
                                  Rename
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenMenuConvId(null)
                                    onDeleteConversation?.(conv.id)
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Unfiled conversations */}
          <ul className="conversation-list" role="list" aria-label="Unfiled">
             {sortedConversations
              .filter((c) => !folders.some((f) => f.conversationIds.includes(c.id)))
              .map((c) => {
                const isActive = c.id === activeConversationId
                return (
                  <li key={c.id}>
                    {/* Make only the conversation row draggable, not the whole list item */}
                    <div className={isActive ? 'conversation conversation--active' : 'conversation'}
                         onDragOver={(e) => e.preventDefault()}
                         onDrop={(e) => {
                           // Dropping a chat onto the empty area (outside any folder) → create Untitled and move
                           // We only act when drop target is the unfiled list container background
                           const convId = e.dataTransfer.getData('text/conv-id') || e.dataTransfer.getData('text/plain')
                           if (!convId) return
                           // If dropped directly on another conversation tile, skip here; folder drops handled above
                           if (convId === c.id) return
                           // Create or reuse Untitled folder and move the dragged conv into it
                           const id = onCreateFolder?.()
                           const folderId = id || null
                           if (folderId) onMoveConversationToFolder?.(convId, folderId)
                         }}
                    >
                      <button
                        className="conversation__main"
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation()
                          e.dataTransfer.effectAllowed = 'move'
                          e.dataTransfer.setData('drag-type', 'conversation')
                          e.dataTransfer.setData('text/conv-id', c.id)
                          e.dataTransfer.setData('text/plain', c.id)
                        }}
                        onMouseDown={(e) => {
                          if (e.button !== 0) return
                          if (c.id !== activeConversationId) onSelectConversation(c.id)
                        }}
                        onClick={() => handleSelectConversation(c.id)}
                      >
                        <span className="conversation__icon" aria-hidden>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 5h16v10H7l-3 3V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <div className="conversation__meta">
                          {editingConvId === c.id ? (
                            <input
                              ref={convInputRef}
                              className="conversation__input"
                              value={editingConvTitle}
                              onChange={(e) => setEditingConvTitle(e.target.value)}
                              onBlur={commitConvEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitConvEdit()
                                else if (e.key === 'Escape') cancelConvEdit()
                              }}
                              aria-label="Conversation title"
                            />
                          ) : (
                            <div className="conversation__title">{c.title}</div>
                          )}
                        </div>
                      </button>
                      <div
                        className={openMenuConvId === c.id ? 'conversation__menu open' : 'conversation__menu'}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="menu-trigger"
                          aria-label="More actions"
                          title="More"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuConvId((v) => (v === c.id ? null : c.id))
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm-6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm12 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" fill="currentColor" />
                          </svg>
                        </button>
                        <div className="menu">
                          <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuConvId(null)
                                handleSelectConversation(c.id)
                              }}
                          >
                            Open
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuConvId(null)
                              beginEditConversation(c.id, c.title)
                            }}
                          >
                            Rename
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuConvId(null)
                              onDeleteConversation?.(c.id)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
          </ul>
        </div>
      )}

      <div className="left-nav__bottom">
        <button
          className="dock-toggle"
          onClick={() => {
            if (isCollapsed) {
              onPin?.()
            } else if (isPinned) {
              onUnpin?.()
            } else {
              onToggleCollapsed?.()
            }
          }}
          aria-label="Toggle navigator"
        >
          {isCollapsed ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
        </button>
      </div>

      {/* Folder context menu */}
      {!isCollapsed && folderMenu && (
        <ContextMenu
          position={{ x: folderMenu.x, y: folderMenu.y }}
          onClose={() => setFolderMenu(null)}
          items={[
            {
              label: 'Rename',
              onClick: () => {
                const f = sortedFolders.find((ff) => ff.id === folderMenu.folderId)
                setFolderMenu(null)
                if (f) {
                  setEditingFolderId(f.id)
                  setEditingName(f.name || 'Untitled')
                }
              },
            },
            {
              label: 'Delete',
              onClick: () => {
                setFolderMenu(null)
                setPendingDeleteFolderId(folderMenu.folderId)
              },
            },
          ]}
        />
      )}

      {/* Confirm delete modal */}
      <ConfirmDialog
        open={!!pendingDeleteFolderId}
        title="Delete folder?"
        message="Are you sure you want to delete the folder? The chats will be deleted."
        confirmText="Delete folder"
        cancelText="Cancel"
        onConfirm={() => {
          const id = pendingDeleteFolderId
          onDeleteFolder?.(id)
          setPendingDeleteFolderId(null)
        }}
        onCancel={() => setPendingDeleteFolderId(null)}
      />
    </aside>
  )
}

LeftNavigator.propTypes = {
  conversations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      lastMessage: PropTypes.string,
      updatedAt: PropTypes.number,
    })
  ).isRequired,
  activeConversationId: PropTypes.string,
  onSelectConversation: PropTypes.func.isRequired,
  onNewConversation: PropTypes.func.isRequired,
  onOpenSettings: PropTypes.func.isRequired,
  folders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      conversationIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ),
  onCreateFolder: PropTypes.func,
  onMoveConversationToFolder: PropTypes.func,
  onRenameFolder: PropTypes.func,
  onRenameConversation: PropTypes.func,
  onDeleteConversation: PropTypes.func,
  onReorderFolders: PropTypes.func,
  isCollapsed: PropTypes.bool,
  onToggleCollapsed: PropTypes.func,
  onDeleteFolder: PropTypes.func,
  isDrawerOpen: PropTypes.bool,
  onRequestCloseDrawer: PropTypes.func,
}

export default memo(LeftNavigator)
