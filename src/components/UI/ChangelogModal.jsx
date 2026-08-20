// ===================================================
// ChangelogModal — What's New Pop-up with Type Badges
// ===================================================

import React from 'react'
import { CHANGELOGS, APP_VERSION } from '../../data/changelog'

// Configuration des badges & couleurs selon le type
const TYPE_CONFIGS = {
  new: {
    label: 'NOUVEAU',
    color: '#5dba3b',
    bg: 'rgba(93, 186, 59, 0.12)',
    border: 'rgba(93, 186, 59, 0.5)',
    badgeBg: '#5dba3b',
    badgeColor: '#0f2409',
  },
  fix: {
    label: 'CORRECTIF',
    color: '#4da6ff',
    bg: 'rgba(77, 166, 255, 0.12)',
    border: 'rgba(77, 166, 255, 0.5)',
    badgeBg: '#4da6ff',
    badgeColor: '#05182e',
  },
  balance: {
    label: 'ÉQUILIBRAGE',
    color: '#ffaa00',
    bg: 'rgba(255, 170, 0, 0.12)',
    border: 'rgba(255, 170, 0, 0.5)',
    badgeBg: '#ffaa00',
    badgeColor: '#2b1b00',
  },
  ui: {
    label: 'INTERFACE',
    color: '#ff77c6',
    bg: 'rgba(255, 119, 198, 0.12)',
    border: 'rgba(255, 119, 198, 0.5)',
    badgeBg: '#ff77c6',
    badgeColor: '#2e071e',
  },
  social: {
    label: 'SOCIAL',
    color: '#b377ff',
    bg: 'rgba(179, 119, 255, 0.12)',
    border: 'rgba(179, 119, 255, 0.5)',
    badgeBg: '#b377ff',
    badgeColor: '#1e0736',
  },
}

export default function ChangelogModal({ isOpen, onClose }) {
  if (!isOpen) return null

  const latestChangelog = CHANGELOGS[0]

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="mc-panel"
        style={{
          width: '560px',
          maxWidth: '96vw',
          maxHeight: '88vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '3px solid var(--mc-border-dark)', paddingBottom: '12px' }}>
          <div style={{ fontSize: '8px', color: 'var(--honey-light)', letterSpacing: '2px', marginBottom: '4px' }}>
            BEE CLICKER v{APP_VERSION}
          </div>
          <h2 style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>
            📜 NOUVEAUTÉS DE LA VERSION
          </h2>
          <div style={{ fontSize: '8px', color: 'var(--text-dim)', marginTop: '4px' }}>
            {latestChangelog?.date}
          </div>
        </div>

        {/* Highlights List with dynamic type badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {latestChangelog?.highlights?.map((item, index) => {
            const typeConfig = TYPE_CONFIGS[item.type] || TYPE_CONFIGS.new

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 14px',
                  background: typeConfig.bg,
                  border: `2px solid ${typeConfig.border}`,
                  borderRadius: '3px',
                  boxShadow: `0 0 10px ${typeConfig.bg}`,
                }}
              >
                <span style={{ fontSize: '22px', flexShrink: 0, marginTop: '2px' }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontFamily: 'Press Start 2P, monospace',
                        fontSize: '6px',
                        fontWeight: 'bold',
                        padding: '3px 6px',
                        borderRadius: '2px',
                        background: typeConfig.badgeBg,
                        color: typeConfig.badgeColor,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {typeConfig.label}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                      {item.label}
                    </span>
                  </div>
                  <div className="changelog-desc" style={{ fontSize: '11px', color: '#ccc', lineHeight: '1.4' }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Previous versions preview if any */}
        {CHANGELOGS.length > 1 && (
          <details
            style={{
              marginTop: '4px',
              cursor: 'pointer',
              background: 'rgba(0,0,0,0.2)',
              padding: '8px 12px',
              border: '1px solid var(--mc-border-dark)',
            }}
          >
            <summary style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>
              Voir l'historique précédent (v{CHANGELOGS[1].version})
            </summary>
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {CHANGELOGS[1].highlights.map((item, index) => {
                const prevType = TYPE_CONFIGS[item.type] || TYPE_CONFIGS.new
                return (
                  <div
                    key={index}
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 0',
                    }}
                  >
                    <span>{item.icon}</span>
                    <span
                      style={{
                        fontSize: '6px',
                        padding: '2px 4px',
                        borderRadius: '2px',
                        background: prevType.badgeBg,
                        color: prevType.badgeColor,
                        fontWeight: 'bold',
                      }}
                    >
                      {prevType.label}
                    </span>
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.label}</strong> : {item.desc}
                    </span>
                  </div>
                )
              })}
            </div>
          </details>
        )}

        <button
          className="mc-button primary"
          onClick={onClose}
          style={{ width: '100%', padding: '14px', fontSize: '10px', marginTop: '6px' }}
        >
          ✨ C'est parti !
        </button>
      </div>
    </div>
  )
}
