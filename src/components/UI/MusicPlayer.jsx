import React, { useState, useRef, useEffect } from 'react'

// Détecte automatiquement tous les fichiers .mp3 dans public/assets/music/
const audioFiles = import.meta.glob('/public/assets/music/*.mp3', { eager: true })
const playlist = Object.keys(audioFiles).map(path => path.replace('/public', ''))

export default function MusicPlayer() {
  const [isMuted, setIsMuted] = useState(true)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    if (audioRef.current && playlist.length > 0) {
      audioRef.current.volume = 0.2 // Volume de fond (20%)
      if (!isMuted) {
        audioRef.current.play().catch(e => console.log('Autoplay blocked', e))
      } else {
        audioRef.current.pause()
      }
    }
  }, [isMuted, currentTrackIndex])

  const toggleMute = () => {
    if (playlist.length === 0) {
      alert("Tu n'as pas encore ajouté de musiques !\nMets tes fichiers .mp3 dans le dossier public/assets/music/")
      return
    }
    setIsMuted(!isMuted)
  }

  const handleEnded = () => {
    if (playlist.length > 0) {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {playlist.length > 0 && (
        <audio 
          ref={audioRef} 
          src={playlist[currentTrackIndex]} 
          onEnded={handleEnded} 
          // Pas de loop, on passe à la suivante quand c'est fini
        />
      )}
      <button 
        onClick={toggleMute}
        style={{
          background: 'none',
          border: 'none',
          cursor: playlist.length > 0 ? 'pointer' : 'help',
          fontSize: '16px',
          marginLeft: '8px',
          filter: 'drop-shadow(1px 1px 0px #000)',
          opacity: playlist.length > 0 ? 1 : 0.5
        }}
        title={playlist.length === 0 ? "Aucune musique trouvée dans assets/music/" : (isMuted ? "Activer la musique" : "Couper la musique")}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
    </div>
  )
}
