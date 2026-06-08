// ===================================================
// App.jsx — Root component with routing and layout
// ===================================================

import React, { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { GameProvider, useGame } from './contexts/GameContext'
import LoginScreen from './components/Auth/LoginScreen'
import GamePage from './pages/GamePage'
import Leaderboard from './components/Social/Leaderboard'
import FriendsList from './components/Social/FriendsList'
import StatisticsPanel from './components/Social/StatisticsPanel'
import AdminPanel from './components/Admin/AdminPanel'
import ConfirmModal from './components/UI/ConfirmModal'
import FeedbackModal from './components/UI/FeedbackModal'
import { useGameLoop } from './hooks/useGameLoop'
import { useSaveGame } from './hooks/useSaveGame'
import beeSrc from '/assets/Bee_(Dungeons).png'

// --- Settings Modal ---
function SettingsModal({ onClose }) {
  const { user, userProfile, validateLicenseKey, updateUserProfilePicture, resetPassword, linkGoogleAccount, logout } = useAuth()
  const [newKey, setNewKey] = useState('')
  const [pfpUrl, setPfpUrl] = useState(userProfile?.photoURL || '')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [confirmConfig, setConfirmConfig] = useState(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const handleUpdateKey = async () => {
    if (!newKey) return
    setLoading(true)
    setMsg('')
    try {
      const { doc, updateDoc } = await import('firebase/firestore')
      const { db } = await import('./firebase')
      
      const validation = await validateLicenseKey(newKey)
      if (validation.valid) {
        // Mark new key as used
        await updateDoc(doc(db, 'licenseKeys', validation.keyDocId), {
          used: true,
          usedBy: user.uid,
          usedAt: new Date().toISOString()
        })
        // Update user profile
        await updateDoc(doc(db, 'users', user.uid), {
          licenseKey: validation.keyDocId
        })
        setMsg('Clé mise à jour !')
        setNewKey('')
      } else {
        setMsg(validation.error || 'Clé invalide.')
      }
    } catch (err) {
      setMsg('Erreur : ' + err.message)
    }
    setLoading(false)
  }

  const handleUpdatePfp = async () => {
    setLoading(true)
    setMsg('')
    const success = await updateUserProfilePicture(pfpUrl)
    if (success) {
      setMsg('Photo de profil mise à jour !')
    } else {
      setMsg('Erreur lors de la mise à jour de la photo.')
    }
    setLoading(false)
  }

  const handleResetPassword = async () => {
    setLoading(true)
    setMsg('')
    const success = await resetPassword(userProfile?.email || user?.email)
    if (success) {
      setMsg('Email de réinitialisation envoyé !')
    } else {
      setMsg('Erreur lors de l\'envoi de l\'email.')
    }
    setLoading(false)
  }

  const handleLinkGoogle = async () => {
    setLoading(true)
    setMsg('')
    const success = await linkGoogleAccount()
    if (success) {
      setMsg('Compte Google lié avec succès !')
    } else {
      setMsg('Erreur lors de la liaison du compte.')
    }
    setLoading(false)
  }

  const handleResetProgressClick = () => {
    setConfirmConfig({
      title: 'Réinitialiser la progression',
      message: 'Voulez-vous vraiment remettre à zéro toute votre progression ?\n\nCette action est irréversible.',
      action: async () => {
        setLoading(true)
        try {
          const { doc, deleteDoc } = await import('firebase/firestore')
          const { db } = await import('./firebase')
          window.isResetting = true // Empêche la sauvegarde automatique lors du rechargement
          await deleteDoc(doc(db, 'saves', user.uid))
          window.location.reload()
        } catch (err) {
          window.isResetting = false
          setMsg('Erreur : ' + err.message)
          setLoading(false)
        }
      }
    })
  }

  const handleDeleteAccountClick = () => {
    setConfirmConfig({
      title: 'Supprimer le compte',
      message: 'ATTENTION : Voulez-vous vraiment supprimer définitivement votre compte et votre sauvegarde ?\n\nCeci effacera toutes vos données.',
      action: async () => {
        setLoading(true)
        try {
          const { doc, deleteDoc } = await import('firebase/firestore')
          const { db, auth } = await import('./firebase')
          const { deleteUser } = await import('firebase/auth')
          
          // Delete save and profile
          await deleteDoc(doc(db, 'saves', user.uid)).catch(console.error)
          await deleteDoc(doc(db, 'users', user.uid)).catch(console.error)
          
          // Delete Auth user
          if (auth.currentUser) {
            await deleteUser(auth.currentUser)
          }
          logout()
        } catch (err) {
          setMsg('Erreur, vous devez peut-être vous reconnecter pour supprimer le compte.')
          setLoading(false)
        }
      }
    })
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="mc-panel" style={{ width: '450px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2>⚙️ PARAMÈTRES</h2>
        
        {/* Photo de profil */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '8px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            URL Photo de Profil
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              className="license-input" 
              value={pfpUrl} 
              onChange={e => setPfpUrl(e.target.value)}
              placeholder="https://exemple.com/image.png"
              style={{ flex: 1, padding: '8px', fontSize: '9px', textTransform: 'none', letterSpacing: 'normal' }}
            />
            <button className="mc-button primary" onClick={handleUpdatePfp} disabled={loading}>
              Mettre à jour
            </button>
          </div>
        </div>

        {/* Clé Licence */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '8px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Ajouter/Modifier Clé Licence
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              className="license-input" 
              value={newKey} 
              onChange={e => setNewKey(e.target.value)}
              placeholder="XXXX-XXXX-XXXX"
              style={{ flex: 1, padding: '8px', fontSize: '9px' }}
            />
            <button className="mc-button primary" onClick={handleUpdateKey} disabled={loading}>
              Valider
            </button>
          </div>
        </div>
        
        {msg && <div style={{ fontSize: '8px', margin: '10px 0', color: 'var(--text-honey)', textAlign: 'center' }}>{msg}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
          <button className="mc-button" onClick={() => setFeedbackOpen(true)} disabled={loading}>
            💡 Faire un retour (Bug/Idée)
          </button>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="mc-button" onClick={handleLinkGoogle} disabled={loading} style={{ flex: 1 }}>
              🔗 Lier Compte Google
            </button>
            <button className="mc-button" onClick={handleResetPassword} disabled={loading} style={{ flex: 1 }}>
              📧 Réinit. MDP
            </button>
          </div>

          <button className="mc-button" onClick={handleResetProgressClick} disabled={loading} style={{ background: '#c47a09' }}>
            🔄 Réinitialiser la progression
          </button>
          <button className="mc-button danger" onClick={handleDeleteAccountClick} disabled={loading}>
            🗑️ Supprimer le compte
          </button>
          <button className="mc-button" onClick={onClose} disabled={loading} style={{ marginTop: '10px' }}>
            Fermer
          </button>
        </div>
      </div>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

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

// --- Top Navigation Bar ---
function TopBar() {
  const { user, userProfile, logout } = useAuth()
  const gameState = useGame()
  const navigate = useNavigate()
  const location = useLocation()
  const [showSettings, setShowSettings] = useState(false)

  const isActive = (path) => location.pathname === path ? 'active' : ''

  const handleLogout = async (e) => {
    e.stopPropagation() // Prevent opening settings when clicking logout
    // Save state before logging out
    try {
      if (user && gameState) {
        const { doc, setDoc } = await import('firebase/firestore')
        const { db } = await import('./firebase')
        const saveData = {
          honey: gameState.honey,
          totalHoney: gameState.totalHoney,
          clickPower: gameState.clickPower,
          honeyPerSecond: gameState.honeyPerSecond,
          upgrades: gameState.upgrades,
          clickUpgrades: gameState.clickUpgrades,
          totalClicks: gameState.totalClicks || 0,
          playTime: gameState.playTime || 0,
          achievements: gameState.achievements || [],
          royalJelly: gameState.royalJelly || 0,
          lastSaved: new Date().toISOString(),
        }
        await setDoc(doc(db, 'saves', user.uid), saveData)
      }
    } catch (err) {
      console.error('Error saving before logout:', err)
    }
    
    // Proceed to logout
    logout()
  }

  return (
    <>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <div className="top-bar" id="top-bar">
        <div className="top-bar-title" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={beeSrc} alt="Bee" />
          <span>Bee Clicker</span>
        </div>

        <div className="top-bar-nav">
          <button
            className={`top-bar-btn ${isActive('/')}`}
            onClick={() => navigate('/')}
            id="nav-game"
          >
            <span style={{ fontSize: '11px', transform: 'translateY(-1px)' }}>🎮</span>
            <span>Jeu</span>
          </button>
          <button
            className={`top-bar-btn ${isActive('/leaderboard')}`}
            onClick={async () => {
              // Force a save to ensure the leaderboard is up-to-date
              if (user && gameState) {
                try {
                  const { doc, setDoc } = await import('firebase/firestore')
                  const { db } = await import('./firebase')
                  const saveData = {
                    honey: gameState.honey,
                    totalHoney: gameState.totalHoney,
                    clickPower: gameState.clickPower,
                    honeyPerSecond: gameState.honeyPerSecond,
                    upgrades: gameState.upgrades,
                    clickUpgrades: gameState.clickUpgrades,
                    totalClicks: gameState.totalClicks || 0,
                    playTime: gameState.playTime || 0,
                    achievements: gameState.achievements || [],
                    royalJelly: gameState.royalJelly || 0,
                    lastSaved: new Date().toISOString(),
                  }
                  await setDoc(doc(db, 'saves', user.uid), saveData)
                } catch (err) {
                  console.error('Error forcing save:', err)
                }
              }
              navigate('/leaderboard')
            }}
            id="nav-leaderboard"
          >
            <span style={{ fontSize: '11px', transform: 'translateY(-1px)' }}>🏆</span>
            <span>Classement</span>
          </button>
          <button
            className={`top-bar-btn ${isActive('/friends')}`}
            onClick={() => navigate('/friends')}
            id="nav-friends"
          >
            <span style={{ fontSize: '11px', transform: 'translateY(-1px)' }}>👥</span>
            <span>Amis</span>
          </button>
          <button
            className={`top-bar-btn ${isActive('/stats')}`}
            onClick={() => navigate('/stats')}
            id="nav-stats"
          >
            <span style={{ fontSize: '11px', transform: 'translateY(-1px)' }}>📊</span>
            <span>Stats</span>
          </button>
          {userProfile?.isAdmin && (
            <button
              className={`top-bar-btn ${isActive('/admin')}`}
              onClick={() => navigate('/admin')}
              id="nav-admin"
            >
              <span style={{ fontSize: '11px', transform: 'translateY(-1px)' }}>⚙️</span>
              <span>Admin</span>
            </button>
          )}
        </div>

        <div 
          className="top-bar-user" 
          onClick={() => setShowSettings(true)}
          style={{ cursor: 'pointer' }}
          title="Paramètres du compte"
        >
          {user?.photoURL && (
            <img src={user.photoURL} alt="" className="top-bar-avatar" />
          )}
          <span className="top-bar-username" style={{ textDecoration: 'underline dotted' }}>
            {userProfile?.displayName || user?.displayName || ''}
          </span>
          <button
            className="top-bar-btn"
            onClick={handleLogout}
            id="btn-logout"
            style={{ fontSize: '7px', color: 'var(--cannot-afford)', marginLeft: '8px' }}
          >
            Déco
          </button>
        </div>
      </div>
    </>
  )
}

// --- Achievement Toast System ---
function AchievementToast() {
  const [toast, setToast] = useState(null)

  React.useEffect(() => {
    const handleUnlock = (e) => {
      setToast(e.detail)
      setTimeout(() => setToast(null), 5000) // Hide after 5s
    }
    window.addEventListener('achievement_unlocked', handleUnlock)
    return () => window.removeEventListener('achievement_unlocked', handleUnlock)
  }, [])

  if (!toast) return null

  return (
    <div className="achievement-toast">
      <div className="achievement-icon">{toast.icon}</div>
      <div className="achievement-text">
        <h4>Succès déverrouillé !</h4>
        <p>{toast.name}</p>
      </div>
    </div>
  )
}

// --- Authenticated Layout ---
function GameEngine() {
  useGameLoop()
  useSaveGame()
  return null
}

function AuthenticatedApp() {
  return (
    <GameProvider>
      <GameEngine />
      <AchievementToast />
      <TopBar />
      <div style={{ paddingTop: '48px', height: '100vh', boxSizing: 'border-box', overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<GamePage />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/friends" element={<FriendsList />} />
          <Route path="/stats" element={<StatisticsPanel />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </GameProvider>
  )
}

// --- Auth Gate ---
function AuthGate() {
  const { userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <img
          src={beeSrc}
          alt="Loading"
          style={{
            width: '80px',
            height: '80px',
            imageRendering: 'pixelated',
            animation: 'loginBeeBounce 1s ease-in-out infinite',
          }}
        />
        <div className="loading-bar-container">
          <div className="loading-bar" />
        </div>
        <div className="loading-text">Chargement de la ruche...</div>
      </div>
    )
  }

  if (!userProfile) {
    return <LoginScreen />
  }

  return <AuthenticatedApp />
}

// --- Root App ---
export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}
