// ===================================================
// AdminPanel — Generate and manage license keys
// ===================================================

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase'
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, where, setDoc, serverTimestamp } from 'firebase/firestore'
import ConfirmModal from '../UI/ConfirmModal'
import emailjs from '@emailjs/browser'

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
  const { userProfile, resetPassword } = useAuth()
  const [keys, setKeys] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [keyRequests, setKeyRequests] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [keysToGenerate, setKeysToGenerate] = useState(1)
  const [confirmConfig, setConfirmConfig] = useState(null)

  // Check admin access
  const isAdmin = userProfile?.isAdmin === true

  // Load existing keys
  useEffect(() => {
    if (!isAdmin) return
    const loadData = async () => {
      // Load Keys
      try {
        const keysRef = collection(db, 'licenseKeys')
        const qKeys = query(keysRef, orderBy('createdAt', 'desc'))
        const snapshotKeys = await getDocs(qKeys)
        const keysData = []
        snapshotKeys.forEach(doc => keysData.push({ id: doc.id, ...doc.data() }))
        setKeys(keysData)
      } catch (err) { console.error('Error loading keys:', err) }

      // Load Feedbacks
      try {
        const feedbacksRef = collection(db, 'feedbacks')
        const qFeedbacks = query(feedbacksRef, where('status', '==', 'pending'))
        const snapshotFeedbacks = await getDocs(qFeedbacks)
        const feedbacksData = []
        snapshotFeedbacks.forEach(doc => feedbacksData.push({ id: doc.id, ...doc.data() }))
        setFeedbacks(feedbacksData)
      } catch (err) { console.error('Error loading feedbacks:', err) }

      // Load Key Requests
      try {
        const keyReqsRef = collection(db, 'keyRequests')
        const qKeyReqs = query(keyReqsRef, where('status', '==', 'pending'))
        const snapshotKeyReqs = await getDocs(qKeyReqs)
        const keyReqsData = []
        snapshotKeyReqs.forEach(doc => keyReqsData.push({ id: doc.id, ...doc.data() }))
        setKeyRequests(keyReqsData)
      } catch (err) { console.error('Error loading key requests:', err) }

      // Load All Users
      try {
        const usersRef = collection(db, 'users')
        const snapshotUsers = await getDocs(usersRef)
        const usersData = []
        snapshotUsers.forEach(doc => usersData.push({ id: doc.id, ...doc.data() }))
        setAllUsers(usersData)
      } catch (err) { console.error('Error loading users:', err) }

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

  const handleAdminResetPassword = async (email) => {
    if (!email) return
    const success = await resetPassword(email)
    if (success) {
      window.dispatchEvent(new CustomEvent('system_toast', { detail: { type: 'success', message: '✅ Email envoyé à ' + email } }))
    } else {
      window.dispatchEvent(new CustomEvent('system_toast', { detail: { type: 'error', message: '❌ Erreur. Vérifiez l\'adresse email.' } }))
    }
  }

  const handleAdminToggleBan = async (uid, currentBanned) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isBanned: !currentBanned })
      setAllUsers(prev => prev.map(u => u.id === uid ? { ...u, isBanned: !currentBanned } : u))
      window.dispatchEvent(new CustomEvent('system_toast', { detail: { type: 'success', message: `Utilisateur ${!currentBanned ? 'banni' : 'débanni'} avec succès.` } }))
    } catch (err) {
      console.error('Error toggling ban:', err)
      window.dispatchEvent(new CustomEvent('system_toast', { detail: { type: 'error', message: 'Erreur lors de la modification du ban.' } }))
    }
  }

  const handleUpdateFeedbackStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'feedbacks', id), { status: newStatus })
      setFeedbacks(prev => prev.filter(f => f.id !== id))
    } catch (err) {
      console.error('Error updating feedback:', err)
    }
  }

  const handleAcceptKeyRequest = async (reqId, reqEmail) => {
    try {
      // Generate a key
      const key = generateKey()
      const docRef = await addDoc(collection(db, 'licenseKeys'), {
        key,
        used: false,
        usedBy: null,
        usedAt: null,
        assignedTo: reqEmail, // custom field
        createdAt: new Date().toISOString(),
      })
      setKeys(prev => [{ id: docRef.id, key, used: false, createdAt: new Date().toISOString() }, ...prev])

      // Mark request as accepted
      await updateDoc(doc(db, 'keyRequests', reqId), { status: 'accepted' })
      setKeyRequests(prev => prev.filter(r => r.id !== reqId))

      // Send automatic email via EmailJS
      try {
        await emailjs.send(
          'service_1nnx9dm',
          'template_t1wewfw',
          {
            to_email: reqEmail,
            license_key: key
          },
          'kd0xQRVDvlo20ozPW'
        )
        window.dispatchEvent(new CustomEvent('system_toast', { detail: { type: 'success', message: `Clé générée et envoyée automatiquement à ${reqEmail} !` } }))
      } catch (emailErr) {
        console.error('Erreur lors de l\'envoi EmailJS:', emailErr)
        window.dispatchEvent(new CustomEvent('system_toast', { detail: { type: 'error', message: `Clé générée, mais l'envoi automatique a échoué.\nClé : ${key}` } }))
      }
    } catch (err) {
      console.error('Error accepting key request:', err)
    }
  }

  const handleRefuseKeyRequest = async (reqId) => {
    try {
      await updateDoc(doc(db, 'keyRequests', reqId), { status: 'refused' })
      setKeyRequests(prev => prev.filter(r => r.id !== reqId))
    } catch (err) {
      console.error('Error refusing key request:', err)
    }
  }

  const copyKey = (key) => {
    navigator.clipboard.writeText(key)
  }

  const handleTriggerGlobalIntermission = async () => {
    if (!isAdmin) return
    setConfirmConfig({
      title: '🔴 Lancer une Intermission Globale',
      message: 'Attention : Cela va forcer la lecture de la vidéo d\'intermission INSTANTANÉMENT pour tous les joueurs actuellement en ligne. Confirmer ?',
      action: async () => {
        try {
          await setDoc(doc(db, 'serverEvents', 'intermission'), {
            triggeredAt: serverTimestamp(),
            triggeredBy: userProfile.email
          })
          window.dispatchEvent(new CustomEvent('system_toast', { detail: { type: 'success', message: '🚀 Intermission globale lancée à tous les joueurs !' } }))
        } catch (err) {
          console.error('Error triggering intermission:', err)
          window.dispatchEvent(new CustomEvent('system_toast', { detail: { type: 'error', message: 'Erreur lors du lancement de l\'intermission.' } }))
        }
      }
    })
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
          {keys.map(k => {
            const usedByUser = k.used && k.usedBy ? allUsers.find(u => u.id === k.usedBy) : null

            return (
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
                  {usedByUser ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '10px' }}>
                      {usedByUser.photoURL ? (
                        <img src={usedByUser.photoURL} alt="" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                      ) : (
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>
                          {usedByUser.displayName ? usedByUser.displayName.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                      <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{usedByUser.displayName}</span>
                    </div>
                  ) : k.assignedTo ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '10px' }}>
                      <span style={{ fontSize: '9px', color: '#3498db' }}>Générée pour: {k.assignedTo}</span>
                    </div>
                  ) : null}
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
            )
          })}
        </div>
      </div>

      {/* NEW: Global Event Controls Section */}
      <div className="mc-panel" style={{ marginTop: '20px', borderLeft: '3px solid var(--cannot-afford)' }}>
        <h3 style={{ color: 'var(--cannot-afford)', fontSize: '10px', marginBottom: '10px' }}>🌍 Évènements Globaux</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '4px', flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '12px' }}>Intermission</h4>
                <p style={{ margin: '5px 0 0 0', fontSize: '8px', color: 'var(--text-secondary)' }}>
                  Déclenche instantanément l'intermission sur l'écran de TOUS les joueurs actuellement connectés au jeu.
                </p>
              </div>
              <button
                className="mc-button danger"
                onClick={handleTriggerGlobalIntermission}
                style={{ fontSize: '10px', padding: '10px 15px', animation: 'pulse 2s infinite', whiteSpace: 'nowrap' }}
              >
                🔴 LANCER POUR TOUS
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mc-panel" style={{ marginTop: '20px' }}>
        <h3 style={{ color: 'var(--honey-light)', fontSize: '10px', marginBottom: '10px' }}>👥 Gestion des Joueurs</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
          {allUsers.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', borderLeft: u.isBanned ? '3px solid #ff4444' : '3px solid #2ecc71' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {u.photoURL ? (
                  <img src={u.photoURL} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                ) : (
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                    {u.displayName ? u.displayName.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{u.displayName || 'Sans nom'} {u.isBanned && <span style={{ color: '#ff4444' }}>(Banni)</span>}</span>
                  <span style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>{u.email}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  className="mc-button"
                  style={{ padding: '5px 8px', fontSize: '8px' }}
                  onClick={() => handleAdminResetPassword(u.email)}
                  title="Envoyer email de réinitialisation"
                >
                  📧 MDP
                </button>
                <button
                  className={`mc-button ${u.isBanned ? 'primary' : 'danger'}`}
                  style={{ padding: '5px 8px', fontSize: '8px' }}
                  onClick={() => handleAdminToggleBan(u.id, u.isBanned)}
                  title={u.isBanned ? 'Débannir' : 'Bannir'}
                >
                  {u.isBanned ? '👼 Débannir' : '🔨 Bannir'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mc-panel" style={{ marginTop: '20px' }}>
        <h3 style={{ color: 'var(--honey-light)', fontSize: '10px', marginBottom: '10px' }}>✉️ Demandes de Clés</h3>
        {keyRequests.length === 0 ? (
          <div className="loading-text" style={{ textAlign: 'center', opacity: 0.5 }}>Aucune demande en attente.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {keyRequests.map(req => (
              <div key={req.id} style={{
                background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px',
                borderLeft: `3px solid #3498db`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '4px' }}>{req.email}</div>
                  <div style={{ fontSize: '7px', opacity: 0.5 }}>{new Date(req.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="mc-button" style={{ padding: '5px', fontSize: '8px' }} onClick={() => handleRefuseKeyRequest(req.id)}>
                    ❌
                  </button>
                  <button className="mc-button primary" style={{ padding: '5px', fontSize: '8px' }} onClick={() => handleAcceptKeyRequest(req.id, req.email)}>
                    🔑 Générer Clé
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
