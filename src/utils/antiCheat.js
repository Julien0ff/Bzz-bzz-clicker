// ===================================================
// Anti-Cheat Engine — Advanced Auto-Clicker & Macro Detection
// ===================================================

/**
 * Creates an AntiCheat detector instance to monitor click behavior.
 * Evaluates:
 * 1. Event authenticity (e.isTrusted check)
 * 2. Rolling window CPS and burst velocity
 * 3. Timing regularity & standard deviation (fixed-interval macros)
 * 4. Coordinate stagnation (zero-jitter auto-clickers)
 * 5. Keyboard repeat spam
 */
export function createAntiCheatTracker({ onCheatDetected, maxAllowedCPS = 20 }) {
  const clickTimestamps = []
  const clickIntervals = []
  const clickCoordinates = []
  let strikes = 0
  let lastViolationTime = 0

  /**
   * Process a click event.
   * Returns true if click is valid, false if blocked/banned.
   */
  function validateClick(e, clientX = null, clientY = null) {
    const now = performance.now()

    // 1. Synthetic Event Check (Dispatched by script)
    if (e && e.isTrusted === false) {
      console.warn('[Anti-Cheat] Synthetic event detected (isTrusted: false)')
      onCheatDetected('Événement de clic synthétique / non authentique détecté (isTrusted=false).')
      return false
    }

    // 2. Keyboard repeat rate limit
    if (e && e.type === 'keydown' && e.repeat) {
      // Check interval between repeats
      const lastTime = clickTimestamps[clickTimestamps.length - 1] || 0
      if (now - lastTime < 90) { // Max ~11 CPS via held spacebar
        return false
      }
    }

    // Record timestamp
    clickTimestamps.push(now)
    // Keep last 1.5 seconds of timestamps
    while (clickTimestamps.length > 0 && now - clickTimestamps[0] > 1500) {
      clickTimestamps.shift()
    }

    // Record interval
    if (clickTimestamps.length >= 2) {
      const prevTime = clickTimestamps[clickTimestamps.length - 2]
      const delta = now - prevTime
      clickIntervals.push(delta)
      if (clickIntervals.length > 20) {
        clickIntervals.shift()
      }
    }

    // Record coordinates (if provided)
    if (clientX !== null && clientY !== null) {
      clickCoordinates.push({ x: clientX, y: clientY })
      if (clickCoordinates.length > 20) {
        clickCoordinates.shift()
      }
    }

    // --- DETECTION 1: Rolling 1-second CPS check ---
    const recentOneSecClicks = clickTimestamps.filter(t => now - t <= 1000).length
    if (recentOneSecClicks > maxAllowedCPS) {
      strikes++
      console.warn(`[Anti-Cheat] CPS limit exceeded: ${recentOneSecClicks} CPS (Strike ${strikes}/3)`)
      
      if (recentOneSecClicks > maxAllowedCPS + 8 || strikes >= 3) {
        onCheatDetected(`Vitesse de clic surhumaine détectée (${recentOneSecClicks} CPS).`)
        return false
      }
      return false
    }

    // --- DETECTION 2: High-velocity burst check (last 250ms) ---
    const recentBurstClicks = clickTimestamps.filter(t => now - t <= 250).length
    if (recentBurstClicks >= 8) { // >32 CPS burst
      strikes++
      console.warn(`[Anti-Cheat] Instant burst spike: ${recentBurstClicks} clicks in 250ms (Strike ${strikes}/3)`)
      if (recentBurstClicks >= 10 || strikes >= 3) {
        onCheatDetected('Rafale de clics anormale / macro détectée (>35 CPS en rafale).')
        return false
      }
      return false
    }

    // --- DETECTION 3: Mathematical Timing Regularity (Standard Deviation) ---
    // Machine auto-clickers have near 0ms standard deviation over consecutive clicks.
    if (clickIntervals.length >= 14) {
      const fastIntervals = clickIntervals.slice(-14)
      const allFast = fastIntervals.every(dt => dt < 140) // only evaluate during rapid clicking

      if (allFast) {
        const mean = fastIntervals.reduce((sum, val) => sum + val, 0) / fastIntervals.length
        const variance = fastIntervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / fastIntervals.length
        const stdDev = Math.sqrt(variance)

        // Human clicking almost always has stdDev > 8-15ms. Software timers have stdDev < 1.8ms.
        if (stdDev < 1.8 && mean < 100) {
          strikes += 2
          console.warn(`[Anti-Cheat] Unnatural click timing regularity: stdDev=${stdDev.toFixed(2)}ms (Strike ${strikes}/3)`)
          if (strikes >= 3) {
            onCheatDetected(`Intervalles de clic artificiellement parfaits détectés (Écart-type: ${stdDev.toFixed(2)}ms).`)
            return false
          }
          return false
        }
      }
    }

    // --- DETECTION 4: Coordinate Stagnation (Exact Pixel Lock) ---
    // Generic auto-clickers click at identical pixels with 0 micro-movements across fast clicks.
    if (clickCoordinates.length >= 18 && clickIntervals.length >= 18) {
      const recentCoords = clickCoordinates.slice(-18)
      const fastClickSequence = clickIntervals.slice(-18).every(dt => dt < 120)

      if (fastClickSequence) {
        const firstX = recentCoords[0].x
        const firstY = recentCoords[0].y
        const allIdentical = recentCoords.every(c => c.x === firstX && c.y === firstY)

        if (allIdentical && (firstX !== 0 || firstY !== 0)) {
          strikes++
          console.warn(`[Anti-Cheat] Static coordinate lock detected across 18 rapid clicks (Strike ${strikes}/3)`)
          if (strikes >= 3) {
            onCheatDetected('Verrouillage absolu des coordonnées de clic sans micro-mouvement physique (Auto-Clicker détecté).')
            return false
          }
          return false
        }
      }
    }

    // Decay strikes slowly if player behaves normally (every 5 seconds)
    if (now - lastViolationTime > 5000 && strikes > 0) {
      strikes = Math.max(0, strikes - 1)
      lastViolationTime = now
    }

    return true
  }

  function reset() {
    clickTimestamps.length = 0
    clickIntervals.length = 0
    clickCoordinates.length = 0
    strikes = 0
  }

  return {
    validateClick,
    reset,
  }
}
