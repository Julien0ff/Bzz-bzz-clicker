import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function BanScreen() {
  const { logout } = useAuth()
  const [variant, setVariant] = useState(null)

  useEffect(() => {
    // 50% chance to show video, 50% chance to show angry bees
    setVariant(Math.random() > 0.5 ? 'video' : 'bees')
  }, [])

  if (!variant) return null

  if (variant === 'video') {
    return (
      <div style={{
        position: 'fixed', inset: 0, backgroundColor: 'black',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999
      }}>
        <iframe 
          src="https://player.vimeo.com/video/1199871056?autoplay=1&loop=1&title=0&byline=0&portrait=0" 
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="autoplay; fullscreen; picture-in-picture" 
          allowFullScreen
        ></iframe>
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <button className="mc-button danger" onClick={logout}>Déconnexion</button>
        </div>
      </div>
    )
  }

  // "Bees" variant
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: '#8a0000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      animation: 'shake 0.5s infinite',
      fontFamily: "'Press Start 2P', monospace",
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ color: '#ffea00', fontSize: '3rem', textShadow: '4px 4px 0 #000', marginBottom: '20px' }}>
        BZZZ BZZZ TRICHEUR !
      </h1>
      <h2 style={{ color: 'white', fontSize: '1.5rem', textShadow: '2px 2px 0 #000', marginBottom: '40px' }}>
        L'ESSAIM T'A BANNI DÉFINITIVEMENT. BZZZZZZZ !!
      </h2>
      <button className="mc-button" onClick={logout} style={{ fontSize: '1.2rem', padding: '15px 30px' }}>
        Fuir l'essaim (Déconnexion)
      </button>

      <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
      `}</style>
    </div>
  )
}
