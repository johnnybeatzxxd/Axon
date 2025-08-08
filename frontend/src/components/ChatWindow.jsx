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

  const isEmpty = !messages || messages.length === 0
  const quickPrompts = [
    'Summarize this article: https://example.com',
    'Brainstorm 5 feature ideas for a habit app',
    'Explain WebSockets to a beginner',
    'Draft an email to follow up on a job interview',
  ]
  function focusComposer(preset) {
    if (!inputRef.current) return
    if (preset) inputRef.current.value = preset
    inputRef.current.focus()
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

      {isEmpty && (
        <div className="empty-hero fade-in" aria-live="polite">
          <div className="empty-hero__light" aria-hidden />
          <h1 className="empty-hero__title">Axon <span className="slash">/</span> <span className="empty-hero__note">where minds connect to everything</span></h1>
          <p className="empty-hero__subtitle">Axon links AI models to apps, data, and workflows—so your ideas move from spark to shipped.</p>
        </div>
      )}

      <form className="composer" onSubmit={handleSubmit}>
        {/* Prompt suggestions bar placed directly above the message textbox within the composer */}
        {isEmpty && (
          <div className="prompt-bar" role="list">
            {quickPrompts.map((p) => (
              <button
                key={p}
                className="chip"
                role="listitem"
                onClick={() => focusComposer(p)}
              >{p}</button>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          className="composer__input"
          placeholder="Message Axon…"
          aria-label="Message input"
          autoComplete="off"
        />
        <button className="composer__send" aria-label="Send">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M12 19V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M5.5 13.5 12 7l6.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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


