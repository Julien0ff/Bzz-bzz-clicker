// ===================================================
// useSaveGame — Auto-save to Firestore (v2)
// ===================================================

import { useEffect, useRef } from 'react'
import { useGame } from '../contexts/GameContext'
import { useAuth } from '../contexts/AuthContext'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const SAVE_INTERVAL = 30000 // Save every 30 seconds

export function useSaveGame() {
  const gameState = useGame()
  const { user } = useAuth()
  const saveTimerRef = useRef(null)
  const hasLoadedRef = useRef(false)
  const gameStateRef = useRef(gameState)

  // Keep ref up to date without triggering re-renders of the effect
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  // Load saved game on mount
  useEffect(() => {
    if (!user || hasLoadedRef.current) return

    const loadGame = async () => {
      try {
        const saveDoc = await getDoc(doc(db, 'saves', user.uid))
        if (saveDoc.exists()) {
          const savedState = saveDoc.data()
          gameState.loadSave(savedState)
        }
        hasLoadedRef.current = true
      } catch (err) {
        console.error('Error loading save:', err)
      }
    }

    loadGame()
  }, [user]) // intentionally not depending on loadSave to avoid re-triggering

  // Auto-save periodically
  useEffect(() => {
    if (!user) return

    const saveGame = async () => {
      try {
        const state = gameStateRef.current
        const saveData = {
          honey: state.honey,
          totalHoney: state.totalHoney,
          clickPower: state.clickPower,
          honeyPerSecond: state.honeyPerSecond,
          upgrades: state.upgrades,
          clickUpgrades: state.clickUpgrades,
          synergyUpgrades: state.synergyUpgrades || {},
          totalClicks: state.totalClicks || 0,
          playTime: state.playTime || 0,
          achievements: state.achievements || [],
          royalJelly: state.royalJelly || 0,
          prestigeTalents: state.prestigeTalents || {},
          pendingGifts: state.pendingGifts || [],
          intermissionEnabled: state.intermissionEnabled || false,
          lastSaved: new Date().toISOString(),
        }

        await setDoc(doc(db, 'saves', user.uid), saveData)
        state.dispatch({ type: 'SET_LAST_SAVED', time: saveData.lastSaved })
      } catch (err) {
        console.error('Error saving game:', err)
      }
    }

    saveTimerRef.current = setInterval(saveGame, SAVE_INTERVAL)

    // Also save on unload
    const handleUnload = () => {
      if (!window.isResetting) saveGame()
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearInterval(saveTimerRef.current)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [user]) // only depends on user to setup the interval once
}
