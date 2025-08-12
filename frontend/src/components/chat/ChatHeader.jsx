import PropTypes from 'prop-types'
import React, { memo } from 'react'

function ChatHeader({ selectedModel, models, onChangeModel, onOpenNav, onExportConversation }) {
  return (
    <div className="chat-header">
      <div className="chat-header__inner">
        <div className="chat-header__left">
          <button
            type="button"
            className="mobile-nav-button"
            aria-label="Open navigator"
            onClick={onOpenNav}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <label className="visually-hidden" htmlFor="model-select">Model</label>
          <select
            id="model-select"
            className="model-select"
            value={selectedModel}
            onChange={(e) => onChangeModel?.(e.target.value)}
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
            onClick={onExportConversation}
          >
            Export conversation
          </button>
        </div>
      </div>
    </div>
  )
}

ChatHeader.propTypes = {
  selectedModel: PropTypes.string.isRequired,
  models: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChangeModel: PropTypes.func,
  onOpenNav: PropTypes.func,
  onExportConversation: PropTypes.func,
}

export default memo(ChatHeader)
