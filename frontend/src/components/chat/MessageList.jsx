import PropTypes from 'prop-types'
import React, { memo, useEffect, useRef } from 'react'

function MessageList({ messages }) {
  const listRef = useRef(null)

  useEffect(() => {
    if (!listRef.current) return
    requestAnimationFrame(() => {
      if (!listRef.current) return
      listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }, [messages])

  return (
    <ul className="message-list" ref={listRef} role="list">
      {messages.map((m) => (
        <li key={m.id} className={m.role === 'user' ? 'message message--user' : 'message message--assistant'}>
          <div className="message__bubble">
            {m.text}
          </div>
        </li>
      ))}
    </ul>
  )
}

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      role: PropTypes.oneOf(['user', 'assistant']).isRequired,
      text: PropTypes.string.isRequired,
    })
  ).isRequired,
}

export default memo(MessageList)
