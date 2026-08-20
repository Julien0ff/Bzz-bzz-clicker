// ===================================================
// UpgradeItem — Individual upgrade in the shop
// ===================================================

import React from 'react'
import { useGame } from '../../contexts/GameContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { formatNumber } from '../../data/upgrades'

export default function UpgradeItem({ upgrade, cost, count, type, milestone = 1, nextMilestone = null }) {
  const { honey, buyProductionUpgrade, buyClickUpgrade } = useGame()
  const { t, getLocalized } = useLanguage()

  const canAfford = honey >= cost
  const maxedOut = upgrade.maxCount && count >= upgrade.maxCount
  const name = getLocalized(upgrade, 'name')
  const description = getLocalized(upgrade, 'description')

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
      title={description}
    >
      <div className="upgrade-icon">{upgrade.icon}</div>
      <div className="upgrade-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span className="upgrade-name">{name}</span>
          {milestone > 1 && (
            <span className="milestone-badge" title={t('milestone_tooltip', { multi: milestone })}>
              {t('milestone_badge', { multi: milestone })}
            </span>
          )}
        </div>
        <div className="upgrade-effect">
          {type === 'production'
            ? `+${formatNumber(upgrade.baseProduction * milestone)}/s`
            : `+${formatNumber(upgrade.clickBonus)}/clic${upgrade.hpsPercent > 0 ? ` (+${upgrade.hpsPercent}% HPS)` : ''}`
          }
          {nextMilestone && count > 0 && (
            <span style={{ opacity: 0.65, fontSize: '10px', marginLeft: '6px' }}>
              ({count}/{nextMilestone} → x{milestone * 2})
            </span>
          )}
        </div>
        <div className="upgrade-cost">
          {maxedOut ? t('max_reached') : `🍯 ${formatNumber(cost)}`}
        </div>
      </div>
      <div className="upgrade-count">{count}</div>
    </div>
  )
}
