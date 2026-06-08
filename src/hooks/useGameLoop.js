// ===================================================
// useGameLoop — Passive Production Game Loop
// ===================================================

import { useEffect, useRef } from 'react'
import { useGame } from '../contexts/GameContext'
import { ACHIEVEMENTS } from '../data/achievements'

export function useGameLoop() {
  const gameState = useGame()
  const { tick, click, honeyPerSecond, achievements, clickUpgrades, dispatch } = gameState
  const lastTimeRef = useRef(null)
  const animFrameRef = useRef(null)

  // Game Loop
  useEffect(() => {
    if (honeyPerSecond <= 0) {
      lastTimeRef.current = null
      return
    }

    const loop = (timestamp) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp
      }

      const delta = (timestamp - lastTimeRef.current) / 1000 // in seconds
      lastTimeRef.current = timestamp

      if (delta > 0 && delta < 1) {
        tick(delta)
      }

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [tick, honeyPerSecond])

  // Auto-Clicker Loop (runs every 1 second if upgrade is owned)
  useEffect(() => {
    if (!clickUpgrades || !clickUpgrades['autoClicker']) return

    const autoClick = setInterval(() => {
      click()
      // Dispatch an event to show click particles (optional, but good for feedback)
      window.dispatchEvent(new CustomEvent('auto_click_particle'))
    }, 1000)

    return () => clearInterval(autoClick)
  }, [clickUpgrades, click])

  // Achievement Check Loop (runs every 1 second)
  useEffect(() => {
    const checkAchievements = setInterval(() => {
      if (!gameState) return
      
      const currentUnlocked = achievements || []
      
      ACHIEVEMENTS.forEach(ach => {
        if (!currentUnlocked.includes(ach.id) && ach.condition(gameState)) {
          dispatch({ type: 'UNLOCK_ACHIEVEMENT', id: ach.id, achievement: ach })
          
          // Show toast via native JS or custom event
          const event = new CustomEvent('achievement_unlocked', { detail: ach })
          window.dispatchEvent(event)
        }
      })
    }, 1000)

    return () => clearInterval(checkAchievements)
  }, [gameState, achievements, dispatch])
}
