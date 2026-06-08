import React, { useState } from 'react'
import { db } from '../../firebase'
import { collection, addDoc } from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'

export default function FeedbackModal({ isOpen, onClose }) {
  const { user, userProfile } = useAuth()
  const [type, setType] = useState('suggestion')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!content.trim()) {
      setMsg('Veuillez entrer un message.')
      return
    }

    setLoading(true)
    setMsg('')
    try {
      await addDoc(collection(db, 'feedbacks'), {
        userId: user.uid,
        userName: userProfile?.displayName || 'Joueur',
        type,
        content: content.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      })
      
      setMsg('Envoyé avec succès ! Merci.')
      setTimeout(() => {
        setContent('')
        setMsg('')
        onClose()
      }, 1500)
    } catch (err) {
      console.error(err)
      setMsg('Erreur lors de l\'envoi.')
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay">
      <div className="mc-panel modal-content" style={{ maxWidth: '400px' }}>
        <h2 style={{ color: 'var(--honey-light)', marginBottom: '15px' }}>Faire un retour</h2>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button 
            className={`mc-button ${type === 'suggestion' ? 'primary' : ''}`} 
            style={{ flex: 1 }}
            onClick={() => setType('suggestion')}
          >
            💡 Idée
          </button>
          <button 
            className={`mc-button ${type === 'bug' ? 'danger' : ''}`} 
            style={{ flex: 1 }}
            onClick={() => setType('bug')}
          >
            🐛 Bug
          </button>
        </div>

        <textarea
          className="mc-input"
          style={{ width: '100%', height: '100px', marginBottom: '10px', padding: '10px', fontSize: '10px', boxSizing: 'border-box' }}
          placeholder={type === 'suggestion' ? "Quelle est votre idée ?" : "Décrivez le bug rencontré..."}
          value={content}
          onChange={e => setContent(e.target.value)}
          disabled={loading}
        />

        {msg && <div style={{ fontSize: '8px', color: 'var(--text-honey)', marginBottom: '10px' }}>{msg}</div>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button className="mc-button" onClick={onClose} disabled={loading} style={{ flex: 1 }}>
            Annuler
          </button>
          <button className="mc-button primary" onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
            Envoyer
          </button>
        </div>
      </div>
    </div>
  )
}
