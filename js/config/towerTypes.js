/** Tower type definitions — add new towers here without touching core logic. */
export const TOWER_TYPES = {
  needle: {
    id: 'needle',
    name: 'Needle Post',
    description: 'Rapid shots — reliable early defense.',
    cost: 40,
    color: '#3d9970',
    icon: '△',
    baseStats: {
      damage: 9,
      range: 3.6,
      attackSpeed: 1.3,
    },
    upgradeCosts: {
      damage: [25, 40, 65, 95],
      range: [20, 35, 55, 80],
      attackSpeed: [28, 45, 70, 100],
    },
    upgradeMultipliers: {
      damage: 1.38,
      range: 1.16,
      attackSpeed: 1.22,
    },
    maxUpgradeLevel: 4,
    projectileColor: '#2ecc71',
    projectileSpeed: 13,
  },

  boulder: {
    id: 'boulder',
    name: 'Boulder Pit',
    description: 'Slow, heavy shots that splash nearby foes.',
    cost: 70,
    color: '#c0392b',
    icon: '◆',
    baseStats: {
      damage: 28,
      range: 2.9,
      attackSpeed: 0.45,
      splashRadius: 1.3,
    },
    upgradeCosts: {
      damage: [35, 55, 85, 125],
      range: [25, 40, 60, 90],
      attackSpeed: [38, 60, 90, 125],
    },
    upgradeMultipliers: {
      damage: 1.42,
      range: 1.14,
      attackSpeed: 1.18,
    },
    maxUpgradeLevel: 4,
    projectileColor: '#922b21',
    projectileSpeed: 9,
    splashRadiusGrowth: 0.18,
  },

  prism: {
    id: 'prism',
    name: 'Prism Spire',
    description: 'Long reach and steady arcane damage.',
    cost: 55,
    color: '#6c5ce7',
    icon: '◇',
    baseStats: {
      damage: 15,
      range: 4.8,
      attackSpeed: 0.85,
    },
    upgradeCosts: {
      damage: [28, 45, 70, 105],
      range: [25, 42, 65, 95],
      attackSpeed: [32, 50, 78, 115],
    },
    upgradeMultipliers: {
      damage: 1.34,
      range: 1.2,
      attackSpeed: 1.2,
    },
    maxUpgradeLevel: 4,
    projectileColor: '#a29bfe',
    projectileSpeed: 11,
  },
};
