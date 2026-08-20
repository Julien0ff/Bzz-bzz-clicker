// ===================================================
// Game Context — State Management (v2 — De-nerfed)
// ===================================================

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { useAuth } from './AuthContext'
import {
  PRODUCTION_UPGRADES, CLICK_UPGRADES, SYNERGY_UPGRADES, PRESTIGE_TALENTS,
  getUpgradeCost, getClickUpgradeCost, getSynergyCost,
  getMilestoneMultiplier, BUILDING_MILESTONES
} from '../data/upgrades'

const GameContext = createContext(null)

// --- Initial State ---
const initialState = {
  honey: 0,
  totalHoney: 0,        // lifetime total (for leaderboard)
  clickPower: 1,         // honey per click (base, before multipliers)
  honeyPerSecond: 0,     // passive income (base, before multipliers)
  upgrades: {},          // { upgradeId: count }
  clickUpgrades: {},     // { upgradeId: count }
  synergyUpgrades: {},   // { synergyId: count }
  totalClicks: 0,        // lifetime clicks
  goldenBeesClicked: 0,  // lifetime golden bees captured
  playTime: 0,           // total play time in seconds
  achievements: [],      // array of unlocked achievement ids
  royalJelly: 0,         // prestige currency
  prestigeTalents: {},   // { talentId: count }
  prestigeCount: 0,      // total ascensions performed
  frenzyTimeLeft: 0,     // seconds left for x7 frenzy
  clickStormTimeLeft: 0, // seconds left for x77 click storm
  blessingTimeLeft: 0,   // seconds left for x10 blessing
  comboCount: 0,         // current combo hits
  comboDecayTimer: 0,    // time since last click (for combo decay)
  comboTier: 0,          // current combo tier (0=none, 1=x1.5, 2=x2, 3=x3, 4=FEVER x5)
  intermissionEnabled: false,
  lastSaved: null,
  // Gift system
  pendingGifts: [],      // array of { fromUid, fromName, type, amount, sentAt }
}

// --- Effective HPS helper ---
export function getEffectiveHPS(state) {
  if (!state) return 0
  const achievementMulti = 1 + (state.achievements?.length || 0) * 0.01
  const jellyMulti = 1 + (state.royalJelly || 0) * 0.10
  const frenzyMulti = state.frenzyTimeLeft > 0 ? 7 : 1
  const blessingMulti = state.blessingTimeLeft > 0 ? 10 : 1
  const prestigeProdMulti = getPrestigeProductionMultiplier(state.prestigeTalents)
  return (state.honeyPerSecond || 0) * achievementMulti * jellyMulti * frenzyMulti * blessingMulti * prestigeProdMulti
}

// --- Combo Tiers ---
const COMBO_TIERS = [
  { threshold: 0,   multiplier: 1,   name: '' },
  { threshold: 10,  multiplier: 1.5, name: 'COMBO x1.5' },
  { threshold: 25,  multiplier: 2,   name: 'COMBO x2' },
  { threshold: 50,  multiplier: 3,   name: 'COMBO x3' },
  { threshold: 100, multiplier: 5,   name: '🔥 FIÈVRE x5 🔥' },
]

function getComboTier(comboCount) {
  let tier = 0
  for (let i = COMBO_TIERS.length - 1; i >= 0; i--) {
    if (comboCount >= COMBO_TIERS[i].threshold) {
      tier = i
      break
    }
  }
  return tier
}

// --- Helper: Calculate total HPS with all multipliers ---
function calculateHPS(upgrades, synergyUpgrades) {
  let totalHPS = 0
  const buildingHPS = {} // store per-building HPS for synergy calc

  PRODUCTION_UPGRADES.forEach(u => {
    const count = upgrades[u.id] || 0
    if (count <= 0) return
    
    const milestoneMulti = getMilestoneMultiplier(count)
    const baseHPS = u.baseProduction * count * milestoneMulti
    buildingHPS[u.id] = baseHPS
  })

  // Apply synergy bonuses
  SYNERGY_UPGRADES.forEach(syn => {
    const synCount = synergyUpgrades?.[syn.id] || 0
    if (synCount <= 0 || !syn.targetBuilding || !syn.bonusPerSource) return
    
    const sourceCount = upgrades[syn.sourceBuilding] || 0
    if (sourceCount <= 0) return
    
    const bonusMultiplier = 1 + (syn.bonusPerSource * sourceCount)
    if (buildingHPS[syn.targetBuilding]) {
      buildingHPS[syn.targetBuilding] *= bonusMultiplier
    }
  })

  // Sum all
  Object.values(buildingHPS).forEach(hps => {
    totalHPS += hps
  })

  return totalHPS
}

// --- Helper: Calculate click power with HPS synergy ---
function calculateClickPower(clickUpgrades, honeyPerSecond) {
  let baseClickPower = 1
  let totalHpsPercent = 0

  CLICK_UPGRADES.forEach(u => {
    const count = clickUpgrades[u.id] || 0
    baseClickPower += u.clickBonus * count
    totalHpsPercent += (u.hpsPercent || 0) * count
  })

  // Add percentage of HPS to click power
  const hpsBonus = honeyPerSecond * (totalHpsPercent / 100)
  return baseClickPower + hpsBonus
}

// --- Helper: Get prestige talent level ---
function getTalentLevel(prestigeTalents, talentId) {
  return prestigeTalents?.[talentId] || 0
}

// --- Helper: Get prestige multipliers ---
function getPrestigeClickMultiplier(prestigeTalents) {
  const level = getTalentLevel(prestigeTalents, 'clickForce')
  return Math.pow(1.5, level)
}

function getPrestigeProductionMultiplier(prestigeTalents) {
  const level = getTalentLevel(prestigeTalents, 'productionBoost')
  return Math.pow(1.25, level)
}

function getFrenzyBaseDuration(prestigeTalents) {
  const level = getTalentLevel(prestigeTalents, 'frenzyDuration')
  return 25 + (level * 10) // base 25s + 10s per level
}

function getComboSpeedBonus(prestigeTalents) {
  const level = getTalentLevel(prestigeTalents, 'comboSpeed')
  return 1 + (level * 0.20) // +20% combo build speed per level
}

function getMilestoneMultiplierOverride(prestigeTalents) {
  const level = getTalentLevel(prestigeTalents, 'milestonePower')
  return level > 0 ? 2.5 : 2 // x2.5 instead of x2 if talent is bought
}

// --- Reducer ---
function gameReducer(state, action) {
  switch (action.type) {
    case 'CLICK': {
      // Apply all multipliers
      const achievementMulti = 1 + (state.achievements?.length || 0) * 0.01
      const jellyMulti = 1 + (state.royalJelly || 0) * 0.10
      const friendMulti = 1 + (action.friendsCount || 0) * 0.01
      const frenzyMulti = state.frenzyTimeLeft > 0 ? 7 : 1
      const clickStormMulti = state.clickStormTimeLeft > 0 ? 77 : 1
      const blessingMulti = state.blessingTimeLeft > 0 ? 10 : 1
      const prestigeClickMulti = getPrestigeClickMultiplier(state.prestigeTalents)
      
      // Combo multiplier
      const comboMulti = COMBO_TIERS[state.comboTier]?.multiplier || 1
      
      // Recalculate clickPower with HPS synergy
      const effectiveClickPower = calculateClickPower(state.clickUpgrades, state.honeyPerSecond)

      const totalMulti = achievementMulti * jellyMulti * friendMulti * frenzyMulti * clickStormMulti * blessingMulti * prestigeClickMulti * comboMulti
      const clickAmount = effectiveClickPower * totalMulti

      // Increase combo
      const comboSpeed = getComboSpeedBonus(state.prestigeTalents)
      const newComboCount = state.comboCount + (1 * comboSpeed)
      const newComboTier = getComboTier(newComboCount)

      return {
        ...state,
        honey: state.honey + clickAmount,
        totalHoney: state.totalHoney + clickAmount,
        totalClicks: (state.totalClicks || 0) + 1,
        clickPower: effectiveClickPower,
        comboCount: newComboCount,
        comboTier: newComboTier,
        comboDecayTimer: 0, // reset decay timer on click
      }
    }

    case 'TICK': {
      const delta = action.delta // seconds since last tick
      // Apply multipliers
      const achievementMulti = 1 + (state.achievements?.length || 0) * 0.01
      const jellyMulti = 1 + (state.royalJelly || 0) * 0.10
      const friendMulti = 1 + (action.friendsCount || 0) * 0.01
      const frenzyMulti = state.frenzyTimeLeft > 0 ? 7 : 1
      const blessingMulti = state.blessingTimeLeft > 0 ? 10 : 1
      const prestigeProdMulti = getPrestigeProductionMultiplier(state.prestigeTalents)
      
      const earned = state.honeyPerSecond * delta * achievementMulti * jellyMulti * friendMulti * frenzyMulti * blessingMulti * prestigeProdMulti
      
      // Decay combo if not clicking
      const newDecayTimer = state.comboDecayTimer + delta
      let newComboCount = state.comboCount
      let newComboTier = state.comboTier
      
      if (newDecayTimer > 0.8) { // decay after 0.8s of no clicks
        newComboCount = Math.max(0, state.comboCount - (delta * 15)) // lose 15 combo per second
        newComboTier = getComboTier(Math.floor(newComboCount))
      }

      const newFrenzyTimeLeft = state.frenzyTimeLeft > 0 ? Math.max(0, state.frenzyTimeLeft - delta) : 0
      const newClickStormTimeLeft = state.clickStormTimeLeft > 0 ? Math.max(0, state.clickStormTimeLeft - delta) : 0
      const newBlessingTimeLeft = state.blessingTimeLeft > 0 ? Math.max(0, state.blessingTimeLeft - delta) : 0

      return {
        ...state,
        honey: state.honey + earned,
        totalHoney: state.totalHoney + earned,
        playTime: (state.playTime || 0) + delta,
        frenzyTimeLeft: newFrenzyTimeLeft,
        clickStormTimeLeft: newClickStormTimeLeft,
        blessingTimeLeft: newBlessingTimeLeft,
        comboCount: newComboCount,
        comboTier: newComboTier,
        comboDecayTimer: newDecayTimer,
      }
    }

    case 'GOLDEN_BEE_EFFECT': {
      const frenzyDuration = getFrenzyBaseDuration(state.prestigeTalents)
      const nextBeeCount = (state.goldenBeesClicked || 0) + 1
      
      if (action.effectType === 'frenzy') {
        return { ...state, frenzyTimeLeft: frenzyDuration, goldenBeesClicked: nextBeeCount }
      } else if (action.effectType === 'click_storm') {
        return { ...state, clickStormTimeLeft: 12, goldenBeesClicked: nextBeeCount }
      } else if (action.effectType === 'honey_rain') {
        const effectiveHps = getEffectiveHPS(state)
        const bonus = action.bonus || Math.max(50000, Math.floor(effectiveHps * 900))
        return {
          ...state,
          honey: state.honey + bonus,
          totalHoney: state.totalHoney + bonus,
          goldenBeesClicked: nextBeeCount,
        }
      } else if (action.effectType === 'blessing') {
        return { ...state, blessingTimeLeft: 30, goldenBeesClicked: nextBeeCount }
      } else if (action.effectType === 'lucky_drop') {
        const effectiveHps = getEffectiveHPS(state)
        const bonus = action.bonus || Math.max(25000, Math.floor(effectiveHps * 300))
        return {
          ...state,
          honey: state.honey + bonus,
          totalHoney: state.totalHoney + bonus,
          goldenBeesClicked: nextBeeCount,
        }
      }
      return { ...state, goldenBeesClicked: nextBeeCount }
    }

    case 'PRESTIGE': {
      // Prestige based on total honey produced SINCE last prestige (approximated by totalHoney)
      const jellyBonusLevel = getTalentLevel(state.prestigeTalents, 'jellyHarvest')
      const jellyBonusMulti = 1 + (jellyBonusLevel * 0.10)
      const jellyEarned = Math.floor(Math.cbrt(state.totalHoney / 100000000) * jellyBonusMulti)
      
      if (jellyEarned <= 0) return state

      // Starting honey from prestige talent
      const headStartLevel = getTalentLevel(state.prestigeTalents, 'headStart')
      const startingHoney = headStartLevel * 10000

      return {
        ...initialState,
        honey: startingHoney,
        totalHoney: state.totalHoney,
        totalClicks: state.totalClicks,
        goldenBeesClicked: state.goldenBeesClicked,
        prestigeCount: (state.prestigeCount || 0) + 1,
        playTime: state.playTime,
        achievements: state.achievements,
        royalJelly: (state.royalJelly || 0) + jellyEarned,
        prestigeTalents: state.prestigeTalents, // keep prestige talents!
      }
    }

    case 'BUY_PRESTIGE_TALENT': {
      const talent = PRESTIGE_TALENTS.find(t => t.id === action.talentId)
      if (!talent) return state

      const currentLevel = state.prestigeTalents?.[talent.id] || 0
      if (talent.maxCount && currentLevel >= talent.maxCount) return state
      if ((state.royalJelly || 0) < talent.cost) return state

      return {
        ...state,
        royalJelly: state.royalJelly - talent.cost,
        prestigeTalents: {
          ...state.prestigeTalents,
          [talent.id]: currentLevel + 1,
        },
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

      // Apply synergy cost reduction if cyberOverclock is owned
      let costReduction = 1
      const cyberOverclockCount = state.synergyUpgrades?.['cyberOverclock'] || 0
      if (cyberOverclockCount > 0) {
        const cyberHiveCount = state.upgrades['cyberHive'] || 0
        const reduction = Math.min(0.5, cyberHiveCount * 0.02) // cap at 50%
        costReduction = 1 - reduction
      }

      const cost = Math.floor(getUpgradeCost(upgrade, currentCount) * costReduction)
      if (state.honey < cost) return state

      const newCount = currentCount + 1
      const newUpgrades = { ...state.upgrades, [upgrade.id]: newCount }

      // Recalculate total honey per second with milestones and synergies
      const newHPS = calculateHPS(newUpgrades, state.synergyUpgrades)

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

      // Recalculate click power with HPS synergy
      const newClickPower = calculateClickPower(newClickUpgrades, state.honeyPerSecond)

      return {
        ...state,
        honey: state.honey - cost,
        clickUpgrades: newClickUpgrades,
        clickPower: newClickPower,
      }
    }

    case 'BUY_SYNERGY_UPGRADE': {
      const synergy = SYNERGY_UPGRADES.find(s => s.id === action.synergyId)
      if (!synergy) return state

      const currentCount = state.synergyUpgrades?.[synergy.id] || 0
      if (synergy.maxCount && currentCount >= synergy.maxCount) return state

      const cost = getSynergyCost(synergy, currentCount)
      if (state.honey < cost) return state

      const newSynergyUpgrades = { ...state.synergyUpgrades, [synergy.id]: currentCount + 1 }

      // Recalculate HPS with new synergies
      const newHPS = calculateHPS(state.upgrades, newSynergyUpgrades)

      return {
        ...state,
        honey: state.honey - cost,
        synergyUpgrades: newSynergyUpgrades,
        honeyPerSecond: newHPS,
      }
    }

    case 'CLAIM_GIFT': {
      const gifts = state.pendingGifts || []
      const gift = gifts[action.giftIndex]
      if (!gift) return state

      let newState = { ...state }
      // Apply gift effect
      if (gift.type === 'nectar') {
        const bonus = gift.amount || (state.honeyPerSecond * 60) // 1 min of production
        newState.honey = state.honey + bonus
        newState.totalHoney = state.totalHoney + bonus
      } else if (gift.type === 'boost') {
        newState.blessingTimeLeft = (state.blessingTimeLeft || 0) + 30 // +30s blessing
      }

      // Remove claimed gift
      newState.pendingGifts = gifts.filter((_, i) => i !== action.giftIndex)
      return newState
    }

    case 'ADD_GIFT': {
      return {
        ...state,
        pendingGifts: [...(state.pendingGifts || []), action.gift],
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
  
  // Try to get auth context, but handle case where it might not be ready
  let friendsCount = 0
  try {
    const { userProfile } = useAuth()
    friendsCount = Math.min(userProfile?.friends?.length || 0, 10)
  } catch (err) {
    // Auth context not available yet
  }

  const click = useCallback(() => {
    dispatch({ type: 'CLICK', friendsCount })
  }, [friendsCount])

  const tick = useCallback((delta) => {
    dispatch({ type: 'TICK', delta, friendsCount })
  }, [friendsCount])

  const buyProductionUpgrade = useCallback((upgradeId) => {
    dispatch({ type: 'BUY_PRODUCTION_UPGRADE', upgradeId })
  }, [])

  const buyClickUpgrade = useCallback((upgradeId) => {
    dispatch({ type: 'BUY_CLICK_UPGRADE', upgradeId })
  }, [])

  const buySynergyUpgrade = useCallback((synergyId) => {
    dispatch({ type: 'BUY_SYNERGY_UPGRADE', synergyId })
  }, [])

  const buyPrestigeTalent = useCallback((talentId) => {
    dispatch({ type: 'BUY_PRESTIGE_TALENT', talentId })
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
    buySynergyUpgrade,
    buyPrestigeTalent,
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
