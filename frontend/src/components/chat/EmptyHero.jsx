import React, { memo } from 'react'
import { LampContainer } from '../ui/lamp'
import PropTypes from 'prop-types'

function EmptyHero({ isExiting }) {
  return (
    <div className={isExiting ? 'empty-hero empty-hero--exit' : 'empty-hero'} aria-live="polite">
      <div className="absolute inset-0 z-0 pointer-events-none -translate-y-36" aria-hidden>
        <LampContainer />
      </div>
      <div className="empty-hero__content-shift">
        <h1 className="empty-hero__title">
          <span className="empty-hero__main">Axon</span>
          {' '}<span className="slash">/</span>{' '}
          <span className="empty-hero__note">where minds connect to everything</span>
        </h1>
        <p className="empty-hero__subtitle">
          Axon links AI models to apps, data, and workflows—so your ideas move from spark to shipped.
        </p>
      </div>
    </div>
  )
}

EmptyHero.propTypes = {
  isExiting: PropTypes.bool,
}

export default memo(EmptyHero)
