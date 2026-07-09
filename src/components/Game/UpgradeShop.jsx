// ===================================================
// UpgradeShop — Side panel with tabs for upgrades
// ===================================================

import React, { useState } from 'react'
import { useGame } from '../../contexts/GameContext'
import { PRODUCTION_UPGRADES, CLICK_UPGRADES, getUpgradeCost, getClickUpgradeCost } from '../../data/upgrades'
import UpgradeItem from './UpgradeItem'

export default function UpgradeShop({ isOpen, onToggle }) {
  const [activeTab, setActiveTab] = useState('production')
  const { upgrades, clickUpgrades } = useGame()

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
          🏠 Production
        </button>
        <button
          className={`shop-tab ${activeTab === 'click' ? 'active' : ''}`}
          onClick={() => setActiveTab('click')}
          id="tab-click"
        >
          🖱️ Clic
        </button>
      </div>

      <div className="shop-items">
        {activeTab === 'production' && PRODUCTION_UPGRADES.map(upgrade => {
          const count = upgrades[upgrade.id] || 0
          const cost = getUpgradeCost(upgrade, count)
          return (
            <UpgradeItem
              key={upgrade.id}
              upgrade={upgrade}
              cost={cost}
              count={count}
              type="production"
            />
          )
        })}

        {activeTab === 'click' && CLICK_UPGRADES.map(upgrade => {
          const count = clickUpgrades[upgrade.id] || 0
          const cost = getClickUpgradeCost(upgrade, count)
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
      </div>
    </div>
  )
}
