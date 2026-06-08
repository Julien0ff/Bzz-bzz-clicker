// ===================================================
// UpgradeItem — Individual upgrade in the shop
// ===================================================

import React from 'react'
import { useGame } from '../../contexts/GameContext'
import { formatNumber } from '../../data/upgrades'

export default function UpgradeItem({ upgrade, cost, count, type }) {
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
        <div className="upgrade-name">{upgrade.name}</div>
        <div className="upgrade-effect">
          {type === 'production'
            ? `+${formatNumber(upgrade.baseProduction)}/sec`
            : `+${formatNumber(upgrade.clickBonus)}/clic`
          }
        </div>
        <div className="upgrade-cost">
          {maxedOut ? 'MAX' : `🍯 ${formatNumber(cost)}`}
        </div>
      </div>
      <div className="upgrade-count">{count}</div>
    </div>
  )
}
