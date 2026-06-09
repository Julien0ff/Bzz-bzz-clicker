import React, { useState } from 'react'
import { useGame } from '../../contexts/GameContext'
import { formatNumber } from '../../data/upgrades'
import { ACHIEVEMENTS } from '../../data/achievements'
import ConfirmModal from '../UI/ConfirmModal'

export default function StatisticsPanel() {
  const gameState = useGame()
  const { totalHoney, honey, totalClicks, playTime, clickPower, honeyPerSecond, upgrades, clickUpgrades, achievements } = gameState

  const [modalOpen, setModalOpen] = useState(false)

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
    <div className="mc-panel stats-container">
      <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', borderBottom: '4px solid var(--mc-border-dark)', paddingBottom: '10px' }}>
        📊 STATISTIQUES AVANCÉES
      </h2>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Colonne 1: Production */}
        <div style={{ flex: 1, minWidth: '280px', background: 'var(--mc-button-bg)', padding: '20px', border: '4px solid var(--mc-border-light)', borderRadius: '2px' }}>
          <h3 style={{ color: 'var(--text-honey)', marginBottom: '20px', fontSize: '11px' }}>🍯 Production</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '8px', lineHeight: '1.4' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Miel en banque :</span>
            <span style={{ color: 'var(--honey-light)' }}>{formatNumber(Math.floor(honey))}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '8px', lineHeight: '1.4' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Miel total (à vie) :</span>
            <span style={{ color: 'var(--honey-light)' }}>{formatNumber(Math.floor(totalHoney))}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '8px', lineHeight: '1.4' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Production par sec :</span>
            <span style={{ color: 'var(--honey-light)' }}>{formatNumber(honeyPerSecond)}/s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '8px', lineHeight: '1.4' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Puissance de clic :</span>
            <span style={{ color: 'var(--honey-light)' }}>{formatNumber(clickPower)}/clic</span>
          </div>
        </div>

        {/* Colonne 2: Activité */}
        <div style={{ flex: 1, minWidth: '280px', background: 'var(--mc-button-bg)', padding: '20px', border: '4px solid var(--mc-border-light)', borderRadius: '2px' }}>
          <h3 style={{ color: 'var(--text-honey)', marginBottom: '20px', fontSize: '11px' }}>⏱️ Activité</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '8px', lineHeight: '1.4' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Temps de jeu total :</span>
            <span style={{ color: 'var(--honey-light)' }}>{formatTime(playTime)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '8px', lineHeight: '1.4' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Clics effectués :</span>
            <span style={{ color: 'var(--honey-light)' }}>{totalClicks?.toLocaleString('fr-FR') || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '8px', lineHeight: '1.4' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Bâtiments possédés :</span>
            <span style={{ color: 'var(--honey-light)' }}>{totalBuildings}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '8px', lineHeight: '1.4' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Amél. de clics achetées :</span>
            <span style={{ color: 'var(--honey-light)' }}>{totalClickUpgrades}</span>
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
        </div>

        <p style={{ fontSize: '8px', color: 'var(--text-dim)', marginBottom: '15px', lineHeight: '1.4' }}>
          L'Ascension réinitialise votre miel, vos bâtiments et améliorations, mais vous conservez vos statistiques, succès et votre Miel Total à vie. <br/>
          Vous obtiendrez de la <span style={{ color: 'var(--honey-light)' }}>Gelée Royale</span> permanente en sacrifiant votre <b>Miel en Banque actuel</b> !
        </p>

        {(() => {
          const jellyEarned = Math.floor(Math.cbrt(gameState.honey / 100000000))
          
          // Cost for the NEXT jelly: (jellyEarned + 1)^3 * 100M
          const nextJellyTarget = Math.pow(jellyEarned + 1, 3) * 100000000

          if (jellyEarned > 0) {
            return (
              <button 
                className="mc-button primary" 
                style={{ width: '100%', padding: '15px', fontSize: '10px', animation: 'buttonPulse 2s infinite' }}
                onClick={() => setModalOpen(true)}
              >
                Faire une Ascension (+{jellyEarned} 👑)
              </button>
            )
          } else {
            return (
              <button className="mc-button" disabled style={{ width: '100%' }}>
                Nécessite {formatNumber(nextJellyTarget)} Miel en Banque<br/>
                <span style={{ fontSize: '8px', opacity: 0.8 }}>
                  (Actuel: {formatNumber(Math.floor(gameState.honey))})
                </span>
              </button>
            )
          }
        })()}
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        title="Confirmation d'Ascension"
        message={`Êtes-vous sûr de vouloir faire une Ascension ?\n\nVous perdrez votre miel actuel et vos bâtiments, mais vous gagnerez ${Math.floor(Math.cbrt(gameState.honey / 100000000))} Gelée(s) Royale(s) !\n\nCela augmentera votre production permanente !`}
        onConfirm={() => {
          gameState.dispatch({ type: 'PRESTIGE' })
          setModalOpen(false)
        }}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  )
}
