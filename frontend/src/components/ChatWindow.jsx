import PropTypes from 'prop-types'
import { useEffect, useRef } from 'react'

export default function ChatWindow({ messages, onSend }) {
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  function handleSubmit(event) {
    event.preventDefault()
    const value = inputRef.current?.value?.trim()
    if (!value) return
    onSend(value)
    inputRef.current.value = ''
  }

  return (
    <section className="chat-window" role="main">
      <div className="chat-gradient" aria-hidden />
      <ul className="message-list" ref={listRef} role="list">
        {messages.map((m) => (
          <li key={m.id} className={m.role === 'user' ? 'message message--user' : 'message message--assistant'}>
            <div className="message__bubble">
              {m.text}
            </div>
          </li>
        ))}
      </ul>

      <form className="composer" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="composer__input"
          placeholder="Message Axon…"
          aria-label="Message input"
          autoComplete="off"
        />
        <button className="composer__send" aria-label="Send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="m3 11 17-7-7 17-2-7-8-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </section>
  )
}

ChatWindow.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      role: PropTypes.oneOf(['user', 'assistant']).isRequired,
      text: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSend: PropTypes.func.isRequired,
}


