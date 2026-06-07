// ===================================================
// useSaveGame — Auto-save to Firestore
// ===================================================

import { useEffect, useRef } from 'react'
import { useGame } from '../contexts/GameContext'
import { useAuth } from '../contexts/AuthContext'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const SAVE_INTERVAL = 30000 // Save every 30 seconds

export function useSaveGame() {
  const { honey, totalHoney, clickPower, honeyPerSecond, upgrades, clickUpgrades, loadSave, dispatch } = useGame()
  const { user } = useAuth()
  const saveTimerRef = useRef(null)
  const hasLoadedRef = useRef(false)

  // Load saved game on mount
  useEffect(() => {
    if (!user || hasLoadedRef.current) return

    const loadGame = async () => {
      try {
        const saveDoc = await getDoc(doc(db, 'saves', user.uid))
        if (saveDoc.exists()) {
          const savedState = saveDoc.data()
          loadSave(savedState)
        }
        hasLoadedRef.current = true
      } catch (err) {
        console.error('Error loading save:', err)
      }
    }

    loadGame()
  }, [user, loadSave])

  // Auto-save periodically
  useEffect(() => {
    if (!user) return

    const saveGame = async () => {
      try {
        const saveData = {
          honey,
          totalHoney,
          clickPower,
          honeyPerSecond,
          upgrades,
          clickUpgrades,
          lastSaved: new Date().toISOString(),
        }

        await setDoc(doc(db, 'saves', user.uid), saveData)
        dispatch({ type: 'SET_LAST_SAVED', time: saveData.lastSaved })
      } catch (err) {
        console.error('Error saving game:', err)
      }
    }

    saveTimerRef.current = setInterval(saveGame, SAVE_INTERVAL)

    // Also save on unload
    const handleUnload = () => saveGame()
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearInterval(saveTimerRef.current)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [user, honey, totalHoney, clickPower, honeyPerSecond, upgrades, clickUpgrades, dispatch])
}
