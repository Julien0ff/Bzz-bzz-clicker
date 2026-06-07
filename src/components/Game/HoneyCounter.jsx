// ===================================================
// HoneyCounter — Displays honey count and per-second rate
// ===================================================

import React from 'react'
import { useGame } from '../../contexts/GameContext'
import { formatNumber } from '../../data/upgrades'

export default function HoneyCounter() {
  const { honey, honeyPerSecond, clickPower } = useGame()

  return (
    <div className="honey-counter" id="honey-counter">
      <div className="honey-amount">
        🍯 {formatNumber(Math.floor(honey))}
      </div>
      <div className="honey-label">MIEL</div>
      {honeyPerSecond > 0 && (
        <div className="honey-per-second">
          +{formatNumber(honeyPerSecond)}/sec
        </div>
      )}
      <div className="cps-badge">
        Clic : +{formatNumber(clickPower)} miel
      </div>
    </div>
  )
}
