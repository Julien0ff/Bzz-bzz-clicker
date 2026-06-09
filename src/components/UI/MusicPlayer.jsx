import React, { useState, useRef, useEffect } from 'react'

// Tu devras mettre un fichier 'music.mp3' dans le dossier 'public/assets/music/'
const MUSIC_TRACK = '/assets/music/music.mp3'

export default function MusicPlayer() {
  const [isMuted, setIsMuted] = useState(true)
  const audioRef = useRef(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.2 // Volume de fond (20%)
      if (!isMuted) {
        audioRef.current.play().catch(e => console.log('Autoplay blocked', e))
      } else {
        audioRef.current.pause()
      }
    }
  }, [isMuted])

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <audio ref={audioRef} src={MUSIC_TRACK} loop />
      <button 
        onClick={toggleMute}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          marginLeft: '8px',
          filter: 'drop-shadow(1px 1px 0px #000)'
        }}
        title={isMuted ? "Activer la musique" : "Couper la musique"}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
    </div>
  )
}
