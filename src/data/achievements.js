// ===================================================
// Achievements Data
// ===================================================

export const ACHIEVEMENTS = [
  // Clicks
  {
    id: 'clicks_100',
    name: "Échauffement",
    description: "Effectuez 100 clics manuels.",
    icon: '🖱️',
    condition: (state) => state.totalClicks >= 100
  },
  {
    id: 'clicks_1000',
    name: "Doigts Engourdis",
    description: "Effectuez 1 000 clics manuels.",
    icon: '⚡',
    condition: (state) => state.totalClicks >= 1000
  },
  {
    id: 'clicks_10000',
    name: "Syndrome du Canal Carpien",
    description: "Effectuez 10 000 clics manuels.",
    icon: '🔥',
    condition: (state) => state.totalClicks >= 10000
  },
  {
    id: 'clicks_50000',
    name: "Machine à Cliquer",
    description: "Effectuez 50 000 clics manuels.",
    icon: '🦾',
    condition: (state) => state.totalClicks >= 50000
  },

  // Total Honey
  {
    id: 'honey_100k',
    name: "Pot de Miel",
    description: "Atteindre 100 000 de miel récolté au total.",
    icon: '🍯',
    condition: (state) => state.totalHoney >= 100000
  },
  {
    id: 'honey_1m',
    name: "Millionnaire",
    description: "Atteindre 1 000 000 de miel récolté au total.",
    icon: '💰',
    condition: (state) => state.totalHoney >= 1000000
  },
  {
    id: 'honey_1b',
    name: "Milliardaire Apicole",
    description: "Atteindre 1 000 000 000 de miel récolté au total.",
    icon: '👑',
    condition: (state) => state.totalHoney >= 1000000000
  },
  {
    id: 'honey_1t',
    name: "Trillionnaire",
    description: "Atteindre 1 000 000 000 000 de miel récolté au total.",
    icon: '💎',
    condition: (state) => state.totalHoney >= 1000000000000
  },
  {
    id: 'honey_1qa',
    name: "Quadrillionnaire",
    description: "Atteindre 1 000 000 000 000 000 de miel récolté au total.",
    icon: '🌌',
    condition: (state) => state.totalHoney >= 1000000000000000
  },

  // Upgrades
  {
    id: 'factory_owner',
    name: "Industriel",
    description: "Posséder au moins une Usine à Miel.",
    icon: '🏭',
    condition: (state) => (state.upgrades['honeyFactory'] || 0) >= 1
  },
  {
    id: 'world_tree_owner',
    name: "Maître de la Nature",
    description: "Posséder L'Arbre Monde.",
    icon: '🌳',
    condition: (state) => (state.upgrades['worldTree'] || 0) >= 1
  },
  {
    id: 'all_click_upgrades',
    name: "Puissance Absolue",
    description: "Posséder l'Aura de Miel.",
    icon: '🌟',
    condition: (state) => (state.clickUpgrades['honeyAura'] || 0) >= 1
  },
  {
    id: 'black_hole_owner',
    name: "Maître des Dimensions",
    description: "Posséder au moins un Trou Noir Mielleux.",
    icon: '🕳️',
    condition: (state) => (state.upgrades['blackHole'] || 0) >= 1
  },
  {
    id: 'auto_clicker_owner',
    name: "Automatisation Antique",
    description: "Obtenir l'Auto-Clicker Magique.",
    icon: '⚙️',
    condition: (state) => (state.clickUpgrades['autoClicker'] || 0) >= 1
  },
  
  // Playtime
  {
    id: 'time_1h',
    name: "Apiculteur Dévoué",
    description: "Jouer pendant 1 heure au total.",
    icon: '⏱️',
    condition: (state) => state.playTime >= 3600
  },
  {
    id: 'time_10h',
    name: "Pas de Vie, Juste du Miel",
    description: "Jouer pendant 10 heures au total.",
    icon: '⏳',
    condition: (state) => state.playTime >= 36000
  }
]
