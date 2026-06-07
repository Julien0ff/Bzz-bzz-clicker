import React from 'react'
import { useGame } from '../../contexts/GameContext'
import { formatNumber } from '../../data/upgrades'
import { ACHIEVEMENTS } from '../../data/achievements'

export default function StatisticsPanel() {
  const { totalHoney, honey, totalClicks, playTime, clickPower, honeyPerSecond, upgrades, clickUpgrades, achievements } = useGame()

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
  const estimatedManual = totalClicks * (clickPower > 1 ? clickPower / 2 : 1) // Rough estimation
  const manualPercent = totalHoney > 0 ? Math.min(100, (estimatedManual / totalHoney) * 100).toFixed(1) : 0
  const passivePercent = (100 - manualPercent).toFixed(1)

  const unlockedAchCount = achievements?.length || 0

  return (
    <div className="mc-panel" style={{ margin: '20px auto', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
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
          <div style={{ width: `${manualPercent}%`, background: '#ffaa00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {manualPercent > 10 ? 'Manuel' : ''}
          </div>
          <div style={{ width: `${passivePercent}%`, background: '#8b5a00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {passivePercent > 10 ? 'Passif' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '8px', color: 'var(--text-secondary)' }}>
          <span>{manualPercent}% manuel</span>
          <span>{passivePercent}% passif</span>
        </div>
      </div>

      {/* --- Section Succès --- */}
      <div style={{ background: 'var(--mc-button-bg)', padding: '15px', border: '4px solid var(--mc-border-light)', borderRadius: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ color: 'var(--text-honey)', fontSize: '10px' }}>🏆 SUCCÈS DÉVERROUILLÉS ({unlockedAchCount}/{ACHIEVEMENTS.length})</h3>
          <span style={{ fontSize: '8px', color: 'var(--can-afford)' }}>+{unlockedAchCount}% Production Globale</span>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {ACHIEVEMENTS.map(ach => {
            const isUnlocked = achievements?.includes(ach.id)
            return (
              <div 
                key={ach.id} 
                title={ach.description}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: isUnlocked ? 'var(--bg-panel-inner)' : 'rgba(0,0,0,0.3)',
                  padding: '8px',
                  border: `2px solid ${isUnlocked ? 'var(--honey-dark)' : 'var(--mc-border-dark)'}`,
                  opacity: isUnlocked ? 1 : 0.4,
                  borderRadius: '2px',
                  width: 'calc(50% - 5px)',
                  cursor: 'help'
                }}
              >
                <span style={{ fontSize: '16px' }}>{isUnlocked ? ach.icon : '🔒'}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '8px', color: isUnlocked ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                    {isUnlocked ? ach.name : '???'}
                  </span>
                  <span style={{ fontSize: '6px', color: 'var(--text-secondary)' }}>
                    {isUnlocked ? ach.description : 'Succès verrouillé'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* --- Section Prestige --- */}
      <div style={{ background: 'var(--bg-panel-hover)', padding: '15px', border: '4px solid var(--honey-dark)', borderRadius: '2px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--honey-light)', fontSize: '12px', marginBottom: '10px' }}>🌌 ASCENSION (PRESTIGE)</h3>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px' }}>
          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '4px', border: '2px solid var(--mc-border-dark)' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Gelée Royale Possédée</span>
            <div style={{ fontSize: '16px', color: 'var(--text-primary)', marginTop: '5px' }}>{gameState.royalJelly || 0} 👑</div>
            <span style={{ fontSize: '8px', color: 'var(--can-afford)' }}>+{((gameState.royalJelly || 0) * 10)}% Prod Globale</span>
          </div>
        </div>

        <p style={{ fontSize: '8px', color: 'var(--text-dim)', marginBottom: '15px', lineHeight: '1.4' }}>
          L'Ascension réinitialise votre miel, vos bâtiments et améliorations, mais vous conservez vos statistiques, succès et votre Miel Total à vie. <br/>
          Pour chaque tranche de progression après 10 Millions, vous recevrez de la <span style={{ color: 'var(--honey-light)' }}>Gelée Royale</span> permanente !
        </p>

        {gameState.totalHoney >= 10000000 ? (
          <button 
            className="mc-button primary" 
            style={{ width: '100%', padding: '15px', fontSize: '10px', animation: 'pulseGlow 2s infinite' }}
            onClick={() => {
              const jellyEarned = Math.floor(Math.sqrt(gameState.totalHoney / 10000000))
              if (window.confirm(`Êtes-vous sûr de vouloir faire une Ascension ?\n\nVous perdrez votre miel actuel et vos bâtiments, mais vous gagnerez ${jellyEarned} Gelée(s) Royale(s) !\n\nCela augmentera votre production permanente de +${jellyEarned * 10}% !`)) {
                gameState.dispatch({ type: 'PRESTIGE' })
              }
            }}
          >
            Faire une Ascension (+{Math.floor(Math.sqrt(gameState.totalHoney / 10000000))} 👑)
          </button>
        ) : (
          <button className="mc-button" disabled style={{ width: '100%' }}>
            Nécessite 10 000 000 Miel Total (Actuel: {formatNumber(Math.floor(gameState.totalHoney))})
          </button>
        )}
      </div>
    </div>
  )
}
