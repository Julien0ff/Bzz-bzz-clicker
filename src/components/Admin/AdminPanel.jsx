// ===================================================
// AdminPanel — Generate and manage license keys
// ===================================================

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase'
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore'
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
  const { userProfile } = useAuth()
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [keysToGenerate, setKeysToGenerate] = useState(1)
  const [confirmConfig, setConfirmConfig] = useState(null)

  // Check admin access
  const isAdmin = userProfile?.isAdmin === true

  // Load existing keys
  useEffect(() => {
    if (!isAdmin) return

    const loadKeys = async () => {
      try {
        const keysRef = collection(db, 'licenseKeys')
        const q = query(keysRef, orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(q)

        const keysData = []
        snapshot.forEach(doc => {
          keysData.push({ id: doc.id, ...doc.data() })
        })
        setKeys(keysData)
      } catch (err) {
        console.error('Error loading keys:', err)
      }
      setLoading(false)
    }

    loadKeys()
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
