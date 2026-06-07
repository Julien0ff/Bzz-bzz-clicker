// ===================================================
// BeeButton — The central clickable bee
// ===================================================

import React, { useRef, useCallback } from 'react'
import { useGame } from '../../contexts/GameContext'
import ClickParticles from './ClickParticles'
import beeSrc from '/assets/Bee_(Dungeons).png'

export default function BeeButton() {
  const { click, clickPower } = useGame()
  const buttonRef = useRef(null)
  const particlesRef = useRef(null)
  const clickIntervalRef = useRef(null)

  const triggerClick = useCallback((clientX, clientY) => {
    click()

    // Animate bounce
    const btn = buttonRef.current
    if (btn) {
      btn.style.transform = 'scale(0.88)'
      setTimeout(() => {
        if (btn) btn.style.transform = 'scale(1)'
      }, 50) // Faster bounce for rapid clicking
    }

    // Spawn particle at position (or center if using keyboard)
    if (particlesRef.current) {
      let cx = clientX
      let cy = clientY
      if (!cx || !cy) {
        const rect = buttonRef.current.getBoundingClientRect()
        cx = rect.left + rect.width / 2
        cy = rect.top + rect.height / 2
      }
      particlesRef.current.spawn(cx, cy, clickPower)
    }
  }, [click, clickPower])

  const startClicking = useCallback((e) => {
    // If it's a keyboard event, check if it's Space
    if (e.type === 'keydown' && e.key !== ' ') return
    if (e.type === 'keydown') e.preventDefault() // Prevent scrolling

    // If interval is already running, do nothing
    if (clickIntervalRef.current) return

    // Trigger first click immediately
    triggerClick(e.clientX, e.clientY)

    // Start interval
    clickIntervalRef.current = setInterval(() => {
      triggerClick(e.clientX, e.clientY)
    }, 80) // 80ms per click (adjust if needed)
  }, [triggerClick])

  const stopClicking = useCallback(() => {
    if (clickIntervalRef.current) {
      clearInterval(clickIntervalRef.current)
      clickIntervalRef.current = null
    }
  }, [])

  // Cleanup interval on unmount
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
        onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
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
