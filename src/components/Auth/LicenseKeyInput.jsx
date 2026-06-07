// ===================================================
// LicenseKeyInput — License key validation + Google sign-in
// ===================================================

import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function LicenseKeyInput({ onBack }) {
  const { validateLicenseKey, signInWithGoogle, error, setError } = useAuth()
  const [key, setKey] = useState('')
  const [step, setStep] = useState('enter') // 'enter' | 'validated'
  const [loading, setLoading] = useState(false)
  const [keyDocId, setKeyDocId] = useState(null)

  const handleValidateKey = async () => {
    if (!key.trim()) return
    setLoading(true)
    const result = await validateLicenseKey(key)
    if (result.valid) {
      setKeyDocId(result.keyDocId)
      setStep('validated')
      setError(null)
    }
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    await signInWithGoogle(keyDocId)
    setLoading(false)
  }

  return (
    <div>
      {step === 'enter' && (
        <>
          <div className="license-input-group">
            <label htmlFor="license-key-input">Entrez votre clé de licence :</label>
            <input
              id="license-key-input"
              type="text"
              className="license-input"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="XXXX-XXXX-XXXX"
              maxLength={20}
              disabled={loading}
              onKeyDown={e => e.key === 'Enter' && handleValidateKey()}
            />
          </div>

          {error && <div className="license-error">{error}</div>}

          <div className="login-buttons">
            <button
              className="mc-button primary"
              onClick={handleValidateKey}
              disabled={loading || !key.trim()}
              id="btn-validate-key"
            >
              {loading ? '⏳ Vérification...' : '✅ Valider la clé'}
            </button>
            <button
              className="mc-button"
              onClick={onBack}
              disabled={loading}
              id="btn-back"
            >
              ← Retour
            </button>
          </div>
        </>
      )}

      {step === 'validated' && (
        <>
          <div className="license-success">
            ✅ Clé valide ! Connectez-vous pour lier votre compte.
          </div>

          <div className="login-buttons" style={{ marginTop: '16px' }}>
            <button
              className="mc-button primary"
              onClick={handleGoogleSignIn}
              disabled={loading}
              id="btn-google-signin"
            >
              {loading ? '⏳ Connexion...' : '🔗 Se connecter avec Google'}
            </button>
            <button
              className="mc-button"
              onClick={onBack}
              disabled={loading}
            >
              ← Retour
            </button>
          </div>

          {error && <div className="license-error">{error}</div>}
        </>
      )}
    </div>
  )
}
