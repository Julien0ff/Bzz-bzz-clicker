// ===================================================
// UpgradeItem — Individual upgrade in the shop
// ===================================================

import React from 'react'
import { useGame } from '../../contexts/GameContext'
import { formatNumber } from '../../data/upgrades'

export default function UpgradeItem({ upgrade, cost, count, type, milestone = 1, nextMilestone = null }) {
  const { honey, buyProductionUpgrade, buyClickUpgrade } = useGame()

  const canAfford = honey >= cost
  const maxedOut = upgrade.maxCount && count >= upgrade.maxCount

  const handleClick = () => {
    if (maxedOut) return
    if (type === 'production') {
      buyProductionUpgrade(upgrade.id)
    } else {
      buyClickUpgrade(upgrade.id)
    }
  }

  return (
    <div
      className={`upgrade-item ${canAfford && !maxedOut ? 'can-afford' : 'cannot-afford'}`}
      onClick={handleClick}
      id={`upgrade-${upgrade.id}`}
      title={upgrade.description}
    >
      <div className="upgrade-icon">{upgrade.icon}</div>
      <div className="upgrade-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span className="upgrade-name">{upgrade.name}</span>
          {milestone > 1 && (
            <span className="milestone-badge" title={`Multiplicateur de palier : x${milestone}`}>
              x{milestone}
            </span>
          )}
        </div>
        <div className="upgrade-effect">
          {type === 'production'
            ? `+${formatNumber(upgrade.baseProduction * milestone)}/s`
            : `+${formatNumber(upgrade.clickBonus)}/clic`
          }
          {nextMilestone && count > 0 && (
            <span style={{ opacity: 0.65, fontSize: '10px', marginLeft: '6px' }}>
              ({count}/{nextMilestone} → x{milestone * 2})
            </span>
          )}
        </div>
        <div className="upgrade-cost">
          {maxedOut ? 'MAX' : `🍯 ${formatNumber(cost)}`}
        </div>
      </div>
      <div className="upgrade-count">{count}</div>
    </div>
  )
}
