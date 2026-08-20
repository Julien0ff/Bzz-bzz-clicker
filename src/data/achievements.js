// ===================================================
// Achievements Data — Full Achievement Registry
// ===================================================

export const ACHIEVEMENTS = [
  // --- CLICS MANUELS ---
  {
    id: 'clicks_100',
    name: "Échauffement",
    description: "Effectuez 100 clics manuels.",
    icon: '🖱️',
    condition: (state) => (state.totalClicks || 0) >= 100,
  },
  {
    id: 'clicks_1000',
    name: "Doigts Engourdis",
    description: "Effectuez 1 000 clics manuels.",
    icon: '⚡',
    condition: (state) => (state.totalClicks || 0) >= 1000,
  },
  {
    id: 'clicks_10000',
    name: "Syndrome du Canal Carpien",
    description: "Effectuez 10 000 clics manuels.",
    icon: '🔥',
    condition: (state) => (state.totalClicks || 0) >= 10000,
  },
  {
    id: 'clicks_50000',
    name: "Machine à Cliquer",
    description: "Effectuez 50 000 clics manuels.",
    icon: '🦾',
    condition: (state) => (state.totalClicks || 0) >= 50000,
  },
  {
    id: 'clicks_250000',
    name: "La Légende du Clic",
    description: "Effectuez 250 000 clics manuels.",
    icon: '🏆',
    condition: (state) => (state.totalClicks || 0) >= 250000,
  },
  {
    id: 'clicks_1000000',
    name: "Destructeur de Souris",
    description: "Effectuez 1 000 000 de clics manuels.",
    icon: '💥',
    condition: (state) => (state.totalClicks || 0) >= 1000000,
  },

  // --- RÉCOLTE TOTALE DE MIEL ---
  {
    id: 'honey_100k',
    name: "Pot de Miel",
    description: "Atteindre 100 000 de miel récolté au total.",
    icon: '🍯',
    condition: (state) => (state.totalHoney || 0) >= 100000,
  },
  {
    id: 'honey_1m',
    name: "Millionnaire Apicole",
    description: "Atteindre 1 000 000 de miel récolté au total.",
    icon: '💰',
    condition: (state) => (state.totalHoney || 0) >= 1000000,
  },
  {
    id: 'honey_1b',
    name: "Milliardaire Apicole",
    description: "Atteindre 1 000 000 000 de miel récolté au total.",
    icon: '👑',
    condition: (state) => (state.totalHoney || 0) >= 1000000000,
  },
  {
    id: 'honey_1t',
    name: "Trillionnaire",
    description: "Atteindre 1 Trillion (1 000 Milliards) de miel au total.",
    icon: '💎',
    condition: (state) => (state.totalHoney || 0) >= 1000000000000,
  },
  {
    id: 'honey_1qa',
    name: "Quadrillionnaire",
    description: "Atteindre 1 Quadrillion de miel récolté au total.",
    icon: '🌌',
    condition: (state) => (state.totalHoney || 0) >= 1e15,
  },
  {
    id: 'honey_1qi',
    name: "Quintillionnaire",
    description: "Atteindre 1 Quintillion de miel récolté au total.",
    icon: '🪐',
    condition: (state) => (state.totalHoney || 0) >= 1e18,
  },
  {
    id: 'honey_1sx',
    name: "Sextillionnaire",
    description: "Atteindre 1 Sextillion de miel récolté au total.",
    icon: '✨',
    condition: (state) => (state.totalHoney || 0) >= 1e21,
  },
  {
    id: 'honey_1sp',
    name: "Septillionnaire",
    description: "Atteindre 1 Septillion de miel récolté au total.",
    icon: '🌠',
    condition: (state) => (state.totalHoney || 0) >= 1e24,
  },

  // --- ABEILLES DORÉES ---
  {
    id: 'golden_bee_1',
    name: "Rayon Doré",
    description: "Attrapez votre première Abeille Dorée.",
    icon: '🐝',
    condition: (state) => (state.goldenBeesClicked || 0) >= 1,
  },
  {
    id: 'golden_bee_25',
    name: "Chasseur Céleste",
    description: "Attrapez 25 Abeilles Dorées.",
    icon: '🌟',
    condition: (state) => (state.goldenBeesClicked || 0) >= 25,
  },
  {
    id: 'golden_bee_100',
    name: "Maître des Tempêtes",
    description: "Attrapez 100 Abeilles Dorées.",
    icon: '⚡',
    condition: (state) => (state.goldenBeesClicked || 0) >= 100,
  },

  // --- COMBO & FIÈVRE ---
  {
    id: 'combo_tier_5',
    name: "Fièvre Furieuse",
    description: "Atteignez le niveau maximal de Combo (Fièvre x5).",
    icon: '🔥',
    condition: (state) => (state.comboTier || 0) >= 4,
  },

  // --- BÂTIMENTS & CLICS ---
  {
    id: 'factory_owner',
    name: "Industriel",
    description: "Posséder au moins une Usine à Miel.",
    icon: '🏭',
    condition: (state) => (state.upgrades?.['honeyFactory'] || 0) >= 1,
  },
  {
    id: 'world_tree_owner',
    name: "Maître de la Nature",
    description: "Posséder L'Arbre Monde.",
    icon: '🌳',
    condition: (state) => (state.upgrades?.['worldTree'] || 0) >= 1,
  },
  {
    id: 'honey_aura_owner',
    name: "Aura Divine",
    description: "Posséder l'amélioration de clic Aura de Miel.",
    icon: '🌟',
    condition: (state) => (state.clickUpgrades?.['honeyAura'] || 0) >= 1,
  },
  {
    id: 'black_hole_owner',
    name: "Maître des Dimensions",
    description: "Posséder au moins un Trou Noir Mielleux.",
    icon: '🕳️',
    condition: (state) => (state.upgrades?.['blackHole'] || 0) >= 1,
  },
  {
    id: 'auto_clicker_owner',
    name: "Automatisation Antique",
    description: "Obtenir l'Auto-Clicker Magique.",
    icon: '⚙️',
    condition: (state) => (state.clickUpgrades?.['autoClicker'] || 0) >= 1,
  },
  {
    id: 'god_owner',
    name: "Le Créateur",
    description: "Posséder le Dieu des Abeilles.",
    icon: '👑',
    condition: (state) => (state.upgrades?.['beeGod'] || 0) >= 1,
  },
  {
    id: 'big_bang_owner',
    name: "L'Origine du Tout",
    description: "Posséder le Clic du Big Bang.",
    icon: '💥',
    condition: (state) => (state.clickUpgrades?.['bigBangClick'] || 0) >= 1,
  },

  // --- SYNERGIES & PRESTIGE ---
  {
    id: 'synergies_5',
    name: "Bio-Ingénieur",
    description: "Débloquer au moins 5 améliorations de Synergies.",
    icon: '🧬',
    condition: (state) =>
      Object.values(state.synergyUpgrades || {}).reduce((a, b) => a + b, 0) >= 5,
  },
  {
    id: 'prestige_1',
    name: "Renaissance Royale",
    description: "Effectuer au moins une Ascension et récolter de la Gelée Royale.",
    icon: '🌌',
    condition: (state) =>
      (state.prestigeCount || 0) >= 1 || (state.royalJelly || 0) >= 1,
  },

  // --- TEMPS DE JEU ---
  {
    id: 'time_1h',
    name: "Apiculteur Dévoué",
    description: "Jouer pendant 1 heure au total.",
    icon: '⏱️',
    condition: (state) => (state.playTime || 0) >= 3600,
  },
  {
    id: 'time_10h',
    name: "Pas de Vie, Juste du Miel",
    description: "Jouer pendant 10 heures au total.",
    icon: '⏳',
    condition: (state) => (state.playTime || 0) >= 36000,
  },
  {
    id: 'time_100h',
    name: "Abeille Vétérante",
    description: "Jouer pendant 100 heures au total.",
    icon: '🧟',
    condition: (state) => (state.playTime || 0) >= 360000,
  },
]
