// ===================================================
// LoginScreen — Auth screen with license key system
// ===================================================

import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LicenseKeyInput from './LicenseKeyInput'
import beeSrc from '/assets/Bee_(Dungeons).png'

export default function LoginScreen() {
  const { signInExistingUser, error, setError } = useAuth()
  const [mode, setMode] = useState('choose') // 'choose' | 'license' | 'login'
  const [loading, setLoading] = useState(false)

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
    const success = await useAuth().signInWithEmail(email, password)
    if (!success) setLoading(false)
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
      </div>
    </div>
  )
}
