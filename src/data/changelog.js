// ===================================================
// Changelog Data — What's new in each version
// ===================================================

export const APP_VERSION = '4.0.0' // Current deployed version

export const CHANGELOGS = [
  {
    version: '4.0.0',
    title: '⚔️ Mise à Jour : Raid Coop & Corrections Globales',
    date: '20 Août 2026',
    badge: 'ACTUELLE',
    highlights: [
      {
        type: 'new',
        icon: '⚔️',
        label: 'Raid Coopératif de Ruche',
        desc: 'Unissez vos forces avec tous les apiculteurs pour vaincre le Frelon Colossal et remporter du miel et de la Gelée Royale !'
      },
      {
        type: 'fix',
        icon: '🌐',
        label: 'Correction Erreur 404',
        desc: 'Rafraîchir la page sur /friends, /stats ou /leaderboard fonctionne désormais sans aucune erreur 404.'
      },
      {
        type: 'balance',
        icon: '🐝',
        label: 'Fréquence Abeille Dorée Réajustée',
        desc: 'Apparition rééquilibrée (entre 1 et 3 minutes) pour préserver la rareté et la puissance des buffs.'
      },
      {
        type: 'ui',
        icon: '🎨',
        label: 'Refonte Visuelle de la Boutique',
        desc: 'Paliers intégrés directement dans les cartes de bâtiments et typographie nettement plus lisible pour les descriptions de synergies.'
      },
      {
        type: 'social',
        icon: '👥',
        label: 'Synchronisation des Demandes d\'Amis',
        desc: 'Correction du statut en attente lors de l\'acceptation mutuelle et actualisation automatique en temps réel.'
      }
    ]
  },
  {
    version: '3.5.0',
    title: '✨ Mise à Jour : Grand Dé-nerf & Boutique Céleste',
    date: '20 Août 2026',
    highlights: [
      {
        type: 'balance',
        icon: '⚡',
        label: 'Jauge de Combo & Fièvre',
        desc: 'Enchaînez les clics pour débloquer des multiplicateurs allant jusqu\'à x5.'
      },
      {
        type: 'balance',
        icon: '📈',
        label: 'Synergie Clics / HPS',
        desc: 'Vos améliorations de clic profitent directement de votre production passive.'
      },
      {
        type: 'new',
        icon: '👑',
        label: 'Boutique Céleste (Prestige)',
        desc: 'Dépensez votre Gelée Royale dans un arbre de talents permanents.'
      },
      {
        type: 'new',
        icon: '🔬',
        label: 'Recherches & Synergies',
        desc: '8 synergies inter-bâtiments pour booster les ruches, abeilles et fleurs.'
      }
    ]
  }
]
