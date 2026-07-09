/** Tower type definitions — add new towers here without touching core logic. */
export const TOWER_TYPES = {
  arrow: {
    id: 'arrow',
    name: 'Arrow Tower',
    description: 'Fast attacks, good for weak enemies.',
    cost: 50,
    color: '#2ecc71',
    icon: '▲',
    baseStats: {
      damage: 8,
      range: 3.5,
      attackSpeed: 1.2,
    },
    upgradeCosts: {
      damage: [30, 50, 80, 120],
      range: [25, 40, 60, 90],
      attackSpeed: [35, 55, 85, 120],
    },
    upgradeMultipliers: {
      damage: 1.35,
      range: 1.15,
      attackSpeed: 1.2,
    },
    maxUpgradeLevel: 4,
    projectileColor: '#27ae60',
    projectileSpeed: 12,
  },

  cannon: {
    id: 'cannon',
    name: 'Cannon Tower',
    description: 'Slow but powerful splash damage.',
    cost: 80,
    color: '#e74c3c',
    icon: '●',
    baseStats: {
      damage: 25,
      range: 2.8,
      attackSpeed: 0.4,
      splashRadius: 1.2,
    },
    upgradeCosts: {
      damage: [40, 65, 100, 150],
      range: [30, 45, 70, 100],
      attackSpeed: [45, 70, 100, 140],
    },
    upgradeMultipliers: {
      damage: 1.4,
      range: 1.12,
      attackSpeed: 1.15,
    },
    maxUpgradeLevel: 4,
    projectileColor: '#c0392b',
    projectileSpeed: 8,
    splashRadiusGrowth: 0.15,
  },

  magic: {
    id: 'magic',
    name: 'Magic Tower',
    description: 'Long range, steady magical damage.',
    cost: 70,
    color: '#9b59b6',
    icon: '✦',
    baseStats: {
      damage: 14,
      range: 4.5,
      attackSpeed: 0.8,
    },
    upgradeCosts: {
      damage: [35, 55, 85, 130],
      range: [30, 50, 75, 110],
      attackSpeed: [40, 60, 90, 130],
    },
    upgradeMultipliers: {
      damage: 1.3,
      range: 1.18,
      attackSpeed: 1.18,
    },
    maxUpgradeLevel: 4,
    projectileColor: '#8e44ad',
    projectileSpeed: 10,
  },
};
