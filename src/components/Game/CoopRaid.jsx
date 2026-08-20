// ===================================================
// CoopRaid — Co-op Boss Raid Event (Phase 5)
// ===================================================

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { doc, getDoc, setDoc, updateDoc, onSnapshot, increment } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { useGame } from '../../contexts/GameContext'
import { formatNumber } from '../../data/upgrades'
import hornetImg from '../../../assets/Bee_(Dungeons).png'

const BOSS_CONFIGS = [
  {
    id: 'hornet_colossus',
    name: "Frelon Colossal de l'Ombre",
    icon: '🐝',
    color: '#ff2a2a',
    maxHp: 5000000000, // 5 Milliards
    rewardJelly: 5,
    rewardHoney: 500000000, // 500 Millions
  },
  {
    id: 'bear_honey_thief',
    name: "L'Ours Titan Voleur de Miel",
    icon: '🐻',
    color: '#ff8800',
    maxHp: 25000000000, // 25 Milliards
    rewardJelly: 10,
    rewardHoney: 2000000000, // 2 Milliards
  },
  {
    id: 'void_queen',
    name: "La Reine Corrompue du Néant",
    icon: '👑',
    color: '#a82aff',
    maxHp: 100000000000, // 100 Milliards
    rewardJelly: 25,
    rewardHoney: 10000000000, // 10 Milliards
  },
]

export default function CoopRaid() {
  const { user, userProfile } = useAuth()
  const gameState = useGame()
  const [bossData, setBossData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [localDamagePending, setLocalDamagePending] = useState(0)
  const [damageParticles, setDamageParticles] = useState([])
  const [claimed, setClaimed] = useState(false)
  const bossImgRef = useRef(null)
  const damageAccumulatorRef = useRef(0)
  const flushTimerRef = useRef(null)

  // Real-time listener for current boss
  useEffect(() => {
    const raidDocRef = doc(db, 'raids', 'current_boss')
    const unsubscribe = onSnapshot(raidDocRef, async (docSnap) => {
      if (!docSnap.exists()) {
        // Initialize default first boss
        const initialBoss = {
          bossIndex: 0,
          name: BOSS_CONFIGS[0].name,
          maxHp: BOSS_CONFIGS[0].maxHp,
          currentHp: BOSS_CONFIGS[0].maxHp,
          rewardJelly: BOSS_CONFIGS[0].rewardJelly,
          rewardHoney: BOSS_CONFIGS[0].rewardHoney,
          status: 'active',
          contributors: {},
          createdAt: new Date().toISOString(),
        }
        await setDoc(raidDocRef, initialBoss).catch(console.error)
        setBossData(initialBoss)
      } else {
        setBossData(docSnap.data())
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Flush accumulated damage to Firestore every 1.5 seconds
  const flushDamage = useCallback(async () => {
    const dmg = damageAccumulatorRef.current
    if (dmg <= 0 || !user) return

    damageAccumulatorRef.current = 0
    try {
      const raidDocRef = doc(db, 'raids', 'current_boss')
      const snap = await getDoc(raidDocRef)
      if (!snap.exists()) return

      const current = snap.data()
      if (current.status !== 'active') return

      const newHp = Math.max(0, current.currentHp - dmg)
      const userKey = `contributors.${user.uid}`

      const updatePayload = {
        currentHp: newHp,
        status: newHp <= 0 ? 'defeated' : 'active',
        [`${userKey}.displayName`]: userProfile?.displayName || 'Joueur',
        [`${userKey}.photoURL`]: userProfile?.photoURL || null,
        [`${userKey}.damage`]: increment(dmg),
      }

      await updateDoc(raidDocRef, updatePayload)
    } catch (err) {
      console.error('Error flushing raid damage:', err)
    }
  }, [user, userProfile])

  useEffect(() => {
    flushTimerRef.current = setInterval(flushDamage, 1500)
    return () => {
      clearInterval(flushTimerRef.current)
      flushDamage()
    }
  }, [flushDamage])

  // Handle attack click
  const handleAttack = (e) => {
    if (!bossData || bossData.status !== 'active' || bossData.currentHp <= 0) return

    // Calculate attack damage: combines Click Power + % of HPS
    const damage = Math.max(
      10,
      Math.floor(gameState.clickPower * 1.5 + gameState.honeyPerSecond * 0.2)
    )

    damageAccumulatorRef.current += damage
    setLocalDamagePending((prev) => prev + damage)

    // Boss shake animation
    if (bossImgRef.current) {
      bossImgRef.current.style.transform = 'scale(0.92) rotate(' + (Math.random() * 10 - 5) + 'deg)'
      setTimeout(() => {
        if (bossImgRef.current) bossImgRef.current.style.transform = 'scale(1) rotate(0deg)'
      }, 70)
    }

    // Spawn damage particle
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX || rect.left + rect.width / 2
    const y = e.clientY || rect.top + rect.height / 2

    const particleId = Date.now() + Math.random()
    setDamageParticles((prev) => [...prev, { id: particleId, x, y, text: `-${formatNumber(damage)}` }])

    setTimeout(() => {
      setDamageParticles((prev) => prev.filter((p) => p.id !== particleId))
    }, 800)
  }

  // Claim reward upon victory
  const handleClaimVictory = async () => {
    if (claimed || !bossData || bossData.status !== 'defeated') return

    const myContribution = bossData.contributors?.[user?.uid]?.damage || 0
    if (myContribution <= 0) {
      alert("Vous devez avoir infligé des dégâts au boss pour réclamer la récompense !")
      return
    }

    // Grant reward in GameContext
    const jellyReward = bossData.rewardJelly || 5
    const honeyReward = bossData.rewardHoney || 500000000

    gameState.dispatch({
      type: 'LOAD_SAVE',
      savedState: {
        ...gameState,
        royalJelly: (gameState.royalJelly || 0) + jellyReward,
        honey: (gameState.honey || 0) + honeyReward,
        totalHoney: (gameState.totalHoney || 0) + honeyReward,
        blessingTimeLeft: (gameState.blessingTimeLeft || 0) + 60, // 1 min blessing
      },
    })

    setClaimed(true)

    window.dispatchEvent(
      new CustomEvent('system_toast', {
        detail: {
          type: 'success',
          title: '🏆 VICTOIRE DU RAID !',
          message: `Récompense réclamée : +${jellyReward} 👑 et +${formatNumber(honeyReward)} 🍯 !`,
        },
      })
    )
  }

  // Spawn next boss (admin or after defeat)
  const handleSpawnNextBoss = async () => {
    try {
      const currentIndex = bossData?.bossIndex || 0
      const nextIndex = (currentIndex + 1) % BOSS_CONFIGS.length
      const nextConfig = BOSS_CONFIGS[nextIndex]

      const raidDocRef = doc(db, 'raids', 'current_boss')
      const newBoss = {
        bossIndex: nextIndex,
        name: nextConfig.name,
        maxHp: nextConfig.maxHp,
        currentHp: nextConfig.maxHp,
        rewardJelly: nextConfig.rewardJelly,
        rewardHoney: nextConfig.rewardHoney,
        status: 'active',
        contributors: {},
        createdAt: new Date().toISOString(),
      }

      await setDoc(raidDocRef, newBoss)
      setClaimed(false)
    } catch (err) {
      console.error('Error spawning next boss:', err)
    }
  }

  if (loading) {
    return (
      <div className="leaderboard-container">
        <div className="mc-panel" style={{ textAlign: 'center' }}>
          <div className="loading-text">Recherche du Boss d'Essaim...</div>
        </div>
      </div>
    )
  }

  const currentConfig = BOSS_CONFIGS[bossData?.bossIndex || 0] || BOSS_CONFIGS[0]
  const effectiveHp = Math.max(0, (bossData?.currentHp || 0) - localDamagePending)
  const hpPercent = bossData?.maxHp ? Math.max(0, Math.min(100, (effectiveHp / bossData.maxHp) * 100)) : 100
  const isDefeated = bossData?.status === 'defeated' || effectiveHp <= 0

  // Sorted contributors
  const contributorsList = Object.entries(bossData?.contributors || {})
    .map(([uid, data]) => ({ uid, ...data }))
    .sort((a, b) => (b.damage || 0) - (a.damage || 0))

  const myRank = contributorsList.findIndex((c) => c.uid === user?.uid)
  const myDamage = bossData?.contributors?.[user?.uid]?.damage || localDamagePending

  return (
    <div className="leaderboard-container" style={{ maxWidth: '750px' }}>
      {/* Floating damage numbers */}
      {damageParticles.map((p) => (
        <div
          key={p.id}
          className="raid-damage-particle"
          style={{ position: 'fixed', left: p.x, top: p.y }}
        >
          {p.text}
        </div>
      ))}

      <div className="mc-panel" style={{ marginBottom: '16px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '9px', color: 'var(--cannot-afford)', letterSpacing: '2px', marginBottom: '4px' }}>
            ⚔️ ÉVÉNEMENT COOPÉRATIF MONDIAL ⚔️
          </div>
          <h2 style={{ fontSize: '15px', color: currentConfig.color, textShadow: '2px 2px 0 #000' }}>
            {bossData?.name || 'Boss du Raid'}
          </h2>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }} className="friend-honey">
            Frappez le boss ensemble avec tous les joueurs pour vider sa jauge de vie !
          </div>
        </div>

        {/* Boss Display */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            background: 'radial-gradient(circle, rgba(255,0,0,0.15) 0%, rgba(0,0,0,0.5) 70%)',
            border: '3px solid var(--mc-border-dark)',
            borderRadius: '4px',
            marginBottom: '20px',
            position: 'relative',
          }}
        >
          {/* Health Bar */}
          <div style={{ width: '100%', maxWidth: '420px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-honey)' }}>PV DU BOSS</span>
              <span style={{ color: hpPercent < 25 ? 'var(--cannot-afford)' : 'var(--can-afford)' }}>
                {formatNumber(effectiveHp)} / {formatNumber(bossData?.maxHp)} ({hpPercent.toFixed(1)}%)
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '18px',
                background: '#1a1a1a',
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
                  transition: 'width 0.2s ease-out',
                  boxShadow: '0 0 12px rgba(255, 68, 68, 0.6)',
                }}
              />
            </div>
          </div>

          {/* Boss Sprite & Click Area */}
          <div
            ref={bossImgRef}
            onClick={handleAttack}
            style={{
              width: '170px',
              height: '170px',
              cursor: isDefeated ? 'default' : 'crosshair',
              transition: 'transform 0.08s ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              filter: isDefeated
                ? 'grayscale(100%) opacity(40%)'
                : `drop-shadow(0 0 25px ${currentConfig.color})`,
            }}
            title={isDefeated ? 'Boss vaincu !' : 'Cliquez pour attaquer !'}
          >
            <img
              src={hornetImg}
              alt="Boss"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                imageRendering: 'pixelated',
                animation: isDefeated ? 'none' : 'loginBeeBounce 1.8s ease-in-out infinite',
              }}
            />
          </div>

          {/* Attack Action Button */}
          {!isDefeated && (
            <button
              className="mc-button danger"
              onClick={handleAttack}
              style={{
                marginTop: '16px',
                padding: '14px 28px',
                fontSize: '11px',
                animation: 'buttonPulse 1.5s infinite',
                boxShadow: '0 0 20px rgba(255, 68, 68, 0.4)',
              }}
            >
              ⚔️ FRAPPER LE BOSS (
              {formatNumber(Math.floor(gameState.clickPower * 1.5 + gameState.honeyPerSecond * 0.2))} DMG)
            </button>
          )}

          {/* Defeat Banner */}
          {isDefeated && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: 'var(--honey-light)', marginBottom: '8px', animation: 'comboFlash 1s infinite' }}>
                🎉 LE BOSS A ÉTÉ VAINCU PAR L'ESSAIM ! 🎉
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {!claimed ? (
                  <button
                    className="mc-button primary"
                    onClick={handleClaimVictory}
                    style={{ padding: '12px 24px', fontSize: '10px' }}
                  >
                    👑 Réclamer Récompense (+{bossData?.rewardJelly} 👑 & +{formatNumber(bossData?.rewardHoney)} 🍯)
                  </button>
                ) : (
                  <div style={{ fontSize: '10px', color: 'var(--can-afford)', padding: '10px' }}>
                    ✅ Récompense réclamée avec succès !
                  </div>
                )}
                {userProfile?.isAdmin && (
                  <button
                    className="mc-button"
                    onClick={handleSpawnNextBoss}
                    style={{ padding: '12px 20px', fontSize: '10px' }}
                  >
                    🔄 Invoquer le prochain Boss (Admin)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Player Stats in Raid */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: '12px',
            background: 'var(--bg-panel-inner)',
            border: '2px solid var(--mc-border-dark)',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '7px', color: 'var(--text-dim)' }}>VOS DÉGÂTS TOTAUX</div>
            <div style={{ fontSize: '12px', color: 'var(--text-honey)', marginTop: '4px' }}>
              {formatNumber(myDamage)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '7px', color: 'var(--text-dim)' }}>VOTRE RANG</div>
            <div style={{ fontSize: '12px', color: 'var(--can-afford)', marginTop: '4px' }}>
              {myRank >= 0 ? `#${myRank + 1}` : 'Non classé'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '7px', color: 'var(--text-dim)' }}>RÉCOMPENSE GLOBALE</div>
            <div style={{ fontSize: '12px', color: 'var(--honey-light)', marginTop: '4px' }}>
              +{bossData?.rewardJelly} 👑
            </div>
          </div>
        </div>

        {/* Top Contributors Leaderboard */}
        <h3 style={{ fontSize: '11px', color: 'var(--text-honey)', marginBottom: '10px', textAlign: 'center' }}>
          🏆 MEILLEURS CONTRIBUTEURS DU RAID ({contributorsList.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {contributorsList.length === 0 && (
            <div className="loading-text" style={{ textAlign: 'center' }}>
              Soyez le premier à frapper le boss !
            </div>
          )}
          {contributorsList.slice(0, 15).map((c, index) => (
            <div
              key={c.uid}
              className="leaderboard-entry"
              style={{
                borderColor: c.uid === user?.uid ? 'var(--honey-dark)' : 'var(--mc-border-dark)',
                background: c.uid === user?.uid ? 'rgba(244,166,35,0.1)' : undefined,
              }}
            >
              <div className="leaderboard-rank" style={{ fontSize: '11px' }}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </div>
              {c.photoURL && <img src={c.photoURL} alt="" className="friend-avatar" />}
              <div className="leaderboard-name" style={{ fontSize: '10px' }}>
                {c.displayName} {c.uid === user?.uid && <span style={{ color: 'var(--text-honey)' }}>(Vous)</span>}
              </div>
              <div className="leaderboard-score" style={{ color: 'var(--cannot-afford)', fontSize: '10px' }}>
                💥 {formatNumber(c.damage || 0)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
