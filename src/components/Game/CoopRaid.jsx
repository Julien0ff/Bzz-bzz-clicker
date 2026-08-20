// ===================================================
// CoopRaid — Co-op Boss Raid with Lobby, Invitations, Cooldowns & Speed-Up
// ===================================================

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  increment,
  deleteDoc,
  collection,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { useGame, getBossDamageMultiplier } from '../../contexts/GameContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { formatNumber } from '../../data/upgrades'
import { createAntiCheatTracker } from '../../utils/antiCheat'
import hornetImg from '../../../assets/Bee_(Dungeons).png'


// Boss Configs with progressive scaling and cooldowns
export const BOSS_CONFIGS = [
  {
    id: 'hornet_colossus',
    name: "Frelon Colossal de l'Ombre",
    name_fr: "Frelon Colossal de l'Ombre",
    name_en: "Shadow Colossus Hornet",
    icon: '🐝',
    color: '#ff2a2a',
    maxHp: 15000000000, // 15 Billion
    rewardJelly: 5,
    rewardHoney: 500000000, // 500 Million
    cooldownMs: 30 * 60 * 1000, // 30 minutes
    cooldownLabel: '30 minutes',
  },
  {
    id: 'bear_honey_thief',
    name: "L'Ours Titan Voleur de Miel",
    name_fr: "L'Ours Titan Voleur de Miel",
    name_en: "Honey Thief Titan Bear",
    icon: '🐻',
    color: '#ff8800',
    maxHp: 75000000000, // 75 Billion
    rewardJelly: 12,
    rewardHoney: 2500000000, // 2.5 Billion
    cooldownMs: 60 * 60 * 1000, // 1 hour
    cooldownLabel: '1 hour',
  },
  {
    id: 'void_queen',
    name: "La Reine Corrompue du Néant",
    name_fr: "La Reine Corrompue du Néant",
    name_en: "Corrupted Void Queen",
    icon: '👑',
    color: '#a82aff',
    maxHp: 300000000000, // 300 Billion
    rewardJelly: 30,
    rewardHoney: 15000000000, // 15 Billion
    cooldownMs: 90 * 60 * 1000, // 1h 30
    cooldownLabel: '1h 30',
  },
  {
    id: 'nebula_dragon',
    name: "Dragon de Nébuleuse Cosmique",
    name_fr: "Dragon de Nébuleuse Cosmique",
    name_en: "Cosmic Nebula Dragon",
    icon: '🐉',
    color: '#00e5ff',
    maxHp: 1500000000000, // 1.5 Trillion
    rewardJelly: 75,
    rewardHoney: 100000000000, // 100 Billion
    cooldownMs: 120 * 60 * 1000, // 2 hours
    cooldownLabel: '2 hours',
  },
  {
    id: 'solar_titan_wasp',
    name: "Guêpe Solaire Primordiale",
    name_fr: "Guêpe Solaire Primordiale",
    name_en: "Primordial Solar Wasp",
    icon: '☀️',
    color: '#ffb300',
    maxHp: 8000000000000, // 8 Trillion
    rewardJelly: 180,
    rewardHoney: 500000000000, // 500 Billion
    cooldownMs: 150 * 60 * 1000, // 2h 30
    cooldownLabel: '2h 30',
  },
  {
    id: 'chrono_destroyer',
    name: "L'Annihilateur Temporel",
    name_fr: "L'Annihilateur Temporel",
    name_en: "Chrono Destroyer",
    icon: '⏳',
    color: '#b388ff',
    maxHp: 40000000000000, // 40 Trillion
    rewardJelly: 450,
    rewardHoney: 2500000000000, // 2.5 Trillion
    cooldownMs: 180 * 60 * 1000, // 3 hours
    cooldownLabel: '3 hours',
  },
  {
    id: 'celestial_hive_god',
    name: "Le Dieu-Ruche Déchu de l'Abysse",
    name_fr: "Le Dieu-Ruche Déchu de l'Abysse",
    name_en: "Fallen Hive God of the Abyss",
    icon: '☠️',
    color: '#ff1744',
    maxHp: 250000000000000, // 250 Trillion
    rewardJelly: 1200,
    rewardHoney: 15000000000000, // 15 Trillion
    cooldownMs: 240 * 60 * 1000, // 4 hours
    cooldownLabel: '4 hours',
  },
]

export default function CoopRaid() {
  const { user, userProfile, banUser } = useAuth()
  const gameState = useGame()
  const { t, getLocalized } = useLanguage()

  // Anti-Cheat Tracker for Raid Boss
  const antiCheatRef = useRef(null)
  if (!antiCheatRef.current) {
    antiCheatRef.current = createAntiCheatTracker({
      onCheatDetected: (reason) => {
        console.error('[Anti-Cheat Raid Triggered]', reason)
        if (banUser) banUser(reason)
      },
      maxAllowedCPS: 20,
    })
  }

  // Remember active room across navigation
  const [activeRoomId, setActiveRoomId] = useState(() => {
    return localStorage.getItem('bzz_active_raid_room') || null
  })

  const [roomData, setRoomData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [availableRooms, setAvailableRooms] = useState([])
  const [friendsList, setFriendsList] = useState([])
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [invitedFriends, setInvitedFriends] = useState({})

  // Combat VFX & states
  const [localDamagePending, setLocalDamagePending] = useState(0)
  const [damageParticles, setDamageParticles] = useState([])
  const [showSlash, setShowSlash] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  const bossImgRef = useRef(null)
  const damageAccumulatorRef = useRef(0)
  const flushTimerRef = useRef(null)

  // Load friends for invitation
  useEffect(() => {
    if (!user) return
    const loadFriends = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'users', user.uid))
        const friendIds = profileDoc.data()?.friends || []
        const list = []
        for (const fid of friendIds) {
          const fDoc = await getDoc(doc(db, 'users', fid))
          if (fDoc.exists()) {
            list.push({ uid: fid, ...fDoc.data() })
          }
        }
        setFriendsList(list)
      } catch (err) {
        console.warn('Error loading friends list for raid:', err)
      }
    }
    loadFriends()
  }, [user])

  // Listen for available open rooms (Lobby browser)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'raids'), (snapshot) => {
      const rooms = []
      snapshot.forEach((docSnap) => {
        rooms.push({ id: docSnap.id, ...docSnap.data() })
      })
      setAvailableRooms(rooms)
    })
    return () => unsub()
  }, [])

  // Listen to the active room
  useEffect(() => {
    if (!activeRoomId) {
      setRoomData(null)
      localStorage.removeItem('bzz_active_raid_room')
      return
    }

    localStorage.setItem('bzz_active_raid_room', activeRoomId)
    const unsub = onSnapshot(doc(db, 'raids', activeRoomId), (docSnap) => {
      if (docSnap.exists()) {
        setRoomData(docSnap.data())
      } else {
        // Room was disbanded or deleted
        setRoomData(null)
        setActiveRoomId(null)
        localStorage.removeItem('bzz_active_raid_room')
      }
    })

    return () => unsub()
  }, [activeRoomId])

  // Listen for raid invites sent to me in Firestore
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      const pendingRaidInvite = docSnap.data()?.pendingRaidInvite
      if (pendingRaidInvite && pendingRaidInvite.roomId !== activeRoomId) {
        window.dispatchEvent(
          new CustomEvent('system_toast', {
            detail: {
              type: 'info',
              title: '⚔️ Invitation de Raid !',
              message: `${pendingRaidInvite.fromName} vous invite à rejoindre son salon de raid contre ${pendingRaidInvite.bossName} !`,
              actionText: 'Rejoindre',
              onAction: () => {
                setActiveRoomId(pendingRaidInvite.roomId)
                updateDoc(doc(db, 'users', user.uid), { pendingRaidInvite: null }).catch(() => {})
              },
            },
          })
        )
      }
    })
    return () => unsub()
  }, [user, activeRoomId])

  // Update cooldown countdown timer
  useEffect(() => {
    if (!roomData?.cooldownUntil) {
      setTimeRemaining(0)
      return
    }

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(roomData.cooldownUntil).getTime() - Date.now()) / 1000))
      setTimeRemaining(diff)

      if (diff <= 0 && roomData.hostUid === user?.uid) {
        handleResetForNextBoss()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [roomData, user])

  // Flush accumulated combat damage
  const flushDamage = useCallback(async () => {
    const dmg = damageAccumulatorRef.current
    if (dmg <= 0 || !activeRoomId || !user || !roomData || roomData.status !== 'fighting' || roomData.bossHp <= 0) return

    damageAccumulatorRef.current = 0
    setLocalDamagePending(0)

    try {
      const roomRef = doc(db, 'raids', activeRoomId)
      const snap = await getDoc(roomRef)
      if (!snap.exists()) return

      const current = snap.data()
      if (current.status !== 'fighting' || current.bossHp <= 0) return

      const newHp = Math.max(0, current.bossHp - dmg)
      const userKey = `players.${user.uid}`

      let nextStatus = current.status
      let cooldownTimestamp = null

      if (newHp <= 0) {
        nextStatus = 'cooldown'
        const currentConfig = BOSS_CONFIGS[current.bossIndex || 0] || BOSS_CONFIGS[0]
        cooldownTimestamp = new Date(Date.now() + currentConfig.cooldownMs).toISOString()
      }

      const payload = {
        bossHp: newHp,
        status: nextStatus,
        ...(cooldownTimestamp ? { cooldownUntil: cooldownTimestamp } : {}),
        [`${userKey}.damage`]: increment(dmg),
      }

      await updateDoc(roomRef, payload)
    } catch (err) {
      console.warn('Damage sync notice:', err.message)
    }
  }, [activeRoomId, user, roomData])

  useEffect(() => {
    flushTimerRef.current = setInterval(flushDamage, 1200)
    return () => {
      clearInterval(flushTimerRef.current)
      flushDamage()
    }
  }, [flushDamage])

  // --- Host: Create a Room ---
  const handleCreateRoom = async () => {
    if (!user) return
    setLoading(true)

    const roomId = `room_${user.uid}`
    const initialConfig = BOSS_CONFIGS[0]

    const newRoom = {
      hostUid: user.uid,
      hostName: userProfile?.displayName || 'Chef de Raid',
      bossIndex: 0,
      bossName: initialConfig.name,
      bossHp: initialConfig.maxHp,
      maxHp: initialConfig.maxHp,
      rewardJelly: initialConfig.rewardJelly,
      rewardHoney: initialConfig.rewardHoney,
      status: 'lobby',
      speedUpCount: 0,
      claimedBy: {},
      cooldownUntil: null,
      players: {
        [user.uid]: {
          displayName: userProfile?.displayName || 'Apiculteur',
          photoURL: user.photoURL || null,
          damage: 0,
          isReady: true, // host starts ready
          isHost: true,
          hps: gameState.honeyPerSecond || 0,
          clickPower: gameState.clickPower || 1,
        },
      },
      createdAt: new Date().toISOString(),
    }

    try {
      await setDoc(doc(db, 'raids', roomId), newRoom)
      setActiveRoomId(roomId)
    } catch (err) {
      console.error('Error creating room:', err)
      alert(t('error') + ': ' + err.message)
    }
    setLoading(false)
  }

  // --- Join an Existing Room ---
  const handleJoinRoom = async (targetRoom) => {
    if (!user) return
    setLoading(true)

    try {
      const roomRef = doc(db, 'raids', targetRoom.id)
      const userKey = `players.${user.uid}`

      await updateDoc(roomRef, {
        [userKey]: {
          displayName: userProfile?.displayName || 'Apiculteur',
          photoURL: user.photoURL || null,
          damage: 0,
          isReady: false,
          isHost: targetRoom.hostUid === user.uid,
          hps: gameState.honeyPerSecond || 0,
          clickPower: gameState.clickPower || 1,
        },
      })

      setActiveRoomId(targetRoom.id)
    } catch (err) {
      console.error('Error joining room:', err)
      alert(t('error') + ': ' + err.message)
    }
    setLoading(false)
  }

  // --- Leave Active Room ---
  const handleLeaveRoom = async () => {
    if (!activeRoomId || !user) return
    setLoading(true)

    try {
      const roomRef = doc(db, 'raids', activeRoomId)
      const snap = await getDoc(roomRef)

      if (snap.exists()) {
        const data = snap.data()
        const remainingPlayers = { ...(data.players || {}) }
        delete remainingPlayers[user.uid]

        if (Object.keys(remainingPlayers).length === 0 || data.hostUid === user.uid) {
          await deleteDoc(roomRef).catch(() => {})
        } else {
          await updateDoc(roomRef, {
            players: remainingPlayers,
          })
        }
      }
    } catch (err) {
      console.error('Error leaving room:', err)
    }

    setActiveRoomId(null)
    setRoomData(null)
    localStorage.removeItem('bzz_active_raid_room')
    setLoading(false)
  }

  // --- Toggle Ready Status ---
  const handleToggleReady = async () => {
    if (!activeRoomId || !user || !roomData) return
    const currentReady = roomData.players?.[user.uid]?.isReady || false

    try {
      await updateDoc(doc(db, 'raids', activeRoomId), {
        [`players.${user.uid}.isReady`]: !currentReady,
      })
    } catch (err) {
      console.error('Error toggling ready:', err)
    }
  }

  // --- Invite Friend to Current Room ---
  const handleInviteFriend = async (friend) => {
    if (!activeRoomId || !roomData || !user) return
    try {
      const currentConfig = BOSS_CONFIGS[roomData.bossIndex || 0] || BOSS_CONFIGS[0]
      await updateDoc(doc(db, 'users', friend.uid), {
        pendingRaidInvite: {
          roomId: activeRoomId,
          fromName: userProfile?.displayName || 'Un ami',
          bossName: getLocalized(currentConfig, 'name'),
          sentAt: new Date().toISOString(),
        },
      })
      setInvitedFriends((prev) => ({ ...prev, [friend.uid]: true }))
    } catch (err) {
      console.error('Error inviting friend:', err)
    }
  }

  // --- Host: Launch Fight ---
  const handleLaunchFight = async () => {
    if (!activeRoomId || roomData?.hostUid !== user?.uid) return
    const playersList = Object.values(roomData.players || {})

    if (playersList.length < 2) {
      alert(t('raid_need_players'))
      return
    }

    const allReady = playersList.every((p) => p.isReady)
    if (!allReady) {
      alert("Tous les joueurs doivent être prêts avant de lancer !")
      return
    }

    try {
      await updateDoc(doc(db, 'raids', activeRoomId), {
        status: 'fighting',
      })
    } catch (err) {
      console.error('Error launching fight:', err)
    }
  }

  // --- Attack Boss ---
  const handleAttack = (e) => {
    if (!roomData || roomData.status !== 'fighting' || roomData.bossHp <= 0 || effectiveHp <= 0) return

    // Anti-Cheat validation
    const clientX = e?.clientX || null
    const clientY = e?.clientY || null
    const isValid = antiCheatRef.current?.validateClick(e, clientX, clientY)
    if (!isValid) return

    const bossMulti = getBossDamageMultiplier(gameState.prestigeTalents)
    const damage = Math.max(
      100,
      Math.floor((gameState.clickPower * 2 + gameState.honeyPerSecond * 0.25) * bossMulti)
    )


    damageAccumulatorRef.current += damage
    setLocalDamagePending((prev) => prev + damage)

    // Boss shake animation & Slash effect
    setShowSlash(true)
    setTimeout(() => setShowSlash(false), 250)

    if (bossImgRef.current) {
      bossImgRef.current.style.transform = `scale(0.88) rotate(${Math.random() * 14 - 7}deg)`
      bossImgRef.current.style.filter = 'brightness(2) drop-shadow(0 0 35px #ff2a2a)'
      setTimeout(() => {
        if (bossImgRef.current) {
          bossImgRef.current.style.transform = 'scale(1) rotate(0deg)'
          bossImgRef.current.style.filter = `drop-shadow(0 0 25px ${currentConfig.color})`
        }
      }, 90)
    }

    // Spawn damage particle
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX || rect.left + rect.width / 2
    const y = e.clientY || rect.top + rect.height / 2

    const particleId = Date.now() + Math.random()
    setDamageParticles((prev) => [
      ...prev,
      { id: particleId, x, y, text: `-${formatNumber(damage)}` },
    ])

    setTimeout(() => {
      setDamageParticles((prev) => prev.filter((p) => p.id !== particleId))
    }, 800)
  }

  // --- Claim Reward ---
  const hasClaimed = roomData?.claimedBy?.[user?.uid] || false
  const myDamage = roomData?.players?.[user?.uid]?.damage || 0

  const handleClaimReward = async () => {
    if (hasClaimed || !roomData || myDamage <= 0) {
      if (myDamage <= 0) {
        alert("Vous devez avoir participé et infligé des dégâts pour récolter le butin !")
      }
      return
    }

    const jellyReward = roomData.rewardJelly || 5
    const honeyReward = roomData.rewardHoney || 500000000

    gameState.dispatch({
      type: 'LOAD_SAVE',
      savedState: {
        ...gameState,
        royalJelly: (gameState.royalJelly || 0) + jellyReward,
        honey: (gameState.honey || 0) + honeyReward,
        totalHoney: (gameState.totalHoney || 0) + honeyReward,
        blessingTimeLeft: (gameState.blessingTimeLeft || 0) + 90,
      },
    })

    try {
      await updateDoc(doc(db, 'raids', activeRoomId), {
        [`claimedBy.${user.uid}`]: true,
      })
    } catch (e) {}

    window.dispatchEvent(
      new CustomEvent('system_toast', {
        detail: {
          type: 'success',
          title: '🏆 ' + t('raid_victory'),
          message: `+${jellyReward} 👑 & +${formatNumber(honeyReward)} 🍯 !`,
        },
      })
    )
  }

  // --- Speed Up Cooldown with Honey (-1 min) ---
  const speedUpCount = roomData?.speedUpCount || 0
  const speedUpCost = Math.min(50000000, Math.floor(500 * Math.pow(1.85, speedUpCount)))

  const handleSpeedUpCooldown = async () => {
    if (!activeRoomId || !roomData || roomData.status !== 'cooldown' || !roomData.cooldownUntil) return
    if (gameState.honey < speedUpCost) {
      alert(`Vous n'avez pas assez de miel ! Requis : ${formatNumber(speedUpCost)} 🍯`)
      return
    }

    gameState.dispatch({
      type: 'LOAD_SAVE',
      savedState: {
        ...gameState,
        honey: Math.max(0, gameState.honey - speedUpCost),
      },
    })

    const currentCooldown = new Date(roomData.cooldownUntil).getTime()
    const newCooldownTime = Math.max(Date.now() + 1000, currentCooldown - 60000)

    try {
      await updateDoc(doc(db, 'raids', activeRoomId), {
        cooldownUntil: new Date(newCooldownTime).toISOString(),
        speedUpCount: increment(1),
      })

      window.dispatchEvent(
        new CustomEvent('system_toast', {
          detail: {
            type: 'success',
            title: '⏩ Temps Réduit !',
            message: `-60s !`,
          },
        })
      )
    } catch (err) {
      console.error('Error speeding up cooldown:', err)
    }
  }

  // --- Reset for Next Boss after Cooldown ---
  const handleResetForNextBoss = async () => {
    if (!activeRoomId || roomData?.hostUid !== user?.uid) return

    const nextIndex = ((roomData.bossIndex || 0) + 1) % BOSS_CONFIGS.length
    const nextConfig = BOSS_CONFIGS[nextIndex]

    const resetPlayers = {}
    Object.entries(roomData.players || {}).forEach(([uid, p]) => {
      resetPlayers[uid] = {
        ...p,
        damage: 0,
        isReady: uid === user.uid,
      }
    })

    const payload = {
      bossIndex: nextIndex,
      bossName: nextConfig.name,
      bossHp: nextConfig.maxHp,
      maxHp: nextConfig.maxHp,
      rewardJelly: nextConfig.rewardJelly,
      rewardHoney: nextConfig.rewardHoney,
      status: 'lobby',
      speedUpCount: 0,
      claimedBy: {},
      cooldownUntil: null,
      players: resetPlayers,
    }

    await updateDoc(doc(db, 'raids', activeRoomId), payload).catch(() => {})
  }

  const formatCountdown = (totalSec) => {
    if (totalSec <= 0) return '00:00'
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (h > 0) {
      return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const currentConfig = BOSS_CONFIGS[roomData?.bossIndex || 0] || BOSS_CONFIGS[0]
  const effectiveHp = Math.max(0, (roomData?.bossHp || 0) - localDamagePending)
  const hpPercent = roomData?.maxHp ? Math.max(0, Math.min(100, (effectiveHp / roomData.maxHp) * 100)) : 100

  const playersList = Object.entries(roomData?.players || {}).map(([uid, p]) => ({ uid, ...p }))
  const readyCount = playersList.filter((p) => p.isReady).length
  const canStartFight = playersList.length >= 2 && readyCount === playersList.length

  const localizedBossName = getLocalized(currentConfig, 'name')

  // =========================================================================
  // VIEW 1: NO ROOM SELECTED (Lobby Browser & Creation)
  // =========================================================================
  if (!activeRoomId || !roomData) {
    return (
      <div className="leaderboard-container" style={{ maxWidth: '680px' }}>
        <div className="mc-panel" style={{ marginBottom: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '9px', color: 'var(--cannot-afford)', letterSpacing: '2px', marginBottom: '4px' }}>
              ⚔️ {t('raid_title')} ⚔️
            </div>
            <h2 style={{ fontSize: '15px', color: 'var(--text-honey)' }}>
              {t('raid_title')}
            </h2>
            <p className="friend-honey" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              {t('raid_subtitle')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <button
              className="mc-button primary"
              onClick={handleCreateRoom}
              disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: '10px', animation: 'buttonPulse 2s infinite' }}
            >
              👑 {t('raid_create_room')}
            </button>
          </div>

          <h3 style={{ fontSize: '10px', color: 'var(--text-honey)', marginBottom: '12px' }}>
            {t('raid_available_rooms', { count: availableRooms.length })}
          </h3>

          {availableRooms.length === 0 && (
            <div className="loading-text" style={{ textAlign: 'center', padding: '16px' }}>
              {t('raid_no_rooms')}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {availableRooms.map((room) => {
              const count = Object.keys(room.players || {}).length
              const isFullOrFighting = room.status === 'fighting'
              const isCoolingDown = room.status === 'cooldown'

              return (
                <div key={room.id} className="lobby-player-card" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Salon : <strong>{room.hostName}</strong>
                    </div>
                    <div className="friend-honey" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      {t('raid_target_boss')} {room.bossName} · {count} {t('raid_players')}
                    </div>
                  </div>

                  <div>
                    {isCoolingDown ? (
                      <button
                        className="mc-button"
                        style={{ padding: '8px 14px', fontSize: '9px' }}
                        onClick={() => handleJoinRoom(room)}
                      >
                        Timer ({count}/4)
                      </button>
                    ) : isFullOrFighting ? (
                      <button
                        className="mc-button danger"
                        style={{ padding: '8px 14px', fontSize: '9px' }}
                        onClick={() => handleJoinRoom(room)}
                      >
                        Combat ({count}/4)
                      </button>
                    ) : (
                      <button
                        className="mc-button primary"
                        style={{ padding: '8px 14px', fontSize: '9px' }}
                        onClick={() => handleJoinRoom(room)}
                      >
                        {t('raid_join_room')} ({count}/4)
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // VIEW 2: LOBBY ROOM (Waiting for min 2 players & ready check)
  // =========================================================================
  if (roomData.status === 'lobby') {
    const isHost = roomData.hostUid === user?.uid
    const myReady = roomData.players?.[user?.uid]?.isReady || false

    return (
      <div className="leaderboard-container" style={{ maxWidth: '680px' }}>
        <div className="mc-panel" style={{ marginBottom: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '8px', color: 'var(--can-afford)', letterSpacing: '2px', marginBottom: '4px' }}>
              🟢 {t('raid_room_lobby')}
            </div>
            <h2 style={{ fontSize: '14px', color: 'var(--text-honey)' }}>
              Salon de {roomData.hostName}
            </h2>
            <div className="friend-honey" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {t('raid_target_boss')} <strong style={{ color: currentConfig.color }}>{localizedBossName}</strong> ({formatNumber(currentConfig.maxHp)} PV)
            </div>
          </div>

          <div
            style={{
              padding: '8px 12px',
              background: playersList.length >= 2 ? 'rgba(93,186,59,0.15)' : 'rgba(255,85,85,0.15)',
              border: `1px solid ${playersList.length >= 2 ? 'var(--can-afford)' : 'var(--cannot-afford)'}`,
              borderRadius: '3px',
              textAlign: 'center',
              fontSize: '10px',
              color: playersList.length >= 2 ? 'var(--can-afford)' : 'var(--cannot-afford)',
              marginBottom: '16px',
            }}
            className="friend-honey"
          >
            {playersList.length >= 2
              ? `✅ ${playersList.length} joueurs dans le salon ! (${readyCount}/${playersList.length} prêts)`
              : `⚠️ ${t('raid_need_players')} (${playersList.length}/2)`}
          </div>

          <h3 style={{ fontSize: '10px', color: 'var(--text-honey)', marginBottom: '8px' }}>
            👥 Joueurs ({playersList.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
            {playersList.map((p) => (
              <div key={p.uid} className="lobby-player-card">
                {p.photoURL && <img src={p.photoURL} alt="" className="friend-avatar" />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-primary)', marginBottom: '3px' }}>
                    {p.displayName} {p.isHost && <span style={{ color: 'var(--text-honey)' }}>(Host)</span>}{' '}
                    {p.uid === user?.uid && <span style={{ color: 'var(--honey-light)' }}>(You)</span>}
                  </div>
                  <div className="friend-honey" style={{ fontSize: '9px', color: 'var(--text-dim)' }}>
                    +{formatNumber(p.hps)}/s · {formatNumber(p.clickPower)} dmg/clic
                  </div>
                </div>

                <span className={`ready-badge ${p.isReady ? 'is-ready' : 'not-ready'}`}>
                  {p.isReady ? `🟢 ${t('raid_ready')}` : `🔴 ${t('raid_not_ready')}`}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`mc-button ${myReady ? '' : 'primary'}`}
                onClick={handleToggleReady}
                style={{ flex: 1, padding: '12px' }}
              >
                {myReady ? t('raid_mark_unready') : t('raid_mark_ready')}
              </button>

              <button
                className="mc-button"
                onClick={() => setInviteModalOpen(true)}
                style={{ flex: 1, padding: '12px' }}
              >
                {t('raid_invite_friends')}
              </button>
            </div>

            {isHost && (
              <button
                className="mc-button primary"
                onClick={handleLaunchFight}
                disabled={!canStartFight}
                style={{
                  padding: '16px',
                  fontSize: '11px',
                  opacity: canStartFight ? 1 : 0.45,
                  animation: canStartFight ? 'buttonPulse 1.5s infinite' : 'none',
                }}
              >
                {t('raid_start_combat')} {canStartFight ? '!' : `(${t('raid_need_players')})`}
              </button>
            )}

            <button
              className="mc-button danger"
              onClick={handleLeaveRoom}
              style={{ padding: '10px', fontSize: '9px', marginTop: '6px' }}
            >
              🚪 {t('raid_leave_room')}
            </button>
          </div>
        </div>

        {/* Invite Friends Modal */}
        {inviteModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setInviteModalOpen(false)}
          >
            <div
              className="mc-panel"
              style={{ width: '480px', maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '13px', marginBottom: '14px' }}>📩 {t('raid_invite_friends')}</h2>

              {friendsList.length === 0 && (
                <div className="loading-text" style={{ textAlign: 'center', padding: '12px' }}>
                  Aucun ami dans votre liste.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {friendsList.map((friend) => (
                  <div key={friend.uid} className="lobby-player-card" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {friend.photoURL && <img src={friend.photoURL} alt="" className="friend-avatar" />}
                      <span style={{ fontSize: '10px' }}>{friend.displayName}</span>
                    </div>

                    <button
                      className={`mc-button ${invitedFriends[friend.uid] ? '' : 'primary'}`}
                      style={{ padding: '6px 12px', fontSize: '8px' }}
                      onClick={() => handleInviteFriend(friend)}
                      disabled={invitedFriends[friend.uid]}
                    >
                      {invitedFriends[friend.uid] ? '✅ Invité' : 'Envoyer Invite'}
                    </button>
                  </div>
                ))}
              </div>

              <button className="mc-button" onClick={() => setInviteModalOpen(false)} style={{ width: '100%' }}>
                {t('settings_close')}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // =========================================================================
  // VIEW 3: COOLDOWN & VICTORY COUNTDOWN (Between Boss Fights)
  // =========================================================================
  if (roomData.status === 'cooldown' || roomData.status === 'defeated' || effectiveHp <= 0) {
    if (!roomData.cooldownUntil && roomData.hostUid === user?.uid) {
      const cooldownUntil = new Date(Date.now() + currentConfig.cooldownMs).toISOString()
      updateDoc(doc(db, 'raids', activeRoomId), {
        status: 'cooldown',
        cooldownUntil,
      }).catch(() => {})
    }

    return (
      <div className="leaderboard-container" style={{ maxWidth: '700px' }}>
        <div className="mc-panel" style={{ textAlign: 'center', padding: '24px 18px' }}>
          {/* Victory Header */}
          <div
            style={{
              fontSize: '15px',
              color: 'var(--honey-light)',
              marginBottom: '10px',
              animation: 'comboFlash 1.2s infinite',
              textShadow: '2px 2px 0 #000',
            }}
          >
            {t('raid_victory')}
          </div>
          <p className="friend-honey" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Le <strong>{localizedBossName}</strong> a succombé sous vos coups coordonnés !
          </p>

          {/* Reward claim section */}
          <div
            style={{
              background: hasClaimed ? 'rgba(93,186,59,0.1)' : 'rgba(255,215,0,0.15)',
              border: `2px solid ${hasClaimed ? 'var(--can-afford)' : 'var(--honey-light)'}`,
              padding: '14px',
              borderRadius: '4px',
              marginBottom: '20px',
            }}
          >
            {!hasClaimed ? (
              <div>
                <div style={{ fontSize: '10px', color: 'var(--honey-light)', marginBottom: '8px' }}>
                  🎁 Votre butin vous attend !
                </div>
                <button
                  className="mc-button primary"
                  onClick={handleClaimReward}
                  style={{ padding: '12px 24px', fontSize: '11px', animation: 'buttonPulse 1.5s infinite' }}
                >
                  👑 Récolter Mon Butin (+{roomData.rewardJelly} 👑 & +{formatNumber(roomData.rewardHoney)} 🍯)
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: 'var(--can-afford)', fontWeight: 'bold' }}>
                ✅ Récompense réclamée (+{roomData.rewardJelly} 👑 & +{formatNumber(roomData.rewardHoney)} 🍯) !
              </div>
            )}
          </div>

          {/* Countdown timer */}
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>⏳</div>
          <div style={{ fontSize: '8px', color: 'var(--text-honey)', letterSpacing: '2px', marginBottom: '6px' }}>
            {t('raid_cooldown_title')}
          </div>
          <h3 style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '10px' }}>
            {t('raid_cooldown_desc')}
          </h3>

          <div
            style={{
              fontSize: '26px',
              fontFamily: 'Press Start 2P',
              color: 'var(--honey-light)',
              margin: '16px 0',
              textShadow: '2px 2px 0 #000, 0 0 20px rgba(255,215,0,0.6)',
            }}
          >
            {formatCountdown(timeRemaining)}
          </div>

          {/* Next boss ready or Speed up button */}
          {timeRemaining <= 0 ? (
            <div style={{ margin: '16px 0' }}>
              <button
                className="mc-button primary"
                onClick={handleResetForNextBoss}
                style={{ padding: '14px 28px', fontSize: '11px', animation: 'buttonPulse 1.5s infinite' }}
              >
                {t('raid_summon_next', { level: ((roomData.bossIndex || 0) % BOSS_CONFIGS.length) + 2 })}
              </button>
            </div>
          ) : (
            <div
              style={{
                margin: '16px 0',
                padding: '14px',
                background: 'var(--bg-panel-inner)',
                border: '2px solid var(--mc-border-dark)',
                borderRadius: '4px',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                {t('raid_speed_up')}
              </div>
              <button
                className="mc-button primary"
                onClick={handleSpeedUpCooldown}
                disabled={gameState.honey < speedUpCost}
                style={{ padding: '12px 20px', fontSize: '9px' }}
              >
                {t('raid_speed_up_honey', { amount: formatNumber(speedUpCost) })}
              </button>
              <div className="friend-honey" style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '6px' }}>
                Coût actuel : {formatNumber(speedUpCost)} miel.
              </div>
            </div>
          )}

          {/* Team damage report */}
          <h4 style={{ fontSize: '10px', color: 'var(--text-honey)', marginTop: '20px', marginBottom: '10px' }}>
            {t('raid_total_dmg')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
            {playersList
              .sort((a, b) => (b.damage || 0) - (a.damage || 0))
              .map((p, index) => (
                <div
                  key={p.uid}
                  className="leaderboard-entry"
                  style={{
                    borderColor: p.uid === user?.uid ? 'var(--honey-dark)' : 'var(--mc-border-dark)',
                    background: p.uid === user?.uid ? 'rgba(244,166,35,0.1)' : undefined,
                  }}
                >
                  <div className="leaderboard-rank" style={{ fontSize: '10px' }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  {p.photoURL && <img src={p.photoURL} alt="" className="friend-avatar" />}
                  <div className="leaderboard-name" style={{ fontSize: '9px' }}>
                    {p.displayName} {p.uid === user?.uid && <span style={{ color: 'var(--text-honey)' }}>(Vous)</span>}
                  </div>
                  <div className="leaderboard-score" style={{ color: 'var(--cannot-afford)', fontSize: '9px' }}>
                    💥 {formatNumber(p.damage || 0)}
                  </div>
                </div>
              ))}
          </div>

          <button className="mc-button danger" onClick={handleLeaveRoom} style={{ padding: '10px 20px', fontSize: '9px' }}>
            🚪 {t('raid_leave_room')}
          </button>
        </div>
      </div>
    )
  }

  // =========================================================================
  // VIEW 4: COMBAT ARENA (Fighting)
  // =========================================================================
  return (
    <div className="leaderboard-container" style={{ maxWidth: '750px' }}>
      {/* Floating damage particles */}
      {damageParticles.map((p) => (
        <div key={p.id} className="raid-damage-particle" style={{ position: 'fixed', left: p.x, top: p.y }}>
          {p.text}
        </div>
      ))}

      <div className="mc-panel" style={{ marginBottom: '16px', position: 'relative' }}>
        {/* Top Fight Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '9px', color: 'var(--cannot-afford)', letterSpacing: '1px' }}>
            ⚔️ {t('raid_boss_arena')} ({t('raid_boss_level', { current: (roomData.bossIndex || 0) + 1, total: BOSS_CONFIGS.length })})
          </div>
          <button
            className="mc-button danger"
            onClick={handleLeaveRoom}
            style={{ padding: '4px 8px', fontSize: '7px' }}
            title={t('raid_leave_room')}
          >
            {t('settings_close')}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', color: currentConfig.color, textShadow: '2px 2px 0 #000' }}>
            {localizedBossName}
          </h2>
          <div className="friend-honey" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {t('raid_attack_hint')}
          </div>
        </div>

        {/* Boss Arena Display */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            background: 'radial-gradient(circle, rgba(255,0,0,0.18) 0%, rgba(0,0,0,0.6) 70%)',
            border: '3px solid var(--mc-border-dark)',
            borderRadius: '4px',
            marginBottom: '20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Slash Attack Overlay Effect */}
          {showSlash && (
            <div className="boss-slashing">
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                <path
                  d="M10,20 Q50,60 90,80 Q50,40 10,20"
                  fill="rgba(255,255,255,0.9)"
                  filter="drop-shadow(0 0 10px #ff0040)"
                />
              </svg>
            </div>
          )}

          {/* Health Bar */}
          <div style={{ width: '100%', maxWidth: '440px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-honey)' }}>{t('raid_boss_hp')}</span>
              <span style={{ color: hpPercent < 25 ? 'var(--cannot-afford)' : 'var(--can-afford)' }}>
                {formatNumber(effectiveHp)} / {formatNumber(roomData.maxHp)} ({hpPercent.toFixed(1)}%)
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '20px',
                background: '#151515',
                border: '3px solid var(--mc-border-dark)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${hpPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #ff0040, #ff8800)',
                  transition: 'width 0.15s ease-out',
                  boxShadow: '0 0 14px rgba(255, 68, 68, 0.7)',
                }}
              />
            </div>
          </div>

          {/* Animated Boss Sprite */}
          <div
            ref={bossImgRef}
            onClick={handleAttack}
            style={{
              width: '180px',
              height: '180px',
              cursor: 'crosshair',
              transition: 'transform 0.08s ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              animation: 'bossFloat 2.5s ease-in-out infinite',
              filter: `drop-shadow(0 0 25px ${currentConfig.color})`,
            }}
            title={t('raid_click_to_strike')}
          >
            <img
              src={hornetImg}
              alt="Boss"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                imageRendering: 'pixelated',
              }}
            />
          </div>

          {/* Action Attack Button */}
          <button
            className="mc-button danger"
            onClick={handleAttack}
            style={{
              marginTop: '18px',
              padding: '14px 28px',
              fontSize: '11px',
              animation: 'buttonPulse 1.4s infinite',
              boxShadow: '0 0 20px rgba(255, 68, 68, 0.5)',
            }}
          >
            ⚔️ {t('raid_click_to_strike')} (
            {formatNumber(Math.floor((gameState.clickPower * 2 + gameState.honeyPerSecond * 0.25) * getBossDamageMultiplier(gameState.prestigeTalents)))} DMG)
          </button>
        </div>

        {/* Real-Time Combat Leaderboard */}
        <h3 style={{ fontSize: '11px', color: 'var(--text-honey)', marginBottom: '10px', textAlign: 'center' }}>
          {t('raid_total_dmg')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {playersList
            .sort((a, b) => (b.damage || 0) - (a.damage || 0))
            .map((p, index) => (
              <div
                key={p.uid}
                className="leaderboard-entry"
                style={{
                  borderColor: p.uid === user?.uid ? 'var(--honey-dark)' : 'var(--mc-border-dark)',
                  background: p.uid === user?.uid ? 'rgba(244,166,35,0.1)' : undefined,
                }}
              >
                <div className="leaderboard-rank" style={{ fontSize: '11px' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </div>
                {p.photoURL && <img src={p.photoURL} alt="" className="friend-avatar" />}
                <div className="leaderboard-name" style={{ fontSize: '10px' }}>
                  {p.displayName} {p.uid === user?.uid && <span style={{ color: 'var(--text-honey)' }}>(Vous)</span>}
                </div>
                <div className="leaderboard-score" style={{ color: 'var(--cannot-afford)', fontSize: '10px' }}>
                  💥 {formatNumber(p.damage || 0)}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
