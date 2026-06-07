// ===================================================
// GamePage — Main game view (bee + shop)
// ===================================================

import React, { useState } from 'react'
import BeeButton from '../components/Game/BeeButton'
import HoneyCounter from '../components/Game/HoneyCounter'
import UpgradeShop from '../components/Game/UpgradeShop'
import FloatingBees from '../components/Game/FloatingBees'
import GoldenBee from '../components/Game/GoldenBee'
import { useGame } from '../contexts/GameContext'
import { formatNumber } from '../data/upgrades'

export default function GamePage() {
  const [shopOpen, setShopOpen] = useState(false)
  const { totalHoney, honeyPerSecond, clickPower, frenzyTimeLeft } = useGame()

  // Removed useGameLoop and useSaveGame from here.
  // They are now handled globally in App.jsx (GameEngine) so that progress
  // doesn't stop and reset when viewing the leaderboard.

  return (
    <div className="app-container">
      {/* Hex background pattern */}
      <div className="hex-bg" />

      {/* Floating bees in background */}
      <FloatingBees />
      
      {/* Golden bee spawn system */}
      <GoldenBee />

      {/* Main game area */}
      <div className="game-area">
        {frenzyTimeLeft > 0 && (
          <div style={{ color: '#ffaa00', fontSize: '14px', animation: 'pulseGlow 1s infinite', textShadow: '2px 2px 0 #000', marginBottom: '10px' }}>
            ⚡ FRENZY x7 ({Math.ceil(frenzyTimeLeft)}s) ⚡
          </div>
        )}
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
