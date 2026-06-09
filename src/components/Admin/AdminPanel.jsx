// ===================================================
// AdminPanel — Generate and manage license keys
// ===================================================

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase'
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, where } from 'firebase/firestore'
import ConfirmModal from '../UI/ConfirmModal'

function generateKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid confusing chars (I/1, O/0)
  const segments = []
  for (let s = 0; s < 3; s++) {
    let segment = ''
    for (let i = 0; i < 4; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    segments.push(segment)
  }
  return segments.join('-')
}

export default function AdminPanel() {
  const { userProfile, resetPassword, unbanUserByEmail } = useAuth()
  const [keys, setKeys] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [keysToGenerate, setKeysToGenerate] = useState(1)
  const [confirmConfig, setConfirmConfig] = useState(null)

  const [resetEmail, setResetEmail] = useState('')
  const [resetMsg, setResetMsg] = useState('')

  const [unbanEmail, setUnbanEmail] = useState('')
  const [unbanMsg, setUnbanMsg] = useState('')

  const handleAdminResetPassword = async () => {
    if (!resetEmail) return
    setResetMsg('⏳ Envoi en cours...')
    const success = await resetPassword(resetEmail)
    if (success) {
      setResetMsg('✅ Email envoyé à ' + resetEmail)
      setResetEmail('')
    } else {
      setResetMsg('❌ Erreur. Vérifiez l\'adresse email.')
    }
  }

  const handleAdminUnban = async () => {
    if (!unbanEmail) return
    setUnbanMsg('⏳ Débannissement en cours...')
    const success = await unbanUserByEmail(unbanEmail)
    if (success) {
      setUnbanMsg('✅ Joueur débanni avec succès !')
      setUnbanEmail('')
    } else {
      setUnbanMsg('❌ Erreur. Joueur introuvable.')
    }
  }

  // Check admin access
  const isAdmin = userProfile?.isAdmin === true

  // Load existing keys
  useEffect(() => {
    if (!isAdmin) return

    const loadData = async () => {
      try {
        // Load Keys
        const keysRef = collection(db, 'licenseKeys')
        const qKeys = query(keysRef, orderBy('createdAt', 'desc'))
        const snapshotKeys = await getDocs(qKeys)

        const keysData = []
        snapshotKeys.forEach(doc => {
          keysData.push({ id: doc.id, ...doc.data() })
        })
        setKeys(keysData)

        // Load Feedbacks
        const feedbacksRef = collection(db, 'feedbacks')
        const qFeedbacks = query(feedbacksRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'))
        const snapshotFeedbacks = await getDocs(qFeedbacks)

        const feedbacksData = []
        snapshotFeedbacks.forEach(doc => {
          feedbacksData.push({ id: doc.id, ...doc.data() })
        })
        setFeedbacks(feedbacksData)

      } catch (err) {
        console.error('Error loading admin data:', err)
      }
      setLoading(false)
    }

    loadData()
  }, [isAdmin])

  const handleGenerateKeys = async () => {
    setGenerating(true)
    try {
      const newKeys = []
      for (let i = 0; i < keysToGenerate; i++) {
        const key = generateKey()
        const docRef = await addDoc(collection(db, 'licenseKeys'), {
          key,
          used: false,
          usedBy: null,
          usedAt: null,
          createdAt: new Date().toISOString(),
        })
        newKeys.push({ id: docRef.id, key, used: false, createdAt: new Date().toISOString() })
      }
      setKeys(prev => [...newKeys, ...prev])
    } catch (err) {
      console.error('Error generating keys:', err)
    }
    setGenerating(false)
  }

  const handleDeleteKey = (id) => {
    setConfirmConfig({
      title: 'Supprimer la clé',
      message: 'Êtes-vous sûr de vouloir supprimer cette clé de licence ?',
      action: async () => {
        try {
          await deleteDoc(doc(db, 'licenseKeys', id))
          setKeys(prev => prev.filter(k => k.id !== id))
        } catch (err) {
          console.error('Error deleting key:', err)
        }
      }
    })
  }

  const handleUpdateFeedbackStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'feedbacks', id), { status: newStatus })
      setFeedbacks(prev => prev.filter(f => f.id !== id))
    } catch (err) {
      console.error('Error updating feedback:', err)
    }
  }

  const copyKey = (key) => {
    navigator.clipboard.writeText(key)
  }

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <div className="mc-panel">
          <h2>🔒 ACCÈS REFUSÉ</h2>
          <div className="loading-text" style={{ textAlign: 'center' }}>
            Vous n'avez pas les droits d'administrateur.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="mc-panel">
        <h2>⚙️ PANEL ADMIN</h2>

        {/* Generate keys section */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Nombre :</label>
          <input
            type="number"
            min="1"
            max="50"
            value={keysToGenerate}
            onChange={e => setKeysToGenerate(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
            className="license-input"
            style={{ width: '80px', padding: '8px', textAlign: 'center' }}
            id="keys-count-input"
          />
          <button
            className="mc-button primary"
            onClick={handleGenerateKeys}
            disabled={generating}
            id="btn-generate-keys"
          >
            {generating ? '⏳...' : '🔑 Générer'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <div className="stat-item">
            <div className="stat-value">{keys.length}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: 'var(--can-afford)' }}>
              {keys.filter(k => !k.used).length}
            </div>
            <div className="stat-label">Disponibles</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: 'var(--cannot-afford)' }}>
              {keys.filter(k => k.used).length}
            </div>
            <div className="stat-label">Utilisées</div>
          </div>
        </div>

        {/* Keys list */}
        {loading && <div className="loading-text">Chargement des clés...</div>}

        <div className="admin-key-list">
          {keys.map(k => (
            <div className="admin-key-entry" key={k.id}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  className="admin-key-value"
                  onClick={() => copyKey(k.key)}
                  style={{ cursor: 'pointer' }}
                  title="Cliquer pour copier"
                >
                  {k.key}
                </span>
                <span className={`admin-key-status ${k.used ? 'used' : 'available'}`}>
                  {k.used ? '✗ Utilisée' : '✓ Dispo'}
                </span>
              </div>
              <button 
                className="mc-button danger" 
                style={{ padding: '6px 10px', fontSize: '7px' }}
                onClick={() => setConfirmConfig({
                  title: 'Supprimer la clé',
                  message: 'Êtes-vous sûr de vouloir supprimer cette clé de licence ?',
                  action: async () => {
                    try {
                      await deleteDoc(doc(db, 'licenseKeys', k.id))
                      setKeys(prev => prev.filter(keyItem => keyItem.id !== k.id))
                    } catch (err) {
                      console.error('Error deleting key:', err)
                    }
                  }
                })}
                title="Supprimer la clé"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mc-panel" style={{ marginTop: '20px' }}>
        <h3 style={{ color: 'var(--honey-light)', fontSize: '10px', marginBottom: '10px' }}>👥 Gestion des Comptes</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Réinitialiser MDP :</label>
          <input
            type="email"
            value={resetEmail}
            onChange={e => setResetEmail(e.target.value)}
            placeholder="Email du joueur"
            className="license-input"
            style={{ flex: 1, minWidth: '150px', padding: '8px', textTransform: 'none', letterSpacing: 'normal', fontSize: '9px' }}
          />
          <button
            className="mc-button primary"
            onClick={handleAdminResetPassword}
            disabled={!resetEmail}
          >
            📧 Envoyer Lien
          </button>
        </div>
        {resetMsg && <div style={{ fontSize: '8px', marginTop: '8px', color: 'var(--text-honey)' }}>{resetMsg}</div>}
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
          <label style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Débannir Joueur :</label>
          <input
            type="email"
            value={unbanEmail}
            onChange={e => setUnbanEmail(e.target.value)}
            placeholder="Email du joueur banni"
            className="license-input"
            style={{ flex: 1, minWidth: '150px', padding: '8px', textTransform: 'none', letterSpacing: 'normal', fontSize: '9px' }}
          />
          <button
            className="mc-button primary"
            onClick={handleAdminUnban}
            disabled={!unbanEmail}
          >
            👼 Débannir
          </button>
        </div>
        {unbanMsg && <div style={{ fontSize: '8px', marginTop: '8px', color: 'var(--text-honey)' }}>{unbanMsg}</div>}
      </div>

      <div className="mc-panel" style={{ marginTop: '20px' }}>
        <h3 style={{ color: 'var(--honey-light)', fontSize: '10px', marginBottom: '10px' }}>💡 Retours & Bugs</h3>
        {feedbacks.length === 0 ? (
          <div className="loading-text" style={{ textAlign: 'center', opacity: 0.5 }}>Aucun retour en attente.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {feedbacks.map(fb => (
              <div key={fb.id} style={{
                background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px',
                borderLeft: `3px solid ${fb.type === 'bug' ? '#ff4444' : '#ffaa00'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 'bold' }}>{fb.userName} <span style={{ opacity: 0.5 }}>({fb.type})</span></span>
                  <span style={{ fontSize: '7px', opacity: 0.5 }}>{new Date(fb.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginBottom: '10px', whiteSpace: 'pre-line' }}>
                  {fb.content}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="mc-button" style={{ flex: 1, padding: '5px', fontSize: '8px' }} onClick={() => handleUpdateFeedbackStatus(fb.id, 'refused')}>
                    ❌ Refuser
                  </button>
                  <button className="mc-button primary" style={{ flex: 1, padding: '5px', fontSize: '8px' }} onClick={() => handleUpdateFeedbackStatus(fb.id, 'accepted')}>
                    ✅ Accepter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!confirmConfig}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        onConfirm={() => {
          confirmConfig.action()
          setConfirmConfig(null)
        }}
        onCancel={() => setConfirmConfig(null)}
      />
    </div>
  )
}
