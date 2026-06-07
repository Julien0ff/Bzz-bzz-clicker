// ===================================================
// ClickParticles — "+X Miel" floating text on click
// ===================================================

import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import { formatNumber } from '../../data/upgrades'

let particleId = 0

const ClickParticles = forwardRef((props, ref) => {
  const [particles, setParticles] = useState([])

  const spawn = useCallback((x, y, amount) => {
    const id = particleId++
    const offsetX = (Math.random() - 0.5) * 60
    const offsetY = (Math.random() - 0.5) * 20

    const newParticle = {
      id,
      x: x + offsetX,
      y: y + offsetY,
      amount,
    }

    setParticles(prev => [...prev, newParticle])

    // Remove after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id))
    }, 1000)
  }, [])

  useImperativeHandle(ref, () => ({
    spawn,
  }))

  return (
    <>
      {particles.map(p => (
        <div
          key={p.id}
          className="click-particle"
          style={{
            left: p.x,
            top: p.y,
            animation: 'particleFloat 1s ease-out forwards',
          }}
        >
          +{formatNumber(p.amount)}
        </div>
      ))}
      <style>{`
        @keyframes particleFloat {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-80px) scale(1.3);
          }
        }
      `}</style>
    </>
  )
})

ClickParticles.displayName = 'ClickParticles'

export default ClickParticles
