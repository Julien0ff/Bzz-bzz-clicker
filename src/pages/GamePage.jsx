// ===================================================
// GamePage — Main game view (bee + shop + combo gauge)
// ===================================================

import React, { useState } from 'react'
import BeeButton from '../components/Game/BeeButton'
import HoneyCounter from '../components/Game/HoneyCounter'
import UpgradeShop from '../components/Game/UpgradeShop'
import FloatingBees from '../components/Game/FloatingBees'
import GoldenBee from '../components/Game/GoldenBee'
import { useGame, getTalentLevel } from '../contexts/GameContext'
import { useLanguage } from '../contexts/LanguageContext'
import { formatNumber } from '../data/upgrades'

export default function GamePage() {
  const [shopOpen, setShopOpen] = useState(false)
  const {
    totalHoney, honeyPerSecond, clickPower,
    frenzyTimeLeft, clickStormTimeLeft, blessingTimeLeft,
    comboCount, comboTier, prestigeTalents
  } = useGame()
  const { t, language } = useLanguage()

  const hyperFrenzyLevel = getTalentLevel(prestigeTalents, 'hyperFrenzy')
  const frenzyMulti = 7 + (hyperFrenzyLevel * 5)

  const COMBO_TIERS = [
    { threshold: 0,   multiplier: 1,   name: '', color: '#555' },
    { threshold: 10,  multiplier: 1.5, name: 'COMBO x1.5', color: '#5dba3b' },
    { threshold: 25,  multiplier: 2,   name: 'COMBO x2', color: '#ffaa00' },
    { threshold: 50,  multiplier: 3,   name: 'COMBO x3', color: '#ff6600' },
    { threshold: 100, multiplier: 5,   name: language === 'fr' ? '🔥 FIÈVRE x5 🔥' : '🔥 FEVER x5 🔥', color: '#ff0040' },
  ]

  const tierInfo = COMBO_TIERS[comboTier] || COMBO_TIERS[0]
  const nextTier = COMBO_TIERS[comboTier + 1]
  const comboPercent = nextTier
    ? Math.min(100, ((comboCount - tierInfo.threshold) / (nextTier.threshold - tierInfo.threshold)) * 100)
    : 100

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
        {/* Active buff indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', minHeight: '40px' }}>
          {frenzyTimeLeft > 0 && (
            <div className="buff-indicator buff-frenzy">
              {t('frenzy_active', { multi: frenzyMulti })} ({Math.ceil(frenzyTimeLeft)}s) ⚡
            </div>
          )}
          {clickStormTimeLeft > 0 && (
            <div className="buff-indicator buff-storm">
              {t('click_storm_active')} ({Math.ceil(clickStormTimeLeft)}s) 💥
            </div>
          )}
          {blessingTimeLeft > 0 && (
            <div className="buff-indicator buff-blessing">
              {t('blessing_active')} ({Math.ceil(blessingTimeLeft)}s) 👑
            </div>
          )}
        </div>

        <HoneyCounter />
        <BeeButton />

        {/* Combo Gauge */}
        {comboTier > 0 || comboCount > 3 ? (
          <div className="combo-gauge-container">
            <div className="combo-label" style={{ color: tierInfo.color }}>
              {tierInfo.name || (comboCount > 3 ? 'Combo...' : '')}
            </div>
            <div className="combo-bar-bg">
              <div
                className="combo-bar-fill"
                style={{
                  width: `${comboPercent}%`,
                  background: `linear-gradient(90deg, ${tierInfo.color}, ${nextTier?.color || tierInfo.color})`,
                  boxShadow: comboTier >= 3 ? `0 0 15px ${tierInfo.color}` : 'none',
                }}
              />
            </div>
            {nextTier && (
              <div className="combo-next" style={{ color: nextTier.color }}>
                → {nextTier.name}
              </div>
            )}
          </div>
        ) : null}

        {/* Stats bar */}
        <div className="stat-bar">
          <div className="stat-item">
            <div className="stat-value">{formatNumber(Math.floor(totalHoney))}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">+{formatNumber(honeyPerSecond)}</div>
            <div className="stat-label">{t('honey_per_sec')}</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">+{formatNumber(clickPower)}</div>
            <div className="stat-label">{t('click_power')}</div>
          </div>
        </div>

        {/* Mobile shop toggle */}
        <button
          className="mc-button primary shop-toggle-mobile"
          onClick={() => setShopOpen(!shopOpen)}
          id="btn-shop-toggle"
          style={{ marginTop: '8px' }}
        >
          {shopOpen ? '✕ ' + t('settings_close') : t('shop_title')}
        </button>
      </div>

      {/* Upgrade shop panel (right side) */}
      <UpgradeShop isOpen={shopOpen} onToggle={() => setShopOpen(!shopOpen)} />
    </div>
  )
}
