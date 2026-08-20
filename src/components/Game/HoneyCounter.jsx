// ===================================================
// HoneyCounter — Displays honey count and per-second rate
// ===================================================

import React from 'react'
import { useGame } from '../../contexts/GameContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { formatNumber } from '../../data/upgrades'

export default function HoneyCounter() {
  const { honey, honeyPerSecond, clickPower } = useGame()
  const { t } = useLanguage()

  return (
    <div className="honey-counter" id="honey-counter">
      <div className="honey-amount">
        🍯 {formatNumber(Math.floor(honey))}
      </div>
      <div className="honey-label">{t('honey').toUpperCase()}</div>
      {honeyPerSecond > 0 && (
        <div className="honey-per-second">
          +{formatNumber(honeyPerSecond)}{t('honey_per_sec')}
        </div>
      )}
      <div className="cps-badge">
        {t('click_power')} : +{formatNumber(clickPower)} {t('honey').toLowerCase()}
      </div>
    </div>
  )
}
