// ===================================================
// Changelog Data — What's new in each version
// ===================================================

export const APP_VERSION = '4.5.0' // Current deployed version

export const CHANGELOGS = [
  {
    version: '4.5.0',
    title: '⚔️ Mise à Jour : Salons de Raid, Animations & Cooldowns',
    date: '20 Août 2026',
    badge: 'ACTUELLE',
    highlights: [
      {
        type: 'new',
        icon: '🏰',
        label: 'Salons de Raid & Invitations d\'Amis',
        desc: 'Créez votre propre salon de combat ou rejoignez celui d\'un ami. Invitez vos compagnons en un clic avec notification instantanée !'
      },
      {
        type: 'new',
        icon: '👥',
        label: 'Règle des 2 Joueurs Minimum & Statut Prêt',
        desc: 'Le combat ne peut démarrer qu\'avec au moins 2 apiculteurs prêts dans le salon pour une vraie expérience coopérative.'
      },
      {
        type: 'ui',
        icon: '💥',
        label: 'Animations & Effets Tranchants (Slash FX)',
        desc: 'Animation de flottement du boss, secousses violentes à l\'impact, flashs lumineux et effets de coups d\'épée lors de chaque attaque.'
      },
      {
        type: 'balance',
        icon: '⏳',
        label: 'Paliers de Boss & Chronomètres de Réapparition',
        desc: '3 Boss colossaux avec temps de récupération échelonnés (30 min, 1h, 1h30) et compte à rebours en direct entre chaque victoire.'
      },
      {
        type: 'fix',
        icon: '🛡️',
        label: 'Optimisations & Zéro Erreur Console',
        desc: 'Correction du chargement de la police Minecraft et sécurisation de tous les écouteurs réseau Firestore.'
      }
    ]
  },
  {
    version: '4.0.0',
    title: '⚔️ Mise à Jour : Raid Coop & Corrections Globales',
    date: '20 Août 2026',
    highlights: [
      {
        type: 'new',
        icon: '⚔️',
        label: 'Raid Coopératif de Ruche',
        desc: 'Affrontez le Frelon Colossal et remportez du miel et de la Gelée Royale !'
      },
      {
        type: 'fix',
        icon: '🌐',
        label: 'Correction Erreur 404',
        desc: 'Rafraîchir la page sur /friends, /stats ou /leaderboard fonctionne sans erreur 404.'
      },
      {
        type: 'balance',
        icon: '🐝',
        label: 'Abeille Dorée Rééquilibrée',
        desc: 'Apparition ajustée entre 1 et 3 minutes pour préserver la rareté des buffs.'
      },
      {
        type: 'ui',
        icon: '🎨',
        label: 'Refonte de la Boutique',
        desc: 'Paliers intégrés directement dans les cartes et typographie fluide.'
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
        desc: 'Enchaînez les clics pour débloquer des multiplicateurs jusqu\'à x5.'
      },
      {
        type: 'balance',
        icon: '📈',
        label: 'Synergie Clics / HPS',
        desc: 'Les améliorations de clic profitent directement de votre production/sec.'
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
        desc: '8 synergies inter-bâtiments pour doper vos ruches et abeilles.'
      }
    ]
  }
]
