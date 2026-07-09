/**
 * Tower type definitions — add new towers here without touching core systems.
 * Each type defines base stats and per-level upgrade scaling.
 */
export const TOWER_TYPES = {
  arrow: {
    id: 'arrow',
    name: 'Arrow Tower',
    description: 'Fast, precise shots',
    cost: 50,
    color: '#e67e22',
    projectileColor: '#f39c12',
    shape: 'triangle',
    baseStats: {
      damage: 12,
      range: 110,
      attackSpeed: 1.4,
      projectileSpeed: 320,
    },
    upgradeScaling: {
      damage: 8,
      range: 12,
      attackSpeed: 0.15,
    },
    maxLevel: 5,
    upgradeCostBase: 35,
    upgradeCostScale: 1.5,
  },

  cannon: {
    id: 'cannon',
    name: 'Cannon Tower',
    description: 'Slow, heavy splash damage',
    cost: 90,
    color: '#7f8c8d',
    projectileColor: '#2c3e50',
    shape: 'square',
    baseStats: {
      damage: 35,
      range: 95,
      attackSpeed: 0.5,
      projectileSpeed: 220,
      splashRadius: 40,
    },
    upgradeScaling: {
      damage: 18,
      range: 8,
      attackSpeed: 0.06,
      splashRadius: 5,
    },
    maxLevel: 5,
    upgradeCostBase: 55,
    upgradeCostScale: 1.6,
  },

  magic: {
    id: 'magic',
    name: 'Magic Tower',
    description: 'Steady arcane bolts',
    cost: 70,
    color: '#9b59b6',
    projectileColor: '#e056fd',
    shape: 'circle',
    baseStats: {
      damage: 20,
      range: 120,
      attackSpeed: 0.9,
      projectileSpeed: 280,
    },
    upgradeScaling: {
      damage: 12,
      range: 14,
      attackSpeed: 0.1,
    },
    maxLevel: 5,
    upgradeCostBase: 45,
    upgradeCostScale: 1.55,
  },
};

export function getTowerUpgradeCost(typeDef, level) {
  return Math.floor(typeDef.upgradeCostBase * Math.pow(typeDef.upgradeCostScale, level - 1));
}

export function getTowerStats(typeDef, level) {
  const stats = { ...typeDef.baseStats };
  const scale = typeDef.upgradeScaling;
  const bonusLevels = level - 1;

  for (const key of Object.keys(scale)) {
    stats[key] = stats[key] + scale[key] * bonusLevels;
  }

  return stats;
}
