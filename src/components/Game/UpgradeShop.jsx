// ===================================================
// UpgradeShop — Side panel with tabs for upgrades
// ===================================================

import React, { useState } from 'react'
import { useGame } from '../../contexts/GameContext'
import { PRODUCTION_UPGRADES, CLICK_UPGRADES, SYNERGY_UPGRADES, getUpgradeCost, getClickUpgradeCost, getSynergyCost, getMilestoneMultiplier, BUILDING_MILESTONES, formatNumber } from '../../data/upgrades'
import UpgradeItem from './UpgradeItem'

export default function UpgradeShop({ isOpen, onToggle }) {
  const [activeTab, setActiveTab] = useState('production')
  const { upgrades, clickUpgrades, synergyUpgrades, honey, buySynergyUpgrade } = useGame()

  return (
    <div className={`shop-panel ${isOpen ? 'open' : ''}`} id="shop-panel">
      <div className="shop-header" style={{ position: 'relative' }}>
        <h2>⚒️ BOUTIQUE</h2>
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
          🏠 Prod
        </button>
        <button
          className={`shop-tab ${activeTab === 'click' ? 'active' : ''}`}
          onClick={() => setActiveTab('click')}
          id="tab-click"
        >
          🖱️ Clic
        </button>
        <button
          className={`shop-tab ${activeTab === 'synergy' ? 'active' : ''}`}
          onClick={() => setActiveTab('synergy')}
          id="tab-synergy"
        >
          🔬 Syner.
        </button>
      </div>

      <div className="shop-items">
        {activeTab === 'production' && PRODUCTION_UPGRADES.map(upgrade => {
          const count = upgrades[upgrade.id] || 0
          const cost = getUpgradeCost(upgrade, count)
          const milestone = getMilestoneMultiplier(count)
          const nextMilestone = BUILDING_MILESTONES.find(m => count < m)
          
          return (
            <div key={upgrade.id}>
              <UpgradeItem
                upgrade={upgrade}
                cost={cost}
                count={count}
                type="production"
              />
              {/* Milestone indicator */}
              {nextMilestone && count > 0 && (
                <div style={{
                  fontSize: '6px',
                  color: 'var(--text-dim)',
                  textAlign: 'right',
                  padding: '2px 10px 0',
                  marginTop: '-4px',
                }}>
                  Prochain palier : {nextMilestone} (x{milestone * 2})
                </div>
              )}
              {milestone > 1 && (
                <div style={{
                  fontSize: '6px',
                  color: 'var(--can-afford)',
                  textAlign: 'right',
                  padding: '0 10px 4px',
                }}>
                  ⭐ Palier actif : x{milestone}
                </div>
              )}
            </div>
          )
        })}

        {activeTab === 'click' && CLICK_UPGRADES.map(upgrade => {
          const count = clickUpgrades[upgrade.id] || 0
          const cost = getClickUpgradeCost(upgrade, count)
          return (
            <UpgradeItem
              key={upgrade.id}
              upgrade={{
                ...upgrade,
                // Show HPS synergy info in description
                description: upgrade.hpsPercent > 0
                  ? `${upgrade.description} (+${upgrade.hpsPercent}% du Miel/sec par clic)`
                  : upgrade.description
              }}
              cost={cost}
              count={count}
              type="click"
            />
          )
        })}

        {activeTab === 'synergy' && (
          <>
            <div style={{
              textAlign: 'center',
              fontSize: '7px',
              color: 'var(--text-secondary)',
              padding: '8px',
              marginBottom: '8px',
              background: 'rgba(255,255,255,0.03)',
              border: '2px solid var(--mc-border-dark)',
            }}>
              🔬 Les synergies améliorent vos bâtiments en les connectant entre eux.
            </div>
            {SYNERGY_UPGRADES.map(synergy => {
              const count = synergyUpgrades?.[synergy.id] || 0
              const cost = getSynergyCost(synergy, count)
              const canAfford = honey >= cost
              const isMaxed = synergy.maxCount && count >= synergy.maxCount

              // Check if source building is owned
              const sourceCount = upgrades[synergy.sourceBuilding] || 0
              const sourceName = PRODUCTION_UPGRADES.find(u => u.id === synergy.sourceBuilding)?.name || '???'
              const targetName = synergy.targetBuilding ? PRODUCTION_UPGRADES.find(u => u.id === synergy.targetBuilding)?.name : null

              return (
                <div
                  key={synergy.id}
                  className={`upgrade-item ${isMaxed ? '' : canAfford ? 'can-afford' : 'cannot-afford'}`}
                  onClick={() => !isMaxed && canAfford && buySynergyUpgrade(synergy.id)}
                  style={{ opacity: isMaxed ? 0.5 : undefined }}
                >
                  <div className="upgrade-icon">{synergy.icon}</div>
                  <div className="upgrade-info">
                    <div className="upgrade-name">{synergy.name}</div>
                    <div className="upgrade-effect">{synergy.description}</div>
                    {sourceCount > 0 && targetName && synergy.bonusPerSource && (
                      <div style={{ fontSize: '6px', color: 'var(--can-afford)' }}>
                        Bonus actuel : +{(sourceCount * synergy.bonusPerSource * 100).toFixed(0)}% sur {targetName}
                      </div>
                    )}
                    {!isMaxed && (
                      <div className="upgrade-cost">
                        🍯 {formatNumber(cost)}
                      </div>
                    )}
                  </div>
                  <div className="upgrade-count">
                    {isMaxed ? '✅' : `${count}/${synergy.maxCount}`}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
