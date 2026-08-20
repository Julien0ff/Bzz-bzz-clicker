// ===================================================
// BeeButton — The central clickable bee with Anti-Cheat
// ===================================================

import React, { useRef, useCallback } from 'react'
import { useGame } from '../../contexts/GameContext'
import { useAuth } from '../../contexts/AuthContext'
import { createAntiCheatTracker } from '../../utils/antiCheat'
import ClickParticles from './ClickParticles'
import beeSrc from '/assets/Bee_(Dungeons).png'

export default function BeeButton() {
  const { click, clickPower } = useGame()
  const { banUser } = useAuth()
  const buttonRef = useRef(null)
  const particlesRef = useRef(null)
  const clickIntervalRef = useRef(null)

  // Advanced Anti-Cheat Tracker Instance
  const antiCheatRef = useRef(null)
  if (!antiCheatRef.current) {
    antiCheatRef.current = createAntiCheatTracker({
      onCheatDetected: (reason) => {
        console.error('[Anti-Cheat Alert]', reason)
        banUser(reason)
      },
      maxAllowedCPS: 20,
    })
  }

  const triggerClick = useCallback((e, clientX, clientY) => {
    // --- Advanced Multi-Layer Anti-Cheat Check ---
    const isValid = antiCheatRef.current.validateClick(e, clientX, clientY)
    if (!isValid) return
    // ---------------------------------------------

    click()

    // Animate bounce
    const btn = buttonRef.current
    if (btn) {
      btn.style.transform = 'scale(0.88)'
      setTimeout(() => {
        if (btn) btn.style.transform = 'scale(1)'
      }, 50)
    }

    // Spawn particle at position
    if (particlesRef.current) {
      let cx = clientX
      let cy = clientY
      if (!cx || !cy) {
        const rect = buttonRef.current?.getBoundingClientRect()
        if (rect) {
          cx = rect.left + rect.width / 2
          cy = rect.top + rect.height / 2
        }
      }
      particlesRef.current.spawn(cx, cy, clickPower)
    }
  }, [click, clickPower])

  const startClicking = useCallback((e) => {
    if (e.type === 'keydown' && e.key !== ' ') return
    if (e.type === 'keydown') e.preventDefault()

    if (clickIntervalRef.current) return

    const clientX = e.clientX || null
    const clientY = e.clientY || null

    // Trigger first click immediately with original event
    triggerClick(e, clientX, clientY)

    // Interval for holding click
    clickIntervalRef.current = setInterval(() => {
      triggerClick(e, clientX, clientY)
    }, 85)
  }, [triggerClick])

  const stopClicking = useCallback(() => {
    if (clickIntervalRef.current) {
      clearInterval(clickIntervalRef.current)
      clickIntervalRef.current = null
    }
  }, [])

  React.useEffect(() => {
    return stopClicking
  }, [stopClicking])

  return (
    <div className="bee-button-container">
      <div className="bee-glow" />
      <button
        ref={buttonRef}
        className="bee-button"
        onMouseDown={startClicking}
        onMouseUp={stopClicking}
        onMouseLeave={stopClicking}
        onKeyDown={startClicking}
        onKeyUp={stopClicking}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Cliquer sur l'abeille pour récolter du miel"
        id="bee-click-button"
        style={{ transition: 'transform 0.05s ease-out' }}
      >
        <img src={beeSrc} alt="Abeille Minecraft" draggable={false} />
      </button>
      <ClickParticles ref={particlesRef} />
    </div>
  )
}
