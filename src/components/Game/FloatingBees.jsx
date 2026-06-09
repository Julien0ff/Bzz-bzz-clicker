// ===================================================
// FloatingBees — Background animated bees
// ===================================================

import React, { useMemo, useEffect, useRef } from 'react'
import { useGame } from '../../contexts/GameContext'
import gsap from 'gsap'
import babyBeeSrc from '/assets/Baby_Bee_JE2.gif'
import nectarBeeSrc from '/assets/Bee_with_nectar_BE1.gif'

export default function FloatingBees() {
  const { totalHoney } = useGame()
  const containerRef = useRef(null)

  // Calculate the number of bees based on honey (base 15, +1 per 10 honey, max 100)
  const beeCount = useMemo(() => {
    const calculated = 15 + Math.floor((totalHoney || 0) / 10)
    return Math.min(100, calculated)
  }, [totalHoney])

  // Pre-generate 100 bees so GSAP can animate them all constantly without resetting
  const bees = useMemo(() => {
    const result = []
    for (let i = 0; i < 100; i++) {
      const src = i % 2 === 0 ? babyBeeSrc : nectarBeeSrc
      const size = 30 + Math.random() * 40
      const startX = Math.random() * 100
      const startY = Math.random() * 100
      const opacity = 0.2 + Math.random() * 0.2
      
      result.push({
        id: i,
        src,
        size,
        startX,
        startY,
        opacity,
      })
    }
    return result
  }, [])

  // GSAP random movement
  useEffect(() => {
    const ctx = gsap.context(() => {
      const elements = gsap.utils.toArray('.floating-bee')
      
      elements.forEach(el => {
        // Function to animate to a random point
        const moveRandomly = () => {
          const newX = (Math.random() - 0.5) * 80 + 'vw'
          const newY = (Math.random() - 0.5) * 80 + 'vh'
          const duration = 2 + Math.random() * 5
          const delay = Math.random() * 0.5
          
          gsap.to(el, {
            x: newX,
            y: newY,
            rotation: (Math.random() - 0.5) * 30, // slight tilt
            duration: duration,
            delay: delay,
            ease: 'sine.inOut',
            onComplete: moveRandomly // loop forever
          })
        }
        
        moveRandomly()
      })
    }, containerRef)

    return () => ctx.revert() // cleanup on unmount
  }, [bees]) // re-run if bees array changes

  return (
    <div className="floating-bees-container" aria-hidden="true" ref={containerRef}>
      {bees.map((bee, index) => (
        <img
          key={bee.id}
          src={bee.src}
          className="floating-bee"
          alt=""
          style={{
            width: bee.size,
            height: bee.size,
            left: `${bee.startX}%`,
            top: `${bee.startY}%`,
            opacity: bee.opacity,
            position: 'absolute',
            imageRendering: 'pixelated',
            display: index < beeCount ? 'block' : 'none',
          }}
        />
      ))}
    </div>
  )
}
