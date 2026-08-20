import React, { useState, useEffect } from 'react'
import { useGame, getEffectiveHPS, getFrenzyBaseDuration, getTalentLevel } from '../../contexts/GameContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { formatNumber } from '../../data/upgrades'
import placeholderImg from '../../../assets/no texture.png'

// Base spawn time (in ms) — balanced between 1 min and 3 mins
const BASE_MIN_SPAWN = 60 * 1000  // 60 seconds (1 min)
const BASE_MAX_SPAWN = 180 * 1000 // 180 seconds (3 mins)

export default function GoldenBee() {
  const gameState = useGame()
  const { dispatch, prestigeTalents } = gameState
  const { t } = useLanguage()
  const [active, setActive] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [beeType, setBeeType] = useState('golden') // golden, diamond, storm, royal
  const [floatingBonus, setFloatingBonus] = useState(null)

  // Calculate spawn speed from prestige talent (up to 50% faster with max talent)
  const goldenSpeedLevel = prestigeTalents?.['goldenSpeed'] || 0
  const spawnReduction = 1 - Math.min(0.50, goldenSpeedLevel * 0.125)

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
      const typeRand = Math.random()
      if (typeRand < 0.40) setBeeType('golden')
      else if (typeRand < 0.65) setBeeType('storm')
      else if (typeRand < 0.85) setBeeType('royal')
      else setBeeType('diamond')

      const randomTop = Math.floor(Math.random() * 70) + 15
      setPosition({ top: randomTop, left: -100 })
      setActive(true)

      despawnTimeout = setTimeout(() => {
        setActive(false)
        scheduleNextSpawn()
      }, 6500)
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

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX || rect.left + rect.width / 2
    const clickY = e.clientY || rect.top + rect.height / 2

    const rand = Math.random()
    const hyperFrenzyLevel = getTalentLevel(prestigeTalents, 'hyperFrenzy')
    const frenzyMulti = 7 + (hyperFrenzyLevel * 5)
    const frenzyDuration = getFrenzyBaseDuration(prestigeTalents)

    if (rand < 0.35) {
      dispatch({ type: 'GOLDEN_BEE_EFFECT', effectType: 'frenzy' })
      showToast(
        t('golden_bee_toast_frenzy', { multi: frenzyMulti }),
        t('golden_bee_toast_frenzy_desc', { time: frenzyDuration }),
        'success'
      )
    } else if (rand < 0.60) {
      const effectiveHps = getEffectiveHPS(gameState)
      const bonus = Math.max(50000, Math.floor(effectiveHps * 900))
      
      dispatch({ type: 'GOLDEN_BEE_EFFECT', effectType: 'honey_rain', bonus })
      
      setFloatingBonus({ x: clickX, y: clickY, text: `+${formatNumber(bonus)} 🍯` })
      setTimeout(() => setFloatingBonus(null), 1500)

      showToast(
        t('golden_bee_toast_rain'),
        t('golden_bee_toast_rain_desc', { bonus: formatNumber(bonus) }),
        'success'
      )
    } else if (rand < 0.85) {
      dispatch({ type: 'GOLDEN_BEE_EFFECT', effectType: 'click_storm' })
      showToast(
        t('golden_bee_toast_storm'),
        t('golden_bee_toast_storm_desc'),
        'success'
      )
    } else {
      dispatch({ type: 'GOLDEN_BEE_EFFECT', effectType: 'blessing' })
      showToast(
        t('golden_bee_toast_blessing'),
        t('golden_bee_toast_blessing_desc'),
        'success'
      )
    }
  }

  const glowColors = {
    golden: '#ffd700',
    diamond: '#00ffff',
    storm: '#ff4444',
    royal: '#ff00ff',
  }
  const glowColor = glowColors[beeType] || '#ffd700'

  return (
    <>
      {floatingBonus && (
        <div
          className="raid-damage-particle"
          style={{
            position: 'fixed',
            left: floatingBonus.x,
            top: floatingBonus.y,
            color: 'var(--honey-light)',
            fontSize: '14px',
            zIndex: 10000,
          }}
        >
          {floatingBonus.text}
        </div>
      )}

      {active && (
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
            animation: 'goldenBeeFly 6.5s linear forwards',
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
      )}
    </>
  )
}

function showToast(title, message, type = 'success') {
  const event = new CustomEvent('system_toast', {
    detail: { title, message, type }
  })
  window.dispatchEvent(event)
}
