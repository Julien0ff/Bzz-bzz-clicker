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

  const [pseudo, setPseudo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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

  const handleEmailSignUp = async (e) => {
    e.preventDefault()
    if (!email || !password || !pseudo) return
    setLoading(true)
    const success = await useAuth().signUpWithEmail(email, password, pseudo, keyDocId)
    if (!success) setLoading(false)
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
        <form onSubmit={handleEmailSignUp}>
          <div className="license-success">
            ✅ Clé valide ! Créez votre compte.
          </div>

          <div className="login-buttons" style={{ marginTop: '16px' }}>
            <div className="license-input-group">
              <label>Pseudo (Identifiant en jeu) :</label>
              <input
                type="text"
                className="license-input"
                value={pseudo}
                onChange={e => setPseudo(e.target.value)}
                placeholder="Ex: RoiAbeille99"
                disabled={loading}
                style={{ textTransform: 'none', letterSpacing: 'normal' }}
              />
            </div>
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
              <label>Mot de passe (min 6 carac.) :</label>
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

            <button type="submit" className="mc-button primary" disabled={loading || !email || !password || !pseudo}>
              {loading ? '⏳ Inscription...' : '🚀 S\'inscrire'}
            </button>

            <div className="login-divider">
              <span>ou</span>
            </div>

            <button
              type="button"
              className="mc-button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              id="btn-google-signin"
            >
              🔗 S'inscrire avec Google
            </button>
            <button
              type="button"
              className="mc-button danger"
              onClick={onBack}
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              ← Retour
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
