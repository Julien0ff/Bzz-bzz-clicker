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

  const handleExistingLogin = async () => {
    setLoading(true)
    await signInExistingUser()
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
              onClick={handleExistingLogin}
              disabled={loading}
              id="btn-existing-account"
            >
              {loading ? '⏳ Connexion...' : '🔄 J\'ai déjà un compte'}
            </button>

            {error && <div className="license-error">{error}</div>}
          </div>
        )}

        {mode === 'license' && (
          <LicenseKeyInput onBack={() => { setError(null); setMode('choose') }} />
        )}
      </div>
    </div>
  )
}
