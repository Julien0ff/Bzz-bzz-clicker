// ===================================================
// ChangelogModal — What's New Pop-up
// ===================================================

import React from 'react'
import { CHANGELOGS, APP_VERSION } from '../../data/changelog'

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
          width: '540px',
          maxWidth: '96vw',
          maxHeight: '88vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
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

        {/* Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {latestChangelog?.highlights?.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '10px 12px',
                background: 'var(--bg-panel-inner)',
                border: '2px solid var(--mc-border-dark)',
                borderRadius: '3px',
              }}
            >
              <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>{item.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '9px', color: 'var(--text-honey)', marginBottom: '4px', textShadow: '1px 1px 0 #000' }}>
                  {item.label}
                </div>
                <div className="changelog-desc" style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Previous versions preview if any */}
        {CHANGELOGS.length > 1 && (
          <details style={{ marginTop: '4px', cursor: 'pointer', background: 'rgba(0,0,0,0.2)', padding: '8px', border: '1px solid var(--mc-border-dark)' }}>
            <summary style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>
              Voir l'historique précédent (v{CHANGELOGS[1].version})
            </summary>
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {CHANGELOGS[1].highlights.map((item, index) => (
                <div key={index} style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'flex', gap: '8px' }}>
                  <span>{item.icon}</span>
                  <span><strong>{item.label}</strong> : {item.desc}</span>
                </div>
              ))}
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
