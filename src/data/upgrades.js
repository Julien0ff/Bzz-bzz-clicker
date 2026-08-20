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
    maxCount: 200,
  },
  {
    id: 'babyBee',
    name: 'Bébé Abeille',
    icon: '🐝',
    description: 'Une petite abeille travailleuse qui récolte du nectar.',
    baseCost: 100,
    baseProduction: 1,
    costMultiplier: 1.15,
    maxCount: 200,
  },
  {
    id: 'beehive',
    name: 'Ruche',
    icon: '🏠',
    description: 'Une ruche qui abrite plusieurs abeilles productrices.',
    baseCost: 1100,
    baseProduction: 8,
    costMultiplier: 1.15,
    maxCount: 200,
  },
  {
    id: 'extractor',
    name: 'Extracteur',
    icon: '🍯',
    description: 'Un extracteur de nectar haute performance.',
    baseCost: 12000,
    baseProduction: 47,
    costMultiplier: 1.15,
    maxCount: 200,
  },
  {
    id: 'queenBee',
    name: 'Reine',
    icon: '👑',
    description: "L'abeille reine commande toute la colonie.",
    baseCost: 130000,
    baseProduction: 260,
    costMultiplier: 1.15,
    maxCount: 200,
  },
  {
    id: 'honeyFactory',
    name: 'Usine à Miel',
    icon: '🏭',
    description: "Une usine entière dédiée à la production de miel.",
    baseCost: 1400000,
    baseProduction: 1400,
    costMultiplier: 1.15,
    maxCount: 200,
  },
  {
    id: 'alchemyLab',
    name: 'Laboratoire Apicole',
    icon: '🧪',
    description: "Des abeilles scientifiques optimisent la formule du miel.",
    baseCost: 20000000,
    baseProduction: 7800,
    costMultiplier: 1.15,
    maxCount: 200,
  },
  {
    id: 'netherPortal',
    name: 'Portail du Nether',
    icon: '🌌',
    description: "Récolte du miel de magma dans d'autres dimensions.",
    baseCost: 330000000,
    baseProduction: 44000,
    costMultiplier: 1.15,
    maxCount: 200,
  },
  {
    id: 'worldTree',
    name: "L'Arbre Monde",
    icon: '🌳',
    description: "Un arbre colossal abritant l'ultime colonie d'abeilles.",
    baseCost: 5000000000, // 5 Billion
    baseProduction: 180000,
    costMultiplier: 1.18,
    maxCount: 200,
  },
  {
    id: 'starHive',
    name: 'Ruche Stellaire',
    icon: '🌠',
    description: "Des abeilles astronautes récoltant du nectar céleste.",
    baseCost: 80000000000, // 80 Billion
    baseProduction: 950000,
    costMultiplier: 1.18,
    maxCount: 200,
  },
  {
    id: 'honeyDimension',
    name: 'Dimension de Miel',
    icon: '🌌',
    description: "Un portail vers une dimension faite de pur miel pur.",
    baseCost: 1500000000000, // 1.5 Trillion
    baseProduction: 4500000,
    costMultiplier: 1.18,
    maxCount: 200,
  },
  {
    id: 'galacticSwarm',
    name: "L'Essaim Galactique",
    icon: '💫',
    description: "Un essaim d'abeilles de la taille d'une galaxie.",
    baseCost: 20000000000000, // 20 Trillion
    baseProduction: 25000000,
    costMultiplier: 1.20,
    maxCount: 200,
  },
  {
    id: 'cyberHive',
    name: 'Ruche Cybernétique',
    icon: '🤖',
    description: "Des abeilles robots optimisées par l'Intelligence Artificielle.",
    baseCost: 350000000000000, // 350 Trillion
    baseProduction: 180000000,
    costMultiplier: 1.20,
    maxCount: 200,
  },
  {
    id: 'honeyWell',
    name: 'Puits de Miel',
    icon: '🕳️',
    description: "Un forage profond jusqu'au centre de la Terre pour du miel fossile.",
    baseCost: 5000000000000000, // 5 Quadrillion
    baseProduction: 950000000,
    costMultiplier: 1.20,
    maxCount: 200,
  },
  {
    id: 'blackHole',
    name: 'Trou Noir Mielleux',
    icon: '🌌',
    description: "Aspire le miel de toutes les dimensions parallèles à la fois.",
    baseCost: 75000000000000000, // 75 Quadrillion
    baseProduction: 6000000000,
    costMultiplier: 1.22,
    maxCount: 200,
  },
  {
    id: 'timeMachine',
    name: 'Machine Temporelle',
    icon: '⏳',
    description: "Récolte le miel du passé et du futur simultanément.",
    baseCost: 1000000000000000000, // 1 Quintillion
    baseProduction: 45000000000,
    costMultiplier: 1.22,
    maxCount: 200,
  },
  {
    id: 'multiverseHive',
    name: 'Ruche du Multivers',
    icon: '🌀',
    description: "Connecte les ruches de tous les univers connus et inconnus.",
    baseCost: 15000000000000000000, // 15 Quintillion
    baseProduction: 300000000000,
    costMultiplier: 1.20,
    maxCount: 200,
  },
  {
    id: 'beeGod',
    name: 'Dieu des Abeilles',
    icon: '👑',
    description: "L'entité créatrice de tout le miel existant.",
    baseCost: 250000000000000000000, // 250 Quintillion
    baseProduction: 2000000000000,
    costMultiplier: 1.20,
    maxCount: 200,
  },
]

export const CLICK_UPGRADES = [
  {
    id: 'stickyFinger',
    name: 'Doigt Collant',
    icon: '🖱️',
    description: 'Vos doigts collent au miel, augmentant la récolte par clic.',
    cost: 150,
    clickBonus: 1,
    hpsPercent: 0.5, // +0.5% du HPS par niveau
    oneTime: false,
    maxCount: 30,
    costMultiplier: 1.5,
  },
  {
    id: 'waxGloves',
    name: 'Gants en Cire',
    icon: '🧤',
    description: 'Des gants spéciaux qui captent le miel plus efficacement.',
    cost: 1000,
    clickBonus: 5,
    hpsPercent: 1,
    oneTime: false,
    maxCount: 30,
    costMultiplier: 1.5,
  },
  {
    id: 'beePaw',
    name: "Patte d'Abeille",
    icon: '🐾',
    description: "Vos mains se transforment en pattes d'abeille ultra efficaces.",
    cost: 25000,
    clickBonus: 25,
    hpsPercent: 1.5,
    oneTime: false,
    maxCount: 30,
    costMultiplier: 1.6,
  },
  {
    id: 'expBottle',
    name: "Fiole d'Expérience",
    icon: '✨',
    description: "La magie concentrée renforce votre puissance de clic.",
    cost: 500000,
    clickBonus: 100,
    hpsPercent: 2,
    oneTime: false,
    maxCount: 30,
    costMultiplier: 1.6,
  },
  {
    id: 'diamondSword',
    name: "Épée en Diamant",
    icon: '⚔️',
    description: "Parce que taper fort, ça marche aussi pour récolter le miel !",
    cost: 10000000,
    clickBonus: 500,
    hpsPercent: 2.5,
    oneTime: false,
    maxCount: 30,
    costMultiplier: 1.6,
  },
  {
    id: 'honeyAura',
    name: "Aura de Miel",
    icon: '🌟',
    description: "Une aura divine qui attire le miel à chaque mouvement.",
    cost: 250000000,
    clickBonus: 2500,
    hpsPercent: 3,
    oneTime: false,
    maxCount: 30,
    costMultiplier: 1.7,
  },
  {
    id: 'hardenedGloves',
    name: "Gants en Miel Durci",
    icon: '🥊',
    description: "Des poings capables de briser des montagnes de miel.",
    cost: 5000000000,
    clickBonus: 10000,
    hpsPercent: 3.5,
    oneTime: false,
    maxCount: 30,
    costMultiplier: 1.7,
  },
  {
    id: 'honeyLaser',
    name: "Rayon Laser Mielleux",
    icon: '💥',
    description: "Un laser qui désintègre la ruche pour en extraire le miel pur.",
    cost: 150000000000,
    clickBonus: 50000,
    hpsPercent: 4,
    oneTime: false,
    maxCount: 30,
    costMultiplier: 1.7,
  },
  {
    id: 'divineFinger',
    name: "Doigt Divin",
    icon: '☝️',
    description: "Le toucher du créateur lui-même.",
    cost: 5000000000000,
    clickBonus: 250000,
    hpsPercent: 5,
    oneTime: false,
    maxCount: 30,
    costMultiplier: 1.8,
  },
  {
    id: 'autoClicker',
    name: "Auto-Clicker Magique",
    icon: '⚙️',
    description: "Une machine antique qui clique automatiquement pour vous 1 fois par seconde.",
    cost: 100000000000000,
    clickBonus: 0,
    hpsPercent: 0,
    oneTime: true,
    maxCount: 1,
    costMultiplier: 1,
  },
  {
    id: 'infinityGauntlet',
    name: "Gantelet de l'Infini",
    icon: '🧤',
    description: "D'un simple claquement de doigt, la moitié de l'univers se transforme en miel.",
    cost: 5000000000000000,
    clickBonus: 1000000,
    hpsPercent: 6,
    oneTime: false,
    maxCount: 30,
    costMultiplier: 1.8,
  },
  {
    id: 'quantumFinger',
    name: "Doigt Quantique",
    icon: '⚛️',
    description: "Un clic existe et n'existe pas en même temps, générant une infinité de miel.",
    cost: 1000000000000000000, 
    clickBonus: 50000000,
    hpsPercent: 7,
    oneTime: false,
    maxCount: 30,
    costMultiplier: 1.8,
  },
  {
    id: 'bigBangClick',
    name: "Clic du Big Bang",
    icon: '💥',
    description: "L'origine de l'univers était en fait un clic géant sur une abeille.",
    cost: 500000000000000000000,
    clickBonus: 2500000000,
    hpsPercent: 10,
    oneTime: false,
    maxCount: 30,
    costMultiplier: 1.8,
  },
]

// ===================================================
// Building Milestones — x2 multiplier at each tier
// ===================================================
export const BUILDING_MILESTONES = [25, 50, 100, 150, 200]

/**
 * Get the milestone multiplier for a building based on count
 * Each milestone doubles the production: 25->x2, 50->x4, 100->x8, 150->x16, 200->x32
 */
export function getMilestoneMultiplier(count) {
  let multi = 1
  for (const threshold of BUILDING_MILESTONES) {
    if (count >= threshold) {
      multi *= 2
    }
  }
  return multi
}

// ===================================================
// Synergy Upgrades — Cross-building bonuses
// ===================================================
export const SYNERGY_UPGRADES = [
  {
    id: 'crossPollination',
    name: 'Pollenisation Croisée',
    icon: '🌼',
    description: 'Chaque Fleur augmente la production des Bébés Abeilles de +1%.',
    cost: 50000,
    costMultiplier: 1.5,
    maxCount: 1,
    sourceBuilding: 'flower',
    targetBuilding: 'babyBee',
    bonusPerSource: 0.01, // +1% per flower
  },
  {
    id: 'royalJellyElite',
    name: "Gelée d'Élite",
    icon: '👑',
    description: 'Les Reines augmentent la puissance de toutes les Ruches de +5%.',
    cost: 5000000,
    costMultiplier: 1.5,
    maxCount: 1,
    sourceBuilding: 'queenBee',
    targetBuilding: 'beehive',
    bonusPerSource: 0.05, // +5% per queen
  },
  {
    id: 'cyberOverclock',
    name: 'Overclock Cybernétique',
    icon: '🤖',
    description: 'Les Ruches Cybernétiques réduisent le coût de tous les bâtiments de 2%.',
    cost: 500000000000000,
    costMultiplier: 1.5,
    maxCount: 1,
    sourceBuilding: 'cyberHive',
    costReductionPerSource: 0.02, // -2% cost per cyberHive (capped)
  },
  {
    id: 'factoryHarvest',
    name: 'Récolte Industrielle',
    icon: '🏭',
    description: "Chaque Usine à Miel augmente la production de l'Extracteur de +3%.",
    cost: 10000000,
    costMultiplier: 1.5,
    maxCount: 1,
    sourceBuilding: 'honeyFactory',
    targetBuilding: 'extractor',
    bonusPerSource: 0.03,
  },
  {
    id: 'netherInfusion',
    name: 'Infusion du Nether',
    icon: '🔥',
    description: "Les Portails du Nether boostent le Laboratoire Apicole de +4%.",
    cost: 500000000,
    costMultiplier: 1.5,
    maxCount: 1,
    sourceBuilding: 'netherPortal',
    targetBuilding: 'alchemyLab',
    bonusPerSource: 0.04,
  },
  {
    id: 'cosmicHarmony',
    name: 'Harmonie Cosmique',
    icon: '✨',
    description: "Les Ruches Stellaires boostent l'Arbre Monde de +3%.",
    cost: 500000000000,
    costMultiplier: 1.5,
    maxCount: 1,
    sourceBuilding: 'starHive',
    targetBuilding: 'worldTree',
    bonusPerSource: 0.03,
  },
  {
    id: 'dimensionLink',
    name: 'Lien Dimensionnel',
    icon: '🌀',
    description: 'Les Dimensions de Miel augmentent la puissance des Trous Noirs de +5%.',
    cost: 100000000000000,
    costMultiplier: 1.5,
    maxCount: 1,
    sourceBuilding: 'honeyDimension',
    targetBuilding: 'blackHole',
    bonusPerSource: 0.05,
  },
  {
    id: 'temporalEcho',
    name: 'Écho Temporel',
    icon: '⏳',
    description: 'Les Machines Temporelles boostent la Ruche du Multivers de +4%.',
    cost: 50000000000000000,
    costMultiplier: 1.5,
    maxCount: 1,
    sourceBuilding: 'timeMachine',
    targetBuilding: 'multiverseHive',
    bonusPerSource: 0.04,
  },
]

// ===================================================
// Prestige Talents — Buyable with Royal Jelly
// ===================================================
export const PRESTIGE_TALENTS = [
  {
    id: 'goldenSpeed',
    name: "Instinct Doré",
    icon: '⚡',
    description: "L'Abeille Dorée apparaît 25% plus souvent.",
    cost: 1,
    maxCount: 4, // stackable up to 4 times = 100% faster
    effect: 'goldenBeeSpeed',
    effectValue: 0.25, // per level
  },
  {
    id: 'clickForce',
    name: "Force du Clic",
    icon: '💪',
    description: "Multiplie la puissance de clic par x1.5.",
    cost: 2,
    maxCount: 5,
    effect: 'clickMultiplier',
    effectValue: 1.5, // multiplicative per level
  },
  {
    id: 'productionBoost',
    name: "Boost de Production",
    icon: '🚀',
    description: "Multiplie toute la production passive par x1.25.",
    cost: 3,
    maxCount: 10,
    effect: 'productionMultiplier',
    effectValue: 1.25,
  },
  {
    id: 'headStart',
    name: "Départ en Trombe",
    icon: '🏁',
    description: "Commencez chaque prestige avec 10 000 miel.",
    cost: 1,
    maxCount: 5, // stackable: 10k, 20k, 30k...
    effect: 'startingHoney',
    effectValue: 10000,
  },
  {
    id: 'frenzyDuration',
    name: "Frenzy Prolongé",
    icon: '🔥',
    description: "La durée de la Frenzy augmente de +10 secondes.",
    cost: 2,
    maxCount: 5,
    effect: 'frenzyDuration',
    effectValue: 10, // seconds per level
  },
  {
    id: 'jellyHarvest',
    name: "Récolte de Gelée",
    icon: '🍯',
    description: "Gagnez 10% de Gelée Royale en plus lors de l'Ascension.",
    cost: 5,
    maxCount: 10,
    effect: 'jellyBonus',
    effectValue: 0.10, // +10% per level
  },
  {
    id: 'comboMaster',
    name: "Maître du Combo",
    icon: '🎯',
    description: "La jauge de combo se remplit 20% plus vite.",
    cost: 3,
    maxCount: 5,
    effect: 'comboSpeed',
    effectValue: 0.20,
  },
  {
    id: 'milestonePower',
    name: "Pouvoir des Paliers",
    icon: '📈',
    description: "Les paliers de bâtiments donnent x2.5 au lieu de x2.",
    cost: 10,
    maxCount: 1,
    effect: 'milestoneBoost',
    effectValue: 2.5,
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
 * Calculate synergy upgrade cost
 */
export function getSynergyCost(synergy, count) {
  return Math.floor(synergy.cost * Math.pow(synergy.costMultiplier, count))
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
