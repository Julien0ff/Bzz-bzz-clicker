// ===================================================
// LoginScreen — Auth screen with license key system
// ===================================================

import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LicenseKeyInput from './LicenseKeyInput'
import beeSrc from '/assets/Bee_(Dungeons).png'

export default function LoginScreen() {
  const { signInExistingUser, signInWithEmail, error, setError } = useAuth()
  const [mode, setMode] = useState('choose') // 'choose' | 'license' | 'login' | 'keyRequest'
  const [loading, setLoading] = useState(false)
  const [requestEmail, setRequestEmail] = useState('')
  const [requestMsg, setRequestMsg] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleExistingLogin = async () => {
    setLoading(true)
    await signInExistingUser()
    setLoading(false)
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    const success = await signInWithEmail(email, password)
    if (!success) setLoading(false)
  }

  const handleRequestKey = async (e) => {
    e.preventDefault()
    if (!requestEmail) return
    setLoading(true)
    setRequestMsg('')
    try {
      const { collection, addDoc } = await import('firebase/firestore')
      const { db } = await import('../../firebase')
      
      await addDoc(collection(db, 'keyRequests'), {
        email: requestEmail,
        status: 'pending',
        createdAt: new Date().toISOString()
      })
      setRequestMsg('Demande envoyée ! Un admin traitera votre demande.')
      setRequestEmail('')
    } catch (err) {
      console.error(err)
      setRequestMsg("Erreur lors de l'envoi de la demande.")
    }
    setLoading(false)
  }

  return (
    <div className="login-screen">
      {/* Hex background pattern */}
      <div className="hex-bg" />

      <div className="login-card mc-panel">
        <img
          src={beeSrc}
          alt="Bee Clicker"
          className="login-bee-icon"
        />

        <h1 className="login-title">Bee Clicker</h1>
        <p className="login-subtitle">🐝 Collecte du miel, deviens le roi des abeilles 🐝</p>

        {mode === 'choose' && (
          <div className="login-buttons">
            <button
              className="mc-button primary"
              onClick={() => { setError(null); setMode('license') }}
              id="btn-has-key"
            >
              🔑 J'ai une clé de licence
            </button>

            <div className="login-divider">
              <span>ou</span>
            </div>

            <button
              className="mc-button"
              onClick={() => { setError(null); setMode('login') }}
              disabled={loading}
              id="btn-existing-account"
            >
              🔄 J'ai déjà un compte
            </button>

            <button
              className="mc-button"
              onClick={() => { setError(null); setRequestMsg(''); setMode('keyRequest') }}
              disabled={loading}
              style={{ marginTop: '8px', background: '#c47a09' }}
            >
              ✉️ Demander une clé
            </button>

            {error && <div className="license-error">{error}</div>}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleEmailLogin} className="login-buttons">
            <div className="license-input-group">
              <label>Email :</label>
              <input
                type="email"
                className="license-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="joueur@email.com"
                disabled={loading}
                style={{ textTransform: 'none', letterSpacing: 'normal' }}
              />
            </div>
            <div className="license-input-group">
              <label>Mot de passe :</label>
              <input
                type="password"
                className="license-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                style={{ textTransform: 'none', letterSpacing: 'normal' }}
              />
            </div>

            {error && <div className="license-error">{error}</div>}

            <button type="submit" className="mc-button primary" disabled={loading || !email || !password}>
              {loading ? '⏳ Connexion...' : '✅ Se connecter'}
            </button>

            <div className="login-divider">
              <span>ou</span>
            </div>

            <button type="button" className="mc-button" onClick={handleExistingLogin} disabled={loading}>
              🔗 Google
            </button>
            <button type="button" className="mc-button danger" onClick={() => setMode('choose')} disabled={loading} style={{ marginTop: '8px' }}>
              ← Retour
            </button>
          </form>
        )}

        {mode === 'license' && (
          <LicenseKeyInput onBack={() => { setError(null); setMode('choose') }} />
        )}

        {mode === 'keyRequest' && (
          <form onSubmit={handleRequestKey} className="login-buttons">
            <h2 style={{ fontSize: '10px', color: 'var(--text-honey)', textAlign: 'center' }}>Demande de Clé</h2>
            <p style={{ fontSize: '8px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '10px' }}>
              Entrez votre email pour recevoir une clé d'accès.
            </p>
            <div className="license-input-group">
              <input
                type="email"
                className="license-input"
                value={requestEmail}
                onChange={e => setRequestEmail(e.target.value)}
                placeholder="votre@email.com"
                disabled={loading}
                style={{ textTransform: 'none', letterSpacing: 'normal' }}
              />
            </div>

            {requestMsg && <div style={{ fontSize: '8px', margin: '10px 0', color: 'var(--text-honey)', textAlign: 'center' }}>{requestMsg}</div>}

            <button type="submit" className="mc-button primary" disabled={loading || !requestEmail}>
              {loading ? '⏳ Envoi...' : '✅ Envoyer'}
            </button>
            <button type="button" className="mc-button danger" onClick={() => setMode('choose')} disabled={loading} style={{ marginTop: '8px' }}>
              ← Retour
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
