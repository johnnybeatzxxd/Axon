import PropTypes from 'prop-types'

export function Modal({ open, children, onClose }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
Modal.propTypes = {
  open: PropTypes.bool,
  children: PropTypes.node,
  onClose: PropTypes.func,
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="modal__header">{title}</div>
      <div className="modal__body">{message}</div>
      <div className="modal__actions">
        <button className="btn btn--ghost" onClick={onCancel}>{cancelText}</button>
        <button className="btn btn--danger" onClick={onConfirm}>{confirmText}</button>
      </div>
    </Modal>
  )
}
ConfirmDialog.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  message: PropTypes.node,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
}


