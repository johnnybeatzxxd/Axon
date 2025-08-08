import PropTypes from 'prop-types'
import { useEffect } from 'react'

export default function ContextMenu({ items = [], position, onClose }) {
  useEffect(() => {
    function onDocClick() { onClose?.() }
    function onEsc(e) { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [onClose])

  if (!position) return null
  const { x, y } = position

  return (
    <div className="context-menu" style={{ left: x, top: y }}>
      {items.map((item, i) => (
        <button key={i} className="context-menu__item" onClick={item.onClick}>
          {item.label}
        </button>
      ))}
    </div>
  )
}

ContextMenu.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({ label: PropTypes.string.isRequired, onClick: PropTypes.func.isRequired })
  ),
  position: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
  onClose: PropTypes.func,
}


