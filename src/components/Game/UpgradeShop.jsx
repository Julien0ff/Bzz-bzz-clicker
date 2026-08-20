// ===================================================
// UpgradeShop — Side panel with tabs for upgrades
// ===================================================

import React, { useState } from 'react'
import { useGame, getGlobalDiscount } from '../../contexts/GameContext'
import { useLanguage } from '../../contexts/LanguageContext'
import {
  PRODUCTION_UPGRADES,
  CLICK_UPGRADES,
  SYNERGY_UPGRADES,
  getUpgradeCost,
  getClickUpgradeCost,
  getSynergyCost,
  getMilestoneMultiplier,
  BUILDING_MILESTONES,
  formatNumber,
} from '../../data/upgrades'
import UpgradeItem from './UpgradeItem'

export default function UpgradeShop({ isOpen, onToggle }) {
  const [activeTab, setActiveTab] = useState('production')
  const { upgrades, clickUpgrades, synergyUpgrades, prestigeTalents, honey, buySynergyUpgrade } = useGame()
  const { t, getLocalized } = useLanguage()

  const discount = getGlobalDiscount(prestigeTalents, synergyUpgrades, upgrades)

  return (
    <div className={`shop-panel ${isOpen ? 'open' : ''}`} id="shop-panel">
      <div className="shop-header" style={{ position: 'relative' }}>
        <h2>{t('shop_title')}</h2>
        <button
          className="mc-button danger shop-toggle-mobile"
          onClick={onToggle}
          style={{ position: 'absolute', top: '10px', right: '10px', padding: '6px 10px' }}
        >
          ✕
        </button>
      </div>

      <div className="shop-tabs">
        <button
          className={`shop-tab ${activeTab === 'production' ? 'active' : ''}`}
          onClick={() => setActiveTab('production')}
          id="tab-production"
        >
          {t('tab_production')}
        </button>
        <button
          className={`shop-tab ${activeTab === 'click' ? 'active' : ''}`}
          onClick={() => setActiveTab('click')}
          id="tab-click"
        >
          {t('tab_click')}
        </button>
        <button
          className={`shop-tab ${activeTab === 'synergy' ? 'active' : ''}`}
          onClick={() => setActiveTab('synergy')}
          id="tab-synergy"
        >
          {t('tab_synergy')}
        </button>
      </div>

      <div className="shop-items">
        {activeTab === 'production' &&
          PRODUCTION_UPGRADES.map((upgrade) => {
            const count = upgrades[upgrade.id] || 0
            const cost = getUpgradeCost(upgrade, count, discount)
            const milestoneBoost = (prestigeTalents?.['milestonePower'] || 0) > 0 ? 2.5 : 2
            const milestone = getMilestoneMultiplier(count, milestoneBoost)
            const nextMilestone = BUILDING_MILESTONES.find((m) => count < m)

            return (
              <UpgradeItem
                key={upgrade.id}
                upgrade={upgrade}
                cost={cost}
                count={count}
                type="production"
                milestone={milestone}
                nextMilestone={nextMilestone}
              />
            )
          })}

        {activeTab === 'click' &&
          CLICK_UPGRADES.map((upgrade) => {
            const count = clickUpgrades[upgrade.id] || 0
            const cost = getClickUpgradeCost(upgrade, count, discount)
            return (
              <UpgradeItem
                key={upgrade.id}
                upgrade={upgrade}
                cost={cost}
                count={count}
                type="click"
              />
            )
          })}

        {activeTab === 'synergy' && (
          <>
            <div
              style={{
                textAlign: 'center',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                padding: '8px 10px',
                marginBottom: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '2px solid var(--mc-border-dark)',
                lineHeight: '1.3',
              }}
              className="synergy-banner"
            >
              {t('synergy_banner')}
            </div>
            {SYNERGY_UPGRADES.map((synergy) => {
              const count = synergyUpgrades?.[synergy.id] || 0
              const cost = getSynergyCost(synergy, count)
              const canAfford = honey >= cost
              const isMaxed = synergy.maxCount && count >= synergy.maxCount

              const sourceCount = upgrades[synergy.sourceBuilding] || 0
              const targetUpgrade = synergy.targetBuilding
                ? PRODUCTION_UPGRADES.find((u) => u.id === synergy.targetBuilding)
                : null
              const targetName = targetUpgrade ? getLocalized(targetUpgrade, 'name') : null

              const synName = getLocalized(synergy, 'name')
              const synDesc = getLocalized(synergy, 'description')

              return (
                <div
                  key={synergy.id}
                  className={`upgrade-item ${isMaxed ? '' : canAfford ? 'can-afford' : 'cannot-afford'}`}
                  onClick={() => !isMaxed && canAfford && buySynergyUpgrade(synergy.id)}
                  style={{ opacity: isMaxed ? 0.55 : undefined }}
                >
                  <div className="upgrade-icon">{synergy.icon}</div>
                  <div className="upgrade-info">
                    <div className="upgrade-name">{synName}</div>
                    <div className="upgrade-effect synergy-desc">{synDesc}</div>
                    {sourceCount > 0 && targetName && synergy.bonusPerSource && (
                      <div style={{ fontSize: '10px', color: 'var(--can-afford)', marginTop: '2px', fontWeight: 'bold' }}>
                        {t('active_bonus')} +{(sourceCount * synergy.bonusPerSource * 100).toFixed(0)}% {t('on_target')} {targetName}
                      </div>
                    )}
                    {!isMaxed && (
                      <div className="upgrade-cost">🍯 {formatNumber(cost)}</div>
                    )}
                  </div>
                  <div className="upgrade-count">{isMaxed ? '✅' : `${count}/${synergy.maxCount}`}</div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
