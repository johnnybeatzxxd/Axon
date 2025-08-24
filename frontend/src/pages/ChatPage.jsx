import PropTypes from 'prop-types'
import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
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
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
function ChatPage({ messages, onSend, onExportConversation, onOpenNav, loadingState }) {
  const composerRef = useRef(null)
  const [isExitingHero, setIsExitingHero] = useState(false)
  const [isSendingWave, setIsSendingWave] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const models = MODEL_OPTIONS
  const isEmpty = useMemo(() => !messages || messages.length === 0, [messages])
  const wasEmpty = usePrevious(isEmpty);

  useEffect(() => {
    if (wasEmpty && !isEmpty) {
      setIsExitingHero(true);
      const t = window.setTimeout(() => {
        setIsExitingHero(false);
      }, 800);
      return () => window.clearTimeout(t);
    }
  }, [isEmpty, wasEmpty])

  function handleSubmitMessage(text) {
      if (!text || !text.trim()) return
      // FROM: if (showEmptyHero) {
      // TO:
      if (isEmpty) {
        setIsExitingHero(true)
        setIsSendingWave(true)
        window.setTimeout(() => {
          setIsSendingWave(false)
        }, 800)
      }
      onSend?.(text)
    }

  function handlePromptPreset(preset) {
    composerRef.current?.focusWithPreset?.(preset)
  }

  const showHeroElements = isEmpty || isExitingHero;
  return (
    <section className={isSendingWave ? 'chat-window chat-window--sending no-scrollbar' : 'chat-window no-scrollbar'} role="main">
      <div className="chat-gradient" aria-hidden />

      <ChatHeader
        selectedModel={selectedModel}
        models={models}
        onChangeModel={setSelectedModel}
        onOpenNav={onOpenNav}
        onExportConversation={() => onExportConversation?.(selectedModel)}
      />

      <MessageList messages={messages} loadingState={loadingState} />

      {showHeroElements && (
        <EmptyHero isExiting={isExitingHero} />
      )}

      {true && (
        <form className="composer" onSubmit={(e) => { e.preventDefault(); }}>
          {showHeroElements && (
            <PromptBar prompts={QUICK_PROMPTS} isExiting={isExitingHero} onPreset={handlePromptPreset} />
          )}
          <Composer ref={composerRef} onSubmit={handleSubmitMessage} />
        </form>
      )}
    </section>
  )}

ChatPage.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      role: PropTypes.oneOf(['user', 'assistant']).isRequired,
      content: PropTypes.arrayOf(
        PropTypes.shape({
          text: PropTypes.string,
          image: PropTypes.string,
          reasoning: PropTypes.string,
          tool: PropTypes.object,
          task: PropTypes.array,
        })
      ).isRequired,
    })
  ).isRequired,
  onSend: PropTypes.func.isRequired,
  onExportConversation: PropTypes.func,
  onOpenNav: PropTypes.func,
}

export default memo(ChatPage)
