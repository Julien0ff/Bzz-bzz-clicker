// ===================================================
// App.jsx — Root component with routing and layout
// ===================================================

import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { GameProvider, useGame } from './contexts/GameContext'
import { useLanguage } from './contexts/LanguageContext'
import LoginScreen from './components/Auth/LoginScreen'
import GamePage from './pages/GamePage'
import Leaderboard from './components/Social/Leaderboard'
import FriendsList from './components/Social/FriendsList'
import StatisticsPanel from './components/Social/StatisticsPanel'
import AdminPanel from './components/Admin/AdminPanel'
import CoopRaid from './components/Game/CoopRaid'
import ConfirmModal from './components/UI/ConfirmModal'
import FeedbackModal from './components/UI/FeedbackModal'
import ChangelogModal from './components/UI/ChangelogModal'
import BanScreen from './components/UI/BanScreen'
import { useGameLoop } from './hooks/useGameLoop'
import { useSaveGame } from './hooks/useSaveGame'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import beeSrc from '/assets/Bee_(Dungeons).png'
import MusicPlayer from './components/UI/MusicPlayer'
import Intermission from './components/UI/Intermission'
import { APP_VERSION } from './data/changelog'

// --- Settings Modal ---
function SettingsModal({ onClose, onOpenChangelog }) {
  const { user, userProfile, validateLicenseKey, updateUserProfilePicture, resetPassword, linkGoogleAccount, logout } = useAuth()
  const gameState = useGame()
  const { language, setLanguage, t } = useLanguage()
  const [newKey, setNewKey] = useState('')
  const [pfpFile, setPfpFile] = useState(null)
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
        await updateDoc(doc(db, 'licenseKeys', validation.keyDocId), {
          used: true,
          usedBy: user.uid,
          usedAt: new Date().toISOString()
        })
        await updateDoc(doc(db, 'users', user.uid), {
          licenseKey: validation.keyDocId
        })
        setMsg(t('settings_key_success'))
        setNewKey('')
      } else {
        setMsg(validation.error || t('settings_key_invalid'))
      }
    } catch (err) {
      setMsg(t('error') + ' : ' + err.message)
    }
    setLoading(false)
  }

  const handleUpdatePfp = async () => {
    if (!pfpFile) return
    setLoading(true)
    setMsg('')
    const success = await updateUserProfilePicture(pfpFile)
    if (success) {
      setMsg(t('settings_pfp_success'))
      setPfpFile(null)
    } else {
      setMsg(t('settings_pfp_error'))
    }
    setLoading(false)
  }

  const isGoogleLinked = user?.providerData?.some(p => p.providerId === 'google.com')

  const handleResetPassword = async () => {
    setLoading(true)
    setMsg('')
    const success = await resetPassword(userProfile?.email || user?.email)
    if (success) {
      setMsg(t('settings_pwd_sent'))
    } else {
      setMsg(t('settings_pwd_error'))
    }
    setLoading(false)
  }

  const handleLinkGoogle = async () => {
    setLoading(true)
    setMsg('')
    const success = await linkGoogleAccount()
    if (success) {
      setMsg(t('settings_google_linked'))
    } else {
      setMsg(t('settings_google_error'))
    }
    setLoading(false)
  }

  const handleResetProgressClick = () => {
    setConfirmConfig({
      title: t('settings_reset_progress'),
      message: language === 'fr' 
        ? 'Voulez-vous vraiment remettre à zéro toute votre progression ?\n\nCette action est irréversible.' 
        : 'Do you really want to reset all your progress?\n\nThis action is irreversible.',
      action: async () => {
        setLoading(true)
        try {
          const { doc, deleteDoc } = await import('firebase/firestore')
          const { db } = await import('./firebase')
          window.isResetting = true
          await deleteDoc(doc(db, 'saves', user.uid))
          window.location.reload()
        } catch (err) {
          window.isResetting = false
          setMsg(t('error') + ' : ' + err.message)
          setLoading(false)
        }
      }
    })
  }

  const handleToggleIntermission = async () => {
    gameState.dispatch({ type: 'TOGGLE_INTERMISSION' })
    try {
      const { doc, updateDoc } = await import('firebase/firestore')
      const { db } = await import('./firebase')
      await updateDoc(doc(db, 'saves', user.uid), {
        intermissionEnabled: !gameState.intermissionEnabled
      })
    } catch (err) {
      console.error('Erreur toggle intermission:', err)
    }
  }

  const handleDeleteAccountClick = () => {
    setConfirmConfig({
      title: t('settings_delete_account'),
      message: language === 'fr'
        ? 'ATTENTION : Voulez-vous vraiment supprimer définitivement votre compte et votre sauvegarde ?\n\nCeci effacera toutes vos données.'
        : 'WARNING: Do you really want to permanently delete your account and save file?\n\nAll your data will be erased.',
      action: async () => {
        setLoading(true)
        try {
          const { doc, deleteDoc } = await import('firebase/firestore')
          const { db, auth } = await import('./firebase')
          const { deleteUser } = await import('firebase/auth')

          await deleteDoc(doc(db, 'saves', user.uid)).catch(console.error)
          await deleteDoc(doc(db, 'users', user.uid)).catch(console.error)

          if (auth.currentUser) {
            await deleteUser(auth.currentUser)
          }
          logout()
        } catch (err) {
          setMsg(t('error'))
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
      <div className="mc-panel" style={{ width: '460px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2>{t('settings_title')}</h2>

        {/* --- Language Switcher --- */}
        <div style={{ marginBottom: '15px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '2px solid var(--mc-border-dark)' }}>
          <label style={{ fontSize: '9px', color: 'var(--text-honey)', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            🌐 {t('settings_language')}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`mc-button ${language === 'fr' ? 'primary' : ''}`}
              onClick={() => setLanguage('fr')}
              style={{
                flex: 1,
                padding: '10px 8px',
                fontSize: '9px',
                border: language === 'fr' ? '2px solid #fff' : undefined,
                boxShadow: language === 'fr' ? '0 0 10px rgba(244, 166, 35, 0.6)' : undefined,
              }}
            >
              🇫🇷 Français
            </button>
            <button
              className={`mc-button ${language === 'en' ? 'primary' : ''}`}
              onClick={() => setLanguage('en')}
              style={{
                flex: 1,
                padding: '10px 8px',
                fontSize: '9px',
                border: language === 'en' ? '2px solid #fff' : undefined,
                boxShadow: language === 'en' ? '0 0 10px rgba(244, 166, 35, 0.6)' : undefined,
              }}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        {/* Photo de profil */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '8px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            {t('settings_pfp')}
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="file"
              id="pfp-upload"
              accept="image/*"
              onChange={e => setPfpFile(e.target.files[0])}
              style={{ display: 'none' }}
            />
            <label htmlFor="pfp-upload" className="mc-button" style={{ flex: 1, textAlign: 'center', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pfpFile ? pfpFile.name : t('settings_browse')}>
              {pfpFile ? pfpFile.name : t('settings_browse')}
            </label>
            <button className="mc-button primary" onClick={handleUpdatePfp} disabled={loading || !pfpFile}>
              {t('settings_update')}
            </button>
          </div>
        </div>

        {/* Clé Licence */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '8px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            {t('settings_license')}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="license-input"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              placeholder={t('settings_license_placeholder')}
              style={{ flex: 1, padding: '8px', fontSize: '9px' }}
            />
            <button className="mc-button primary" onClick={handleUpdateKey} disabled={loading}>
              {t('settings_validate')}
            </button>
          </div>
        </div>

        {/* Intermission Settings */}
        <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
          <label style={{ fontSize: '10px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={gameState.intermissionEnabled || false}
              onChange={handleToggleIntermission}
              style={{ cursor: 'pointer' }}
            />
            {t('settings_intermission')}
          </label>
          <div style={{ fontSize: '8px', color: 'var(--text-secondary)', marginTop: '4px', marginLeft: '24px' }}>
            {t('settings_intermission_desc')}
          </div>
        </div>

        {msg && <div style={{ fontSize: '8px', margin: '10px 0', color: 'var(--text-honey)', textAlign: 'center' }}>{msg}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
          <button
            className="mc-button"
            onClick={() => {
              onClose()
              if (onOpenChangelog) onOpenChangelog()
            }}
          >
            {t('settings_changelog', { version: APP_VERSION })}
          </button>

          <button className="mc-button" onClick={() => setFeedbackOpen(true)} disabled={loading}>
            {t('settings_feedback')}
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {!isGoogleLinked && (
              <button className="mc-button" onClick={handleLinkGoogle} disabled={loading} style={{ flex: 1 }}>
                {t('settings_link_google')}
              </button>
            )}
            <button className="mc-button" onClick={handleResetPassword} disabled={loading} style={{ flex: 1 }}>
              {t('settings_reset_pwd')}
            </button>
          </div>

          <button className="mc-button" onClick={handleResetProgressClick} disabled={loading} style={{ background: '#c47a09' }}>
            {t('settings_reset_progress')}
          </button>
          <button className="mc-button danger" onClick={handleDeleteAccountClick} disabled={loading}>
            {t('settings_delete_account')}
          </button>
          <button className="mc-button" onClick={onClose} disabled={loading} style={{ marginTop: '10px' }}>
            {t('settings_close')}
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
function TopBar({ onOpenChangelog }) {
  const { user, userProfile, logout } = useAuth()
  const gameState = useGame()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [showSettings, setShowSettings] = useState(false)

  const isActive = (path) => location.pathname === path ? 'active' : ''

  const handleLogout = async (e) => {
    e.stopPropagation()
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
          synergyUpgrades: gameState.synergyUpgrades || {},
          totalClicks: gameState.totalClicks || 0,
          playTime: gameState.playTime || 0,
          achievements: gameState.achievements || [],
          royalJelly: gameState.royalJelly || 0,
          prestigeTalents: gameState.prestigeTalents || {},
          pendingGifts: gameState.pendingGifts || [],
          intermissionEnabled: gameState.intermissionEnabled || false,
          lastSaved: new Date().toISOString(),
        }
        await setDoc(doc(db, 'saves', user.uid), saveData)
      }
    } catch (err) {
      console.error('Error saving before logout:', err)
    }
    logout()
  }

  return (
    <>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onOpenChangelog={onOpenChangelog} />}
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
            <span>{t('nav_game')}</span>
          </button>
          <button
            className={`top-bar-btn ${isActive('/raid')}`}
            onClick={() => navigate('/raid')}
            id="nav-raid"
          >
            <span style={{ fontSize: '11px', transform: 'translateY(-1px)' }}>⚔️</span>
            <span>{t('nav_raid')}</span>
          </button>
          <button
            className={`top-bar-btn ${isActive('/leaderboard')}`}
            onClick={async () => {
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
                    synergyUpgrades: gameState.synergyUpgrades || {},
                    totalClicks: gameState.totalClicks || 0,
                    playTime: gameState.playTime || 0,
                    achievements: gameState.achievements || [],
                    royalJelly: gameState.royalJelly || 0,
                    prestigeTalents: gameState.prestigeTalents || {},
                    pendingGifts: gameState.pendingGifts || [],
                    intermissionEnabled: gameState.intermissionEnabled || false,
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
            <span>{t('nav_leaderboard')}</span>
          </button>
          <button
            className={`top-bar-btn ${isActive('/friends')}`}
            onClick={() => navigate('/friends')}
            id="nav-friends"
          >
            <span style={{ fontSize: '11px', transform: 'translateY(-1px)' }}>👥</span>
            <span>{t('nav_friends')}</span>
          </button>
          <button
            className={`top-bar-btn ${isActive('/stats')}`}
            onClick={() => navigate('/stats')}
            id="nav-stats"
          >
            <span style={{ fontSize: '11px', transform: 'translateY(-1px)' }}>📊</span>
            <span>{t('nav_stats')}</span>
          </button>
          {userProfile?.isAdmin && (
            <button
              className={`top-bar-btn ${isActive('/admin')}`}
              onClick={() => navigate('/admin')}
              id="nav-admin"
            >
              <span style={{ fontSize: '11px', transform: 'translateY(-1px)' }}>⚙️</span>
              <span>{t('nav_admin')}</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <MusicPlayer />
          <div
            className="top-bar-user"
            onClick={() => setShowSettings(true)}
            style={{ cursor: 'pointer' }}
            title="Paramètres"
          >
            {user?.photoURL && (
              <img src={user.photoURL} alt="" className="top-bar-avatar" />
            )}
            <span className="top-bar-username" style={{ textDecoration: 'underline dotted' }}>
              {userProfile?.displayName || user?.displayName || ''}
            </span>
            <button
              className="top-bar-btn btn-logout"
              onClick={handleLogout}
              id="btn-logout"
              style={{ fontSize: '7px', color: 'var(--cannot-afford)', marginLeft: '8px' }}
            >
              <span className="deco-text">{t('logout')}</span>
              <span className="deco-icon" style={{ display: 'none', fontSize: '10px' }}>🚪</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// --- Achievement Toast System ---
function AchievementToast() {
  const [toast, setToast] = useState(null)
  const { t } = useLanguage()

  React.useEffect(() => {
    const handleUnlock = (e) => {
      setToast(e.detail)
      setTimeout(() => setToast(null), 5000)
    }
    window.addEventListener('achievement_unlocked', handleUnlock)
    return () => window.removeEventListener('achievement_unlocked', handleUnlock)
  }, [])

  if (!toast) return null

  return (
    <div className="achievement-toast">
      <div className="achievement-icon">{toast.icon}</div>
      <div className="achievement-text">
        <h4>{t('achievement_unlocked')}</h4>
        <p>{toast.name}</p>
      </div>
    </div>
  )
}

// --- System Toast System ---
function SystemToast() {
  const [toast, setToast] = useState(null)
  const { t } = useLanguage()

  React.useEffect(() => {
    const handleToast = (e) => {
      setToast(e.detail)
      setTimeout(() => setToast(null), 5000)
    }
    window.addEventListener('system_toast', handleToast)
    return () => window.removeEventListener('system_toast', handleToast)
  }, [])

  if (!toast) return null

  const isError = toast.type === 'error'

  return (
    <div className="achievement-toast" style={{
      borderColor: isError ? 'var(--cannot-afford)' : 'var(--can-afford)',
      boxShadow: isError ? '0 0 20px rgba(255, 85, 85, 0.5)' : '0 0 20px rgba(85, 255, 85, 0.5)'
    }}>
      <div className="achievement-icon">{isError ? '❌' : '✅'}</div>
      <div className="achievement-text">
        <h4 style={{ color: isError ? 'var(--cannot-afford)' : 'var(--can-afford)' }}>
          {toast.title || (isError ? t('error') : t('success'))}
        </h4>
        <p style={{ whiteSpace: 'pre-line', fontSize: '9px', lineHeight: '1.4' }}>{toast.message}</p>
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
  const [showChangelog, setShowChangelog] = useState(false)
  const { user } = useAuth()
  const { t } = useLanguage()

  // Automatic first-time update pop-up check on refresh/mount
  useEffect(() => {
    const lastSeen = localStorage.getItem('bzz_last_seen_version')
    if (lastSeen !== APP_VERSION) {
      setShowChangelog(true)
    }
  }, [])

  // Real-time listener for Raid invites from friends
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const invites = docSnap.data().raidInvites || []
          if (invites.length > 0) {
            const latest = invites[invites.length - 1]
            const age = Date.now() - new Date(latest.sentAt).getTime()
            if (age < 60000) {
              window.dispatchEvent(
                new CustomEvent('system_toast', {
                  detail: {
                    type: 'success',
                    title: '⚔️ ' + t('raid_title'),
                    message: `${latest.hostName} vous invite à son salon de Raid Coop !`,
                  },
                })
              )
            }
          }
        }
      },
      () => {}
    )
    return () => unsub()
  }, [user, t])

  const handleCloseChangelog = () => {
    localStorage.setItem('bzz_last_seen_version', APP_VERSION)
    setShowChangelog(false)
  }

  return (
    <GameProvider>
      <GameEngine />
      <AchievementToast />
      <SystemToast />
      <Intermission />
      <ChangelogModal isOpen={showChangelog} onClose={handleCloseChangelog} />
      <TopBar onOpenChangelog={() => setShowChangelog(true)} />
      <div style={{ paddingTop: '48px', height: '100vh', boxSizing: 'border-box', overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<GamePage />} />
          <Route path="/raid" element={<CoopRaid />} />
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

  if (userProfile.isBanned) {
    return <BanScreen />
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
