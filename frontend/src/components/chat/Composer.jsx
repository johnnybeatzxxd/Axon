import PropTypes from 'prop-types'
import React, { forwardRef, useImperativeHandle, useRef } from 'react'

import {
  Plus as PlusIcon,
  Mic as MicIcon,
} from 'lucide-react'
import {
  PromptInputButton,
  PromptInputTools,
} from './PromptInput'

const Composer = forwardRef(function Composer({ onSubmit }, ref) {
  const inputRef = useRef(null)

  function autoSizeComposer() {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    const maxPx = 180
    const next = Math.min(el.scrollHeight, maxPx)
    el.style.height = `${next}px`
  }

  function sendCurrentInput() {
    const raw = inputRef.current?.value ?? ''
    const value = raw.trim()
    if (!value) return
    onSubmit?.(value)
    if (inputRef.current) {
      inputRef.current.value = ''
      autoSizeComposer()
    }
  }

  useImperativeHandle(ref, () => ({
    focusWithPreset(preset) {
      if (!inputRef.current) return
      if (preset) inputRef.current.value = preset
      inputRef.current.focus()
      autoSizeComposer()
    },
  }))

  return (
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
                const value = inputRef.current?.value?.trim()
                if (!value) return
                sendCurrentInput()
              }
            }}
          />
        </div>
        <div className="composer__bottom" role="toolbar" aria-label="Composer tools">
          <PromptInputTools>
            <PromptInputButton>
              <PlusIcon className="size-4" />
            </PromptInputButton>
          </PromptInputTools>
          <div className="composer__spacer" />
          <button type="button" className="composer__icon-button" aria-label="Voice input">
            <MicIcon className="size-4" />
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
          <button type="button" className="composer__send" aria-label="Send" onClick={sendCurrentInput}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 19V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M5.5 13.5 12 7l6.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
})
Composer.propTypes = {
  onSubmit: PropTypes.func.isRequired,
}

export default Composer


