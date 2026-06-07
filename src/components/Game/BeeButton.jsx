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

  const handleClick = useCallback((e) => {
    click()

    // Animate bounce
    const btn = buttonRef.current
    if (btn) {
      btn.style.transform = 'scale(0.88)'
      setTimeout(() => {
        btn.style.transform = 'scale(1)'
      }, 100)
    }

    // Spawn particle at click position
    if (particlesRef.current) {
      particlesRef.current.spawn(e.clientX, e.clientY, clickPower)
    }
  }, [click, clickPower])

  return (
    <div className="bee-button-container">
      <div className="bee-glow" />
      <button
        ref={buttonRef}
        className="bee-button"
        onClick={handleClick}
        aria-label="Cliquer sur l'abeille pour récolter du miel"
        id="bee-click-button"
        style={{ transition: 'transform 0.1s ease-out' }}
      >
        <img src={beeSrc} alt="Abeille Minecraft" draggable={false} />
      </button>
      <ClickParticles ref={particlesRef} />
    </div>
  )
}
