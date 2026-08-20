import React, { useState, useEffect } from 'react'
import { useGame } from '../../contexts/GameContext'
import placeholderImg from '../../../assets/no texture.png'

// Base spawn time — can be reduced by prestige talent 'goldenSpeed'
const BASE_MIN_SPAWN = 25 * 1000  // 25 seconds
const BASE_MAX_SPAWN = 90 * 1000  // 90 seconds

export default function GoldenBee() {
  const { dispatch, prestigeTalents } = useGame()
  const [active, setActive] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [beeType, setBeeType] = useState('golden') // golden, diamond, storm, royal

  // Calculate spawn speed from prestige talent
  const goldenSpeedLevel = prestigeTalents?.['goldenSpeed'] || 0
  const spawnReduction = 1 - Math.min(0.75, goldenSpeedLevel * 0.25) // cap at 75% faster

  useEffect(() => {
    let timeoutId
    let despawnTimeout

    const scheduleNextSpawn = () => {
      const minSpawn = BASE_MIN_SPAWN * spawnReduction
      const maxSpawn = BASE_MAX_SPAWN * spawnReduction
      const delay = Math.random() * (maxSpawn - minSpawn) + minSpawn
      timeoutId = setTimeout(() => {
        spawnGoldenBee()
      }, delay)
    }

    const spawnGoldenBee = () => {
      // Random bee type for visual variety
      const typeRand = Math.random()
      if (typeRand < 0.40) setBeeType('golden')
      else if (typeRand < 0.65) setBeeType('storm')
      else if (typeRand < 0.85) setBeeType('royal')
      else setBeeType('diamond')

      const randomTop = Math.floor(Math.random() * 70) + 15
      setPosition({ top: randomTop, left: -100 })
      setActive(true)

      // Despawn after 6 seconds if not clicked
      despawnTimeout = setTimeout(() => {
        setActive(false)
        scheduleNextSpawn()
      }, 6000)
    }

    scheduleNextSpawn()

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(despawnTimeout)
    }
  }, [spawnReduction])

  const handleClick = (e) => {
    e.stopPropagation()
    setActive(false)

    // 4 possible buffs — all positive, weighted randomly
    const rand = Math.random()

    if (rand < 0.30) {
      // ⚡ Frenzy x7 pendant 25s (base)
      dispatch({ type: 'GOLDEN_BEE_EFFECT', effectType: 'frenzy' })
      showToast('⚡ Production x7 !', 'Frenzy activée !', '⚡')
    } else if (rand < 0.55) {
      // 🌧️ Pluie de Miel (+15 min de production instantanément)
      dispatch({ type: 'GOLDEN_BEE_EFFECT', effectType: 'honey_rain' })
      showToast('🌧️ Pluie de Miel !', '15 minutes de production instantanées !', '🌧️')
    } else if (rand < 0.80) {
      // ⚡ Clic Tempête x77 pendant 12s
      dispatch({ type: 'GOLDEN_BEE_EFFECT', effectType: 'click_storm' })
      showToast('⚡ Clic Tempête x77 !', 'Vos clics sont surpuissants pendant 12s !', '💥')
    } else {
      // 👑 Bénédiction Royale x10 pendant 30s
      dispatch({ type: 'GOLDEN_BEE_EFFECT', effectType: 'blessing' })
      showToast('👑 Bénédiction Royale !', 'Production x10 pendant 30 secondes !', '👑')
    }
  }

  if (!active) return null

  // Different glow colors per bee type
  const glowColors = {
    golden: '#ffd700',
    diamond: '#00ffff',
    storm: '#ff4444',
    royal: '#ff00ff',
  }
  const glowColor = glowColors[beeType] || '#ffd700'

  return (
    <div
      className="golden-bee"
      style={{
        position: 'fixed',
        top: `${position.top}%`,
        left: '-100px',
        width: '60px',
        height: '60px',
        cursor: 'pointer',
        zIndex: 9999,
        animation: 'goldenBeeFly 6s linear forwards',
      }}
      onClick={handleClick}
    >
      <img
        src={placeholderImg}
        alt="Golden Bee"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          animation: 'goldenGlow 1.5s ease-in-out infinite',
          filter: `drop-shadow(0 0 15px ${glowColor}) drop-shadow(0 0 30px ${glowColor})`,
        }}
      />
    </div>
  )
}

function showToast(name, description, icon) {
  const event = new CustomEvent('achievement_unlocked', {
    detail: { name, description, icon }
  })
  window.dispatchEvent(event)
}
