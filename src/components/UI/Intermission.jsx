import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Intermission() {
  const { intermissionEnabled } = useGame();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [volume, setVolume] = useState(100);
  const playerRef = useRef(null);

  const lastProcessedTrigger = useRef(0);

  useEffect(() => {
    let timeout;

    const scheduleNext = () => {
      const minTime = 10 * 60 * 1000;
      const maxTime = 60 * 60 * 1000;
      const delay = Math.random() * (maxTime - minTime) + minTime;

      timeout = setTimeout(() => {
        setIsPlaying(true);
      }, delay);
    };

    if (!isPlaying) {
      scheduleNext();
    }

    return () => clearTimeout(timeout);
  }, [isPlaying]);

  // Listen for Global Admin Trigger
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'serverEvents', 'intermission'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.triggeredAt) {
            const triggerTime = data.triggeredAt.toMillis ? data.triggeredAt.toMillis() : data.triggeredAt.seconds * 1000;

            if (triggerTime > lastProcessedTrigger.current) {
              lastProcessedTrigger.current = triggerTime;
              const now = Date.now();
              if (now - triggerTime < 30000) {
                setIsPlaying(true);
              }
            }
          }
        }
      },
      (error) => {
        // Silently catch permission or network error
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      setIsVideoReady(false);
      return;
    }

    const preventRefresh = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', preventRefresh);

    let checkEndInterval;
    let ytCheckInterval;

    function initPlayer() {
      if (!window.YT || !window.YT.Player) return;

      playerRef.current = new window.YT.Player('yt-player-container', {
        videoId: 'ul_9Ymw75jI',
        playerVars: {
          'autoplay': 1,
          'controls': 0,
          'disablekb': 1,
          'fs': 0,
          'rel': 0,
          'modestbranding': 1,
          'playsinline': 1,
          'start': 0
        },
        events: {
          'onReady': (event) => {
            event.target.playVideo();
            event.target.setVolume(100); // Initialize at max volume
            checkEndInterval = setInterval(() => {
              if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                const time = playerRef.current.getCurrentTime();
                // We MUST cut it slightly BEFORE the video physically ends.
                // The video is exactly 79 seconds long. If we wait until 79 or 80, 
                // YouTube reaches the end, stops, and shows the grid.
                // Cutting at 78.8 guarantees we kill it while it's still playing!
                if (time >= 79.4) {
                  setIsPlaying(false);
                }
              }
            }, 100); // Check every 100ms for precision
          },
          'onStateChange': (event) => {
            if (event.data === 1) { // PLAYING
              setIsVideoReady(true);
            }
            if (event.data === 0) { // ENDED
              // If it somehow naturally ends, instantly hide it to try and prevent grid
              setIsVideoReady(false);
              setIsPlaying(false);
            }
          },
          'onError': (e) => {
            console.error('YouTube Player Error:', e.data);
            setIsPlaying(false);
          }
        }
      });
    }

    function tryInitPlayer() {
      if (window.YT && window.YT.Player) {
        if (ytCheckInterval) clearInterval(ytCheckInterval);
        initPlayer();
      }
    }

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = tryInitPlayer;
    } else {
      if (window.YT.Player) {
        initPlayer();
      } else {
        ytCheckInterval = setInterval(tryInitPlayer, 100);
      }
    }

    return () => {
      window.removeEventListener('beforeunload', preventRefresh);
      if (checkEndInterval) clearInterval(checkEndInterval);
      if (ytCheckInterval) clearInterval(ytCheckInterval);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isPlaying]);

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(newVol);
      if (newVol > 0 && typeof playerRef.current.unMute === 'function') {
        playerRef.current.unMute();
      }
    }
  };

  if (!isPlaying) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'black',
      zIndex: 999999,
      overflow: 'hidden',
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Loading text while video is buffering to avoid seeing YT UI */}
      {!isVideoReady && (
        <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '14px', animation: 'pulse 1s infinite' }}>
          Chargement de l'intermission...
        </div>
      )}

      {/* Video container without aggressive scaling so it doesn't feel too zoomed in */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        opacity: isVideoReady ? 1 : 0, // Invisible until it actually starts playing
        transition: 'opacity 0.3s ease-in-out'
      }}>
        <div id="yt-player-container" style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Ultimate blocking overlay - intercepts ALL mouse events */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          zIndex: 10,
          background: 'rgba(0,0,0,0.01)', // Slightly visible to force hit-testing
          cursor: 'not-allowed'
        }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
      />

      {/* Custom Volume Controls */}
      {isVideoReady && (
        <div style={{
          position: 'absolute',
          bottom: '30px',
          right: '30px',
          zIndex: 20, // Above the blocking overlay
          background: 'rgba(0, 0, 0, 0.85)',
          padding: '12px 20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          border: '2px solid var(--honey-dark)',
          boxShadow: '0 0 15px rgba(200, 120, 0, 0.4)',
          pointerEvents: 'auto' // Re-enable pointer events for the controls
        }}>
          <span style={{ fontSize: '18px' }}>🔊</span>
          <input
            type="range"
            min="10" // Minimum volume is 10, impossible to mute completely!
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="honey-slider"
            style={{ cursor: 'pointer', width: '120px' }}
            title="Volume (10 - 100)"
          />
          <span style={{ color: 'var(--honey-light)', fontSize: '13px', fontWeight: 'bold', width: '35px', textAlign: 'right', textShadow: '0 0 5px rgba(255, 170, 0, 0.5)' }}>{volume}%</span>
        </div>
      )}

      {/* Internal Styles for Slider */}
      <style>{`
        .honey-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          outline: none;
        }
        .honey-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--honey-light);
          cursor: pointer;
          box-shadow: 0 0 8px var(--honey-light);
        }
        .honey-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--honey-light);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 8px var(--honey-light);
        }
      `}</style>
    </div>
  );
}
