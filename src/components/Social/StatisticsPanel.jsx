import React from 'react'
import { useGame } from '../../contexts/GameContext'
import { formatNumber } from '../../data/upgrades'

export default function StatisticsPanel() {
  const { totalHoney, honey, totalClicks, playTime, clickPower, honeyPerSecond, upgrades, clickUpgrades } = useGame()

  // Helper to format play time in seconds to HH:MM:SS
  const formatTime = (seconds) => {
    if (!seconds) return '00:00:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Calculate total buildings owned
  const totalBuildings = Object.values(upgrades).reduce((sum, val) => sum + val, 0)
  
  // Calculate total click upgrades owned
  const totalClickUpgrades = Object.values(clickUpgrades).reduce((sum, val) => sum + val, 0)

  // Calculate percentage of honey produced passively vs manually
  // This is an estimation: we know totalClicks * clickPower gives manual honey.
  // But clickPower changes over time. So we just show a fun estimation.
  const estimatedManual = totalClicks * (clickPower > 1 ? clickPower / 2 : 1) // Rough estimation
  const manualPercent = totalHoney > 0 ? Math.min(100, (estimatedManual / totalHoney) * 100).toFixed(1) : 0
  const passivePercent = (100 - manualPercent).toFixed(1)

  return (
    <div className="mc-panel" style={{ margin: '20px auto', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', borderBottom: '4px solid var(--mc-border-dark)', paddingBottom: '10px' }}>
        📊 STATISTIQUES AVANCÉES
      </h2>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Colonne 1: Production */}
        <div style={{ flex: 1, minWidth: '250px', background: 'var(--mc-button-bg)', padding: '15px', border: '4px solid var(--mc-border-light)', borderRadius: '2px' }}>
          <h3 style={{ color: 'var(--text-honey)', marginBottom: '15px', fontSize: '10px' }}>🍯 Production</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '9px' }}>
            <span>Miel en banque :</span>
            <span style={{ color: 'var(--text-light)' }}>{formatNumber(Math.floor(honey))}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '9px' }}>
            <span>Miel total (à vie) :</span>
            <span style={{ color: 'var(--text-light)' }}>{formatNumber(Math.floor(totalHoney))}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '9px' }}>
            <span>Production par sec :</span>
            <span style={{ color: 'var(--text-light)' }}>{formatNumber(honeyPerSecond)}/s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '9px' }}>
            <span>Puissance de clic :</span>
            <span style={{ color: 'var(--text-light)' }}>{formatNumber(clickPower)}/clic</span>
          </div>
        </div>

        {/* Colonne 2: Activité */}
        <div style={{ flex: 1, minWidth: '250px', background: 'var(--mc-button-bg)', padding: '15px', border: '4px solid var(--mc-border-light)', borderRadius: '2px' }}>
          <h3 style={{ color: 'var(--text-honey)', marginBottom: '15px', fontSize: '10px' }}>⏱️ Activité</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '9px' }}>
            <span>Temps de jeu total :</span>
            <span style={{ color: 'var(--text-light)' }}>{formatTime(playTime)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '9px' }}>
            <span>Clics effectués :</span>
            <span style={{ color: 'var(--text-light)' }}>{totalClicks?.toLocaleString('fr-FR') || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '9px' }}>
            <span>Bâtiments possédés :</span>
            <span style={{ color: 'var(--text-light)' }}>{totalBuildings}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '9px' }}>
            <span>Amél. de clics achetées :</span>
            <span style={{ color: 'var(--text-light)' }}>{totalClickUpgrades}</span>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--mc-button-bg)', padding: '15px', border: '4px solid var(--mc-border-light)', borderRadius: '2px' }}>
        <h3 style={{ color: 'var(--text-honey)', marginBottom: '15px', fontSize: '10px' }}>🐝 Miel Manuel vs Passif</h3>
        <div style={{ display: 'flex', height: '24px', background: '#333', border: '2px solid #000', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${manualPercent}%`, background: '#ffaa00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>
            {manualPercent > 10 ? 'Manuel' : ''}
          </div>
          <div style={{ width: `${passivePercent}%`, background: '#8b5a00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>
            {passivePercent > 10 ? 'Passif' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '8px', color: 'var(--text-secondary)' }}>
          <span>{manualPercent}% manuel</span>
          <span>{passivePercent}% passif</span>
        </div>
      </div>
    </div>
  )
}
