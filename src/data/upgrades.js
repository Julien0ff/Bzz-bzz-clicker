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
    maxCount: 100,
  },
  {
    id: 'babyBee',
    name: 'Bébé Abeille',
    icon: '🐝',
    description: 'Une petite abeille travailleuse qui récolte du nectar.',
    baseCost: 100,
    baseProduction: 1,
    costMultiplier: 1.15,
    maxCount: 100,
  },
  {
    id: 'beehive',
    name: 'Ruche',
    icon: '🏠',
    description: 'Une ruche qui abrite plusieurs abeilles productrices.',
    baseCost: 1100,
    baseProduction: 8,
    costMultiplier: 1.15,
    maxCount: 100,
  },
  {
    id: 'extractor',
    name: 'Extracteur',
    icon: '🍯',
    description: 'Un extracteur de nectar haute performance.',
    baseCost: 12000,
    baseProduction: 47,
    costMultiplier: 1.15,
    maxCount: 100,
  },
  {
    id: 'queenBee',
    name: 'Reine',
    icon: '👑',
    description: "L'abeille reine commande toute la colonie.",
    baseCost: 130000,
    baseProduction: 260,
    costMultiplier: 1.15,
    maxCount: 100,
  },
  {
    id: 'honeyFactory',
    name: 'Usine à Miel',
    icon: '🏭',
    description: "Une usine entière dédiée à la production de miel.",
    baseCost: 1400000,
    baseProduction: 1400,
    costMultiplier: 1.15,
    maxCount: 100,
  },
  {
    id: 'alchemyLab',
    name: 'Laboratoire Apicole',
    icon: '🧪',
    description: "Des abeilles scientifiques optimisent la formule du miel.",
    baseCost: 20000000,
    baseProduction: 7800,
    costMultiplier: 1.15,
    maxCount: 100,
  },
  {
    id: 'netherPortal',
    name: 'Portail du Nether',
    icon: '🌌',
    description: "Récolte du miel de magma dans d'autres dimensions.",
    baseCost: 330000000,
    baseProduction: 44000,
    costMultiplier: 1.15,
    maxCount: 100,
  },
  {
    id: 'worldTree',
    name: "L'Arbre Monde",
    icon: '🌳',
    description: "Un arbre colossal abritant l'ultime colonie d'abeilles.",
    baseCost: 5000000000,
    baseProduction: 260000,
    costMultiplier: 1.15,
    maxCount: 100,
  },
  {
    id: 'starHive',
    name: 'Ruche Stellaire',
    icon: '🌠',
    description: "Des abeilles astronautes récoltant du nectar céleste.",
    baseCost: 150000000000,
    baseProduction: 15000000,
    costMultiplier: 1.15,
    maxCount: 100,
  },
  {
    id: 'honeyDimension',
    name: 'Dimension de Miel',
    icon: '🌌',
    description: "Un portail vers une dimension faite de pur miel pur.",
    baseCost: 20000000000000,
    baseProduction: 1500000000,
    costMultiplier: 1.15,
    maxCount: 100,
  },
  {
    id: 'galacticSwarm',
    name: "L'Essaim Galactique",
    icon: '💫',
    description: "Un essaim d'abeilles de la taille d'une galaxie.",
    baseCost: 5000000000000000,
    baseProduction: 250000000000,
    costMultiplier: 1.15,
    maxCount: 100,
  },
  {
    id: 'cyberHive',
    name: 'Ruche Cybernétique',
    icon: '🤖',
    description: "Des abeilles robots optimisées par l'Intelligence Artificielle.",
    baseCost: 250000000000000000,
    baseProduction: 12000000000000,
    costMultiplier: 1.15,
    maxCount: 100,
  },
  {
    id: 'honeyWell',
    name: 'Puits de Miel',
    icon: '🕳️',
    description: "Un forage profond jusqu'au centre de la Terre pour du miel fossile.",
    baseCost: 5000000000000000000,
    baseProduction: 250000000000000,
    costMultiplier: 1.15,
    maxCount: 100,
  },
  {
    id: 'blackHole',
    name: 'Trou Noir Mielleux',
    icon: '🌌',
    description: "Aspire le miel de toutes les dimensions parallèles à la fois.",
    baseCost: 500000000000000000000,
    baseProduction: 25000000000000000,
    costMultiplier: 1.15,
    maxCount: 100,
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
    maxCount: 20,
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
    maxCount: 20,
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
    maxCount: 20,
    costMultiplier: 2.5,
  },
  {
    id: 'expBottle',
    name: "Fiole d'Expérience",
    icon: '✨',
    description: "La magie concentrée renforce votre puissance de clic.",
    cost: 250000,
    clickBonus: 500,
    oneTime: false,
    maxCount: 20,
    costMultiplier: 2.5,
  },
  {
    id: 'diamondSword',
    name: "Épée en Diamant",
    icon: '⚔️',
    description: "Parce que taper fort, ça marche aussi pour récolter le miel !",
    cost: 5000000,
    clickBonus: 5000,
    oneTime: false,
    maxCount: 20,
    costMultiplier: 2.5,
  },
  {
    id: 'honeyAura',
    name: "Aura de Miel",
    icon: '🌟',
    description: "Une aura divine qui attire le miel à chaque mouvement.",
    cost: 100000000,
    clickBonus: 50000,
    oneTime: false,
    maxCount: 20,
    costMultiplier: 2.5,
  },
  {
    id: 'hardenedGloves',
    name: "Gants en Miel Durci",
    icon: '🥊',
    description: "Des poings capables de briser des montagnes de miel.",
    cost: 5000000000,
    clickBonus: 10000000,
    oneTime: false,
    maxCount: 20,
    costMultiplier: 2.5,
  },
  {
    id: 'honeyLaser',
    name: "Rayon Laser Mielleux",
    icon: '💥',
    description: "Un laser qui désintègre la ruche pour en extraire le miel pur.",
    cost: 500000000000,
    clickBonus: 1500000000,
    oneTime: false,
    maxCount: 20,
    costMultiplier: 2.5,
  },
  {
    id: 'divineFinger',
    name: "Doigt Divin",
    icon: '☝️',
    description: "Le toucher du créateur lui-même.",
    cost: 50000000000000,
    clickBonus: 250000000000,
    oneTime: false,
    maxCount: 20,
    costMultiplier: 2.5,
  },
  {
    id: 'autoClicker',
    name: "Auto-Clicker Magique",
    icon: '⚙️',
    description: "Une machine antique qui clique automatiquement pour vous 1 fois par seconde.",
    cost: 1000000000000000,
    clickBonus: 0,
    oneTime: true,
    maxCount: 1,
    costMultiplier: 1,
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
