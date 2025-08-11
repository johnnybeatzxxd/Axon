import PropTypes from 'prop-types'

export default function PromptBar({ prompts, isExiting, onPreset }) {
  return (
    <div className={isExiting ? 'prompt-bar prompt-bar--exit' : 'prompt-bar'} role="list">
      {prompts.map((p) => (
        <button
          key={p}
          type="button"
          className="chip chip--small"
          role="listitem"
          onClick={() => onPreset?.(p)}
        >{p}</button>
      ))}
    </div>
  )
}

PromptBar.propTypes = {
  prompts: PropTypes.arrayOf(PropTypes.string).isRequired,
  isExiting: PropTypes.bool,
  onPreset: PropTypes.func,
}


