import React from 'react'

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="mc-panel modal-content">
        <h2 style={{ color: 'var(--honey-light)', marginBottom: '15px', fontSize: '18px' }}>{title}</h2>
        <p style={{ whiteSpace: 'pre-line', marginBottom: '20px', fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button className="mc-button" style={{ flex: 1 }} onClick={onCancel}>
            Annuler
          </button>
          <button className="mc-button primary" style={{ flex: 1 }} onClick={onConfirm}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}
