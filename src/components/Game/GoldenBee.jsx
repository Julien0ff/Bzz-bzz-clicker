import React, { useState, useEffect } from 'react'
import { useGame } from '../../contexts/GameContext'

// Constantes d'apparition (en millisecondes)
const MIN_SPAWN_TIME = 1 * 60 * 1000 // 1 minutes
const MAX_SPAWN_TIME = 3 * 60 * 1000 // 3 minutes

export default function GoldenBee() {
  const { dispatch } = useGame()
  const [active, setActive] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    let timeoutId

    const scheduleNextSpawn = () => {
      const delay = Math.random() * (MAX_SPAWN_TIME - MIN_SPAWN_TIME) + MIN_SPAWN_TIME
      timeoutId = setTimeout(() => {
        spawnGoldenBee()
      }, delay)
    }

    const spawnGoldenBee = () => {
      // Position de départ aléatoire sur la hauteur (10% à 90%)
      const randomTop = Math.floor(Math.random() * 80) + 10
      setPosition({ top: randomTop, left: -100 }) // commence hors de l'écran à gauche
      setActive(true)

      // L'abeille traverse l'écran en 6 secondes puis disparaît
      setTimeout(() => {
        setActive(false)
        scheduleNextSpawn()
      }, 6000)
    }

    // Lancer le premier cycle
    scheduleNextSpawn()

    return () => clearTimeout(timeoutId)
  }, [])

  const handleClick = (e) => {
    e.stopPropagation() // Pour ne pas déclencher le clic derrière
    setActive(false) // L'abeille disparaît

    // Effet aléatoire : 33% Frenzy, 33% Lucky Drop, 33% Malus (Piqûre)
    const rand = Math.random()

    if (rand < 0.33) {
      dispatch({ type: 'GOLDEN_BEE_EFFECT', effectType: 'frenzy' })

      // Toast natif
      const event = new CustomEvent('achievement_unlocked', {
        detail: {
          name: "Production x7 pendant 30 secondes !",
          description: "Abeille Dorée",
          icon: '⚡'
        }
      })
      window.dispatchEvent(event)
    } else if (rand < 0.66) {
      dispatch({ type: 'GOLDEN_BEE_EFFECT', effectType: 'lucky_drop' })

      // Toast natif
      const event = new CustomEvent('achievement_unlocked', {
        detail: {
          name: "Miel d'un coup !",
          description: "Abeille Dorée (Loterie)",
          icon: '💰'
        }
      })
      window.dispatchEvent(event)
    } else {
      dispatch({ type: 'GOLDEN_BEE_EFFECT', effectType: 'malus' })

      // Toast natif
      const event = new CustomEvent('achievement_unlocked', {
        detail: {
          name: "Aïe ! L'abeille vous a piqué !",
          description: "Perte exponentielle de miel",
          icon: '🩸'
        }
      })
      window.dispatchEvent(event)
    }
  }

  if (!active) return null

  return (
    <div
      className="golden-bee"
      style={{
        position: 'fixed',
        top: `${position.top}%`,
        left: '-100px', // Animé via CSS
        width: '60px',
        height: '60px',
        cursor: 'pointer',
        zIndex: 9999, // Très au-dessus
        animation: 'goldenBeeFly 6s linear forwards',
      }}
      onClick={handleClick}
    >
      <img
        src="/assets/Bee_(Dungeons).png"
        alt="Golden Bee"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          filter: 'sepia(1) hue-rotate(10deg) saturate(3) brightness(1.2)', // Teinte dorée
          animation: 'goldenGlow 1.5s ease-in-out infinite'
        }}
      />
    </div>
  )
}
