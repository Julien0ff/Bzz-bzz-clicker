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
  lastSaved: null,
}

// --- Reducer ---
function gameReducer(state, action) {
  switch (action.type) {
    case 'CLICK': {
      return {
        ...state,
        honey: state.honey + state.clickPower,
        totalHoney: state.totalHoney + state.clickPower,
        totalClicks: (state.totalClicks || 0) + 1,
      }
    }

    case 'TICK': {
      // Passive production per frame (called from game loop)
      const delta = action.delta // seconds since last tick
      const earned = state.honeyPerSecond * delta
      return {
        ...state,
        honey: state.honey + earned,
        totalHoney: state.totalHoney + earned,
        playTime: (state.playTime || 0) + delta,
      }
    }

    case 'BUY_PRODUCTION_UPGRADE': {
      const upgrade = PRODUCTION_UPGRADES.find(u => u.id === action.upgradeId)
      if (!upgrade) return state

      const currentCount = state.upgrades[upgrade.id] || 0
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
