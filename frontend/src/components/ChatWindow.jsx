import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'

// Static options kept outside the component to avoid re-allocations on re-render
const MODEL_OPTIONS = ['gpt-4o-mini', 'gpt-4o', 'llama-3.1-70b', 'mistral-large']
const QUICK_PROMPTS = [
  'Summarize this article: https://example.com',
  'Brainstorm 5 feature ideas for a habit app',
  'Explain WebSockets to a beginner',
  'Draft an email to follow up on a job interview',
]

export default function ChatWindow({ messages, onSend, onExportConversation }) {
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const [showEmptyHero, setShowEmptyHero] = useState(!messages || messages.length === 0)
  const [isExitingHero, setIsExitingHero] = useState(false)
  const [isSendingWave, setIsSendingWave] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const models = MODEL_OPTIONS

  useEffect(() => {
    if (!listRef.current) return
    // Defer to next frame to ensure DOM has painted, minimizing layout thrash
    requestAnimationFrame(() => {
      if (!listRef.current) return
      listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }, [messages])

  function autoSizeComposer() {
    const el = inputRef.current
    if (!el) return
    // Reset height to measure natural scrollHeight, then clamp to max height
    el.style.height = 'auto'
    const maxPx = 180
    const next = Math.min(el.scrollHeight, maxPx)
    el.style.height = `${next}px`
  }

  function sendCurrentInput() {
    const raw = inputRef.current?.value ?? ''
    const value = raw.trim()
    if (!value) return
    // Trigger creative exit animation only when sending the very first message
    if (showEmptyHero) {
      setIsExitingHero(true)
      setIsSendingWave(true)
      window.setTimeout(() => {
        setShowEmptyHero(false)
        setIsSendingWave(false)
      }, 800)
    }
    onSend(value)
    if (inputRef.current) {
      inputRef.current.value = ''
      autoSizeComposer()
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendCurrentInput()
  }

  const isEmpty = !messages || messages.length === 0
  // If user cleared all messages, re-show the hero
  useEffect(() => {
    if (isEmpty) {
      setShowEmptyHero(true)
      setIsExitingHero(false)
    }
  }, [isEmpty])
  // Detect external transition from empty → has messages to fade out hero
  useEffect(() => {
    const isEmptyNow = !messages || messages.length === 0
    if (showEmptyHero && !isEmptyNow) {
      setIsExitingHero(true)
      const t = window.setTimeout(() => {
        setShowEmptyHero(false)
        setIsExitingHero(false)
      }, 800)
      return () => window.clearTimeout(t)
    }
  }, [messages, showEmptyHero])
  function focusComposer(preset) {
    if (!inputRef.current) return
    if (preset) inputRef.current.value = preset
    inputRef.current.focus()
    autoSizeComposer()
  }

  return (
    <section className={isSendingWave ? 'chat-window chat-window--sending' : 'chat-window'} role="main">
      <div className="chat-gradient" aria-hidden />
      <div className="chat-header">
        <div className="chat-header__inner">
          <div className="chat-header__left">
            <label className="visually-hidden" htmlFor="model-select">Model</label>
            <select
              id="model-select"
              className="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="chat-header__right">
            <button
              type="button"
              className="save-button"
              onClick={() => onExportConversation?.(selectedModel)}
            >
              Export conversation
            </button>
          </div>
        </div>
      </div>
      <ul className="message-list" ref={listRef} role="list">
        {messages.map((m) => (
          <li key={m.id} className={m.role === 'user' ? 'message message--user' : 'message message--assistant'}>
            <div className="message__bubble">
              {m.text}
            </div>
          </li>
        ))}
      </ul>

      {showEmptyHero && isEmpty && (
        <div className={isExitingHero ? 'empty-hero empty-hero--exit' : 'empty-hero fade-in'} aria-live="polite">
          <div className="empty-hero__light" aria-hidden />
          <h1 className="empty-hero__title">Axon <span className="slash">/</span> <span className="empty-hero__note">where minds connect to everything</span></h1>
          <p className="empty-hero__subtitle">Axon links AI models to apps, data, and workflows—so your ideas move from spark to shipped.</p>
        </div>
      )}

      <form className="composer" onSubmit={handleSubmit}>
        {/* Prompt suggestions bar placed directly above the message textbox within the composer */}
        {(showEmptyHero || isExitingHero) && isEmpty && (
          <div className={isExitingHero ? 'prompt-bar prompt-bar--exit' : 'prompt-bar'} role="list">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                className="chip chip--small"
                role="listitem"
                onClick={() => focusComposer(p)}
              >{p}</button>
            ))}
          </div>
        )}

        <div className="composer__field">
          <div className="composer__box">
            <div className="composer__editor">
              <textarea
                ref={inputRef}
                className="composer__textarea"
                placeholder="Message Axon…"
                aria-label="Message input"
                aria-multiline="true"
                rows={1}
                autoComplete="off"
                onInput={autoSizeComposer}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    // Avoid sending if empty/whitespace
                    const value = inputRef.current?.value?.trim()
                    if (!value) return
                    sendCurrentInput()
                  }
                }}
              />
            </div>
            <div className="composer__bottom" role="toolbar" aria-label="Composer tools">
              <button type="button" className="composer__tool" aria-label="Add">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </button>
              <div className="composer__spacer" />
              <button type="button" className="composer__icon-button" aria-label="Voice input">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
                  <path d="M12 19v3"/>
                </svg>
              </button>
              <button type="button" className="composer__icon-button" aria-label="Audio mode">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M2 12h2"/>
                  <path d="M20 12h2"/>
                  <path d="M7 12h2"/>
                  <path d="M15 12h2"/>
                  <path d="M11 12h2"/>
                </svg>
              </button>
              <button type="submit" className="composer__send" aria-label="Send">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12 19V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M5.5 13.5 12 7l6.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
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
  onExportConversation: PropTypes.func,
}


