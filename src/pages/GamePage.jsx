// ===================================================
// GamePage — Main game view (bee + shop)
// ===================================================

import React, { useState } from 'react'
import BeeButton from '../components/Game/BeeButton'
import HoneyCounter from '../components/Game/HoneyCounter'
import UpgradeShop from '../components/Game/UpgradeShop'
import FloatingBees from '../components/Game/FloatingBees'
import { useGameLoop } from '../hooks/useGameLoop'
import { useSaveGame } from '../hooks/useSaveGame'
import { useGame } from '../contexts/GameContext'
import { formatNumber } from '../data/upgrades'

export default function GamePage() {
  const [shopOpen, setShopOpen] = useState(false)
  const { totalHoney, honeyPerSecond, clickPower } = useGame()

  // Start the game loop for passive production
  useGameLoop()

  // Start auto-save
  useSaveGame()

  return (
    <div className="app-container">
      {/* Hex background pattern */}
      <div className="hex-bg" />

      {/* Floating bees in background */}
      <FloatingBees />

      {/* Main game area */}
      <div className="game-area">
        <HoneyCounter />
        <BeeButton />

        {/* Stats bar */}
        <div className="stat-bar">
          <div className="stat-item">
            <div className="stat-value">{formatNumber(Math.floor(totalHoney))}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">+{formatNumber(honeyPerSecond)}</div>
            <div className="stat-label">Par sec</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">+{formatNumber(clickPower)}</div>
            <div className="stat-label">Par clic</div>
          </div>
        </div>

        {/* Mobile shop toggle */}
        <button
          className="mc-button primary shop-toggle-mobile"
          onClick={() => setShopOpen(!shopOpen)}
          id="btn-shop-toggle"
          style={{ marginTop: '8px' }}
        >
          {shopOpen ? '✕ Fermer' : '⚒️ Boutique'}
        </button>
      </div>

      {/* Upgrade shop panel (right side) */}
      <UpgradeShop isOpen={shopOpen} onToggle={() => setShopOpen(!shopOpen)} />
    </div>
  )
}
