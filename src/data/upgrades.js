// ===================================================
// Upgrades Data — Game Balance Configuration
// ===================================================

export const PRODUCTION_UPGRADES = [
  {
    id: 'flower',
    name: 'Fleur',
    icon: '🌸',
    description: 'Une jolie fleur qui attire les abeilles.',
    baseCost: 15,
    baseProduction: 0.1,
    costMultiplier: 1.15,
  },
  {
    id: 'babyBee',
    name: 'Bébé Abeille',
    icon: '🐝',
    description: 'Une petite abeille travailleuse qui récolte du nectar.',
    baseCost: 100,
    baseProduction: 1,
    costMultiplier: 1.15,
  },
  {
    id: 'beehive',
    name: 'Ruche',
    icon: '🏠',
    description: 'Une ruche qui abrite plusieurs abeilles productrices.',
    baseCost: 1100,
    baseProduction: 8,
    costMultiplier: 1.15,
  },
  {
    id: 'extractor',
    name: 'Extracteur',
    icon: '🍯',
    description: 'Un extracteur de nectar haute performance.',
    baseCost: 12000,
    baseProduction: 47,
    costMultiplier: 1.15,
  },
  {
    id: 'queenBee',
    name: 'Reine',
    icon: '👑',
    description: "L'abeille reine commande toute la colonie.",
    baseCost: 130000,
    baseProduction: 260,
    costMultiplier: 1.15,
  },
  {
    id: 'honeyFactory',
    name: 'Usine à Miel',
    icon: '🏭',
    description: "Une usine entière dédiée à la production de miel.",
    baseCost: 1400000,
    baseProduction: 1400,
    costMultiplier: 1.15,
  },
]

export const CLICK_UPGRADES = [
  {
    id: 'stickyFinger',
    name: 'Doigt Collant',
    icon: '🖱️',
    description: 'Vos doigts collent au miel, augmentant la récolte par clic.',
    cost: 100,
    clickBonus: 1,
    oneTime: false,
    maxCount: 10,
    costMultiplier: 2.5,
  },
  {
    id: 'waxGloves',
    name: 'Gants en Cire',
    icon: '🧤',
    description: 'Des gants spéciaux qui captent le miel plus efficacement.',
    cost: 500,
    clickBonus: 5,
    oneTime: false,
    maxCount: 10,
    costMultiplier: 2.5,
  },
  {
    id: 'beePaw',
    name: "Patte d'Abeille",
    icon: '🐾',
    description: "Vos mains se transforment en pattes d'abeille ultra efficaces.",
    cost: 10000,
    clickBonus: 50,
    oneTime: false,
    maxCount: 10,
    costMultiplier: 2.5,
  },
]

/**
 * Calculate the current cost of an upgrade based on how many the player owns
 */
export function getUpgradeCost(upgrade, count) {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, count))
}

/**
 * Calculate click upgrade cost based on how many the player owns
 */
export function getClickUpgradeCost(upgrade, count) {
  return Math.floor(upgrade.cost * Math.pow(upgrade.costMultiplier, count))
}

/**
 * Format large numbers (e.g., 1,234,567 → 1.23M)
 */
export function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '0'

  if (num < 1000) {
    return num % 1 === 0 ? num.toString() : num.toFixed(1)
  }

  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc']
  const tier = Math.floor(Math.log10(Math.abs(num)) / 3)

  if (tier === 0) return num.toFixed(0)
  if (tier >= suffixes.length) return num.toExponential(2)

  const suffix = suffixes[tier]
  const scale = Math.pow(10, tier * 3)
  const scaled = num / scale

  return scaled.toFixed(2) + suffix
}
