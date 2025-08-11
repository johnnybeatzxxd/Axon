import PropTypes from 'prop-types'
import { useEffect, useMemo, useRef, useState } from 'react'
import ChatHeader from '../components/chat/ChatHeader'
import MessageList from '../components/chat/MessageList'
import EmptyHero from '../components/chat/EmptyHero'
import PromptBar from '../components/chat/PromptBar'
import Composer from '../components/chat/Composer'

const MODEL_OPTIONS = ['gpt-4o-mini', 'gpt-4o', 'llama-3.1-70b', 'mistral-large']
const QUICK_PROMPTS = [
  'Summarize this article: https://example.com',
  'Brainstorm 5 feature ideas for a habit app',
  'Explain WebSockets to a beginner',
]

export default function ChatPage({ messages, onSend, onExportConversation, onOpenNav }) {
  const composerRef = useRef(null)
  const [showEmptyHero, setShowEmptyHero] = useState(!messages || messages.length === 0)
  const [isExitingHero, setIsExitingHero] = useState(false)
  const [isSendingWave, setIsSendingWave] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const models = MODEL_OPTIONS

  const isEmpty = useMemo(() => !messages || messages.length === 0, [messages])

  useEffect(() => {
    if (isEmpty) {
      setShowEmptyHero(true)
      setIsExitingHero(false)
    }
  }, [isEmpty])

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

  function handleSubmitMessage(text) {
    if (!text || !text.trim()) return
    if (showEmptyHero) {
      setIsExitingHero(true)
      setIsSendingWave(true)
      window.setTimeout(() => {
        setShowEmptyHero(false)
        setIsSendingWave(false)
      }, 800)
    }
    onSend?.(text)
  }

  function handlePromptPreset(preset) {
    composerRef.current?.focusWithPreset?.(preset)
  }

  return (
    <section className={isSendingWave ? 'chat-window chat-window--sending' : 'chat-window'} role="main">
      <div className="chat-gradient" aria-hidden />

      <ChatHeader
        selectedModel={selectedModel}
        models={models}
        onChangeModel={setSelectedModel}
        onOpenNav={onOpenNav}
        onExportConversation={() => onExportConversation?.(selectedModel)}
      />

      <MessageList messages={messages} />

      {showEmptyHero && isEmpty && (
        <EmptyHero isExiting={isExitingHero} />
      )}

      {/* Keep old composer for quick rollback and visual comparison (commented out) */}
      {true && (
        <form className="composer" onSubmit={(e) => { e.preventDefault(); }}>
          {(showEmptyHero || isExitingHero) && isEmpty && (
            <PromptBar prompts={QUICK_PROMPTS} isExiting={isExitingHero} onPreset={handlePromptPreset} />
          )}
          <Composer ref={composerRef} onSubmit={handleSubmitMessage} />
        </form>
      )}    </section>
  )
}

ChatPage.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      role: PropTypes.oneOf(['user', 'assistant']).isRequired,
      text: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSend: PropTypes.func.isRequired,
  onExportConversation: PropTypes.func,
  onOpenNav: PropTypes.func,
}


