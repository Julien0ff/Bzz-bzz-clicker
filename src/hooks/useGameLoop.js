// ===================================================
// useGameLoop — Passive Production Game Loop
// ===================================================

import { useEffect, useRef } from 'react'
import { useGame } from '../contexts/GameContext'

export function useGameLoop() {
  const { tick, honeyPerSecond } = useGame()
  const lastTimeRef = useRef(null)
  const animFrameRef = useRef(null)

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
        // Cap delta to avoid huge jumps (e.g., tab coming back to focus)
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
}
