import React, { useState } from 'react'
import { useGame } from '../../contexts/GameContext'
import { formatNumber, PRESTIGE_TALENTS } from '../../data/upgrades'
import { ACHIEVEMENTS } from '../../data/achievements'
import ConfirmModal from '../UI/ConfirmModal'

export default function StatisticsPanel() {
  const gameState = useGame()
  const { totalHoney, honey, totalClicks, playTime, clickPower, honeyPerSecond, upgrades, clickUpgrades, synergyUpgrades, achievements, royalJelly, prestigeTalents } = gameState

  const [modalOpen, setModalOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('stats') // 'stats' or 'prestige'

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

  // Calculate total synergy upgrades
  const totalSynergies = Object.values(synergyUpgrades || {}).reduce((sum, val) => sum + val, 0)

  // Calculate percentage of honey produced passively vs manually
  const estimatedManual = totalClicks * (clickPower > 1 ? clickPower / 2 : 1)
  const manualPercent = totalHoney > 0 ? Math.min(100, (estimatedManual / totalHoney) * 100).toFixed(1) : 0
  const passivePercent = (100 - manualPercent).toFixed(1)

  const unlockedAchCount = achievements?.length || 0

  // Prestige calculation (based on totalHoney now!)
  const jellyBonusLevel = prestigeTalents?.['jellyHarvest'] || 0
  const jellyBonusMulti = 1 + (jellyBonusLevel * 0.10)
  const jellyEarned = Math.floor(Math.cbrt(totalHoney / 100000000) * jellyBonusMulti)

  return (
    <div className="mc-panel stats-container">
      {/* Tab selector */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '4px solid var(--mc-border-dark)' }}>
        <button
          className={`shop-tab ${activeSection === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveSection('stats')}
          style={{ flex: 1 }}
        >
          📊 Stats
        </button>
        <button
          className={`shop-tab ${activeSection === 'prestige' ? 'active' : ''}`}
          onClick={() => setActiveSection('prestige')}
          style={{ flex: 1 }}
        >
          🌌 Prestige
        </button>
      </div>

      {activeSection === 'stats' && (
        <>
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
                <span style={{ color: 'var(--text-secondary)' }}>Amél. de clics :</span>
                <span style={{ color: 'var(--honey-light)' }}>{totalClickUpgrades}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '8px', lineHeight: '1.4' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Synergies actives :</span>
                <span style={{ color: 'var(--honey-light)' }}>{totalSynergies}</span>
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
              <h3 style={{ color: 'var(--text-honey)', fontSize: '10px' }}>🏆 SUCCÈS ({unlockedAchCount}/{ACHIEVEMENTS.length})</h3>
              <span style={{ fontSize: '8px', color: 'var(--can-afford)' }}>+{unlockedAchCount}% Prod</span>
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
        </>
      )}

      {activeSection === 'prestige' && (
        <>
          {/* --- Section Prestige Ascension --- */}
          <div style={{ background: 'var(--bg-panel-hover)', padding: '15px', border: '4px solid var(--honey-dark)', borderRadius: '2px', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--honey-light)', fontSize: '12px', marginBottom: '10px' }}>🌌 ASCENSION (PRESTIGE)</h3>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px' }}>
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '4px', border: '2px solid var(--mc-border-dark)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Gelée Royale</span>
                <div style={{ fontSize: '16px', color: 'var(--text-primary)', marginTop: '5px' }}>{royalJelly || 0} 👑</div>
                <span style={{ fontSize: '8px', color: 'var(--can-afford)' }}>+{((royalJelly || 0) * 10)}% Prod</span>
              </div>
            </div>

            <p style={{ fontSize: '8px', color: 'var(--text-dim)', marginBottom: '15px', lineHeight: '1.4' }}>
              L'Ascension réinitialise votre miel et bâtiments, mais vous conservez vos stats, succès, talents de prestige et Miel Total à vie. <br/>
              Gain basé sur votre <span style={{ color: 'var(--honey-light)' }}>Miel Total à Vie</span>.
            </p>

            {(() => {
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
                    Nécessite plus de Miel Total<br/>
                    <span style={{ fontSize: '8px', opacity: 0.8 }}>
                      (Actuel: {formatNumber(Math.floor(totalHoney))})
                    </span>
                  </button>
                )
              }
            })()}
          </div>

          {/* --- Boutique de Gelée Royale (Prestige Shop) --- */}
          <div style={{ background: 'var(--mc-button-bg)', padding: '15px', border: '4px solid var(--mc-border-light)', borderRadius: '2px' }}>
            <h3 style={{ color: 'var(--honey-light)', fontSize: '11px', marginBottom: '6px', textAlign: 'center' }}>
              👑 BOUTIQUE CÉLESTE
            </h3>
            <p style={{ fontSize: '7px', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '15px' }}>
              Dépensez votre Gelée Royale en talents permanents.
            </p>
            <div style={{ fontSize: '10px', color: 'var(--text-honey)', textAlign: 'center', marginBottom: '15px' }}>
              {royalJelly || 0} 👑 disponible(s)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PRESTIGE_TALENTS.map(talent => {
                const currentLevel = prestigeTalents?.[talent.id] || 0
                const isMaxed = talent.maxCount && currentLevel >= talent.maxCount
                const canAfford = (royalJelly || 0) >= talent.cost

                return (
                  <div
                    key={talent.id}
                    className={`upgrade-item ${isMaxed ? '' : canAfford ? 'can-afford' : 'cannot-afford'}`}
                    onClick={() => {
                      if (!isMaxed && canAfford) {
                        gameState.buyPrestigeTalent(talent.id)
                      }
                    }}
                    style={{ opacity: isMaxed ? 0.6 : undefined }}
                  >
                    <div className="upgrade-icon" style={{ 
                      background: isMaxed ? 'rgba(93,186,59,0.2)' : 'rgba(0,0,0,0.3)',
                      borderColor: isMaxed ? 'var(--can-afford)' : 'var(--mc-border-dark)'
                    }}>
                      {talent.icon}
                    </div>
                    <div className="upgrade-info">
                      <div className="upgrade-name">{talent.name}</div>
                      <div className="upgrade-effect">{talent.description}</div>
                      {!isMaxed && (
                        <div className="upgrade-cost" style={{ color: canAfford ? 'var(--honey-light)' : 'var(--cannot-afford)' }}>
                          {talent.cost} 👑
                        </div>
                      )}
                    </div>
                    <div className="upgrade-count" style={{ color: isMaxed ? 'var(--can-afford)' : 'var(--text-dim)' }}>
                      {isMaxed ? '✅' : `${currentLevel}/${talent.maxCount}`}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={modalOpen}
        title="Confirmation d'Ascension"
        message={`Êtes-vous sûr de vouloir faire une Ascension ?\n\nVous perdrez votre miel actuel et vos bâtiments, mais vous gagnerez ${jellyEarned} Gelée(s) Royale(s) !\n\nVos talents de prestige sont conservés !`}
        onConfirm={() => {
          gameState.dispatch({ type: 'PRESTIGE' })
          setModalOpen(false)
        }}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  )
}
