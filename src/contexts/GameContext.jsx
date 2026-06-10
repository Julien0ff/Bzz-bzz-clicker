// ===================================================
// Game Context — State Management
// ===================================================

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { PRODUCTION_UPGRADES, CLICK_UPGRADES, getUpgradeCost, getClickUpgradeCost } from '../data/upgrades'

const GameContext = createContext(null)

// --- Initial State ---
const initialState = {
  honey: 0,
  totalHoney: 0,        // lifetime total (for leaderboard)
  clickPower: 1,         // honey per click
  honeyPerSecond: 0,     // passive income
  upgrades: {},          // { upgradeId: count }
  clickUpgrades: {},     // { upgradeId: count }
  totalClicks: 0,        // lifetime clicks
  playTime: 0,           // total play time in seconds
  achievements: [],      // array of unlocked achievement ids
  royalJelly: 0,         // prestige currency (+10% multiplier each)
  frenzyTimeLeft: 0,     // seconds left for x7 frenzy
  intermissionEnabled: false, // random intermission video
  lastSaved: null,
}

// --- Reducer ---
function gameReducer(state, action) {
  switch (action.type) {
    case 'CLICK': {
      // Apply achievement multiplier (1% per achievement) and royal jelly (10% per jelly)
      const achievementMulti = 1 + (state.achievements?.length || 0) * 0.01
      const jellyMulti = 1 + (state.royalJelly || 0) * 0.10
      const frenzyMulti = state.frenzyTimeLeft > 0 ? 7 : 1
      const clickAmount = state.clickPower * achievementMulti * jellyMulti * frenzyMulti
      return {
        ...state,
        honey: state.honey + clickAmount,
        totalHoney: state.totalHoney + clickAmount,
        totalClicks: (state.totalClicks || 0) + 1,
      }
    }

    case 'TICK': {
      // Passive production per frame (called from game loop)
      const delta = action.delta // seconds since last tick
      // Apply multipliers
      const achievementMulti = 1 + (state.achievements?.length || 0) * 0.01
      const jellyMulti = 1 + (state.royalJelly || 0) * 0.10
      const frenzyMulti = state.frenzyTimeLeft > 0 ? 7 : 1
      const earned = state.honeyPerSecond * delta * achievementMulti * jellyMulti * frenzyMulti
      
      const newFrenzyTimeLeft = state.frenzyTimeLeft > 0 ? Math.max(0, state.frenzyTimeLeft - delta) : 0

      return {
        ...state,
        honey: state.honey + earned,
        totalHoney: state.totalHoney + earned,
        playTime: (state.playTime || 0) + delta,
        frenzyTimeLeft: newFrenzyTimeLeft,
      }
    }

    case 'GOLDEN_BEE_EFFECT': {
      if (action.effectType === 'frenzy') {
        return { ...state, frenzyTimeLeft: 5 } // 5 seconds of x7 (as requested)
      } else if (action.effectType === 'lucky_drop') {
        const bonus = (state.honeyPerSecond * 300) + 5000 // 5 mins of passive + 5k flat
        return {
          ...state,
          honey: state.honey + bonus,
          totalHoney: state.totalHoney + bonus,
        }
      } else if (action.effectType === 'malus') {
        // Le malus vide complètement la banque de miel et met le joueur légèrement en négatif
        return {
          ...state,
          honey: -500,
          // Ne réduit pas le totalHoney à vie, seulement le miel en banque
        }
      }
      return state
    }

    case 'PRESTIGE': {
      // Nouveau système : Gain de Gelée basé sur le Miel en Banque sacrifié
      const jellyEarned = Math.floor(Math.cbrt(state.honey / 100000000))
      
      if (jellyEarned <= 0) return state // Cannot prestige

      return {
        ...initialState, // reset everything
        totalHoney: state.totalHoney, // keep lifetime honey
        totalClicks: state.totalClicks, // keep stats
        playTime: state.playTime,
        achievements: state.achievements, // keep achievements
        royalJelly: (state.royalJelly || 0) + jellyEarned, // add new jelly
      }
    }

    case 'UNLOCK_ACHIEVEMENT': {
      if (state.achievements?.includes(action.id)) return state
      return {
        ...state,
        achievements: [...(state.achievements || []), action.id]
      }
    }

    case 'BUY_PRODUCTION_UPGRADE': {
      const upgrade = PRODUCTION_UPGRADES.find(u => u.id === action.upgradeId)
      if (!upgrade) return state

      const currentCount = state.upgrades[upgrade.id] || 0
      if (upgrade.maxCount && currentCount >= upgrade.maxCount) return state

      const cost = getUpgradeCost(upgrade, currentCount)
      if (state.honey < cost) return state

      const newCount = currentCount + 1
      const newUpgrades = { ...state.upgrades, [upgrade.id]: newCount }

      // Recalculate total honey per second
      let newHPS = 0
      PRODUCTION_UPGRADES.forEach(u => {
        const count = newUpgrades[u.id] || 0
        newHPS += u.baseProduction * count
      })

      return {
        ...state,
        honey: state.honey - cost,
        upgrades: newUpgrades,
        honeyPerSecond: newHPS,
      }
    }

    case 'BUY_CLICK_UPGRADE': {
      const upgrade = CLICK_UPGRADES.find(u => u.id === action.upgradeId)
      if (!upgrade) return state

      const currentCount = state.clickUpgrades[upgrade.id] || 0
      if (upgrade.maxCount && currentCount >= upgrade.maxCount) return state

      const cost = getClickUpgradeCost(upgrade, currentCount)
      if (state.honey < cost) return state

      const newClickUpgrades = { ...state.clickUpgrades, [upgrade.id]: currentCount + 1 }

      // Recalculate click power
      let newClickPower = 1
      CLICK_UPGRADES.forEach(u => {
        const count = newClickUpgrades[u.id] || 0
        newClickPower += u.clickBonus * count
      })

      return {
        ...state,
        honey: state.honey - cost,
        clickUpgrades: newClickUpgrades,
        clickPower: newClickPower,
      }
    }

    case 'LOAD_SAVE': {
      return {
        ...state,
        ...action.savedState,
      }
    }

    case 'SET_LAST_SAVED': {
      return { ...state, lastSaved: action.time }
    }

    case 'TOGGLE_INTERMISSION': {
      return { ...state, intermissionEnabled: !state.intermissionEnabled }
    }

    default:
      return state
  }
}

// --- Provider ---
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const click = useCallback(() => {
    dispatch({ type: 'CLICK' })
  }, [])

  const tick = useCallback((delta) => {
    dispatch({ type: 'TICK', delta })
  }, [])

  const buyProductionUpgrade = useCallback((upgradeId) => {
    dispatch({ type: 'BUY_PRODUCTION_UPGRADE', upgradeId })
  }, [])

  const buyClickUpgrade = useCallback((upgradeId) => {
    dispatch({ type: 'BUY_CLICK_UPGRADE', upgradeId })
  }, [])

  const loadSave = useCallback((savedState) => {
    dispatch({ type: 'LOAD_SAVE', savedState })
  }, [])

  const value = {
    ...state,
    click,
    tick,
    buyProductionUpgrade,
    buyClickUpgrade,
    loadSave,
    dispatch,
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

// --- Hook ---
export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

export default GameContext
