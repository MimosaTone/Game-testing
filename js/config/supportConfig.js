/** Aura radius in grid tiles for proximity-based support effects. */
export const SUPPORT_AURA_RADIUS = 2.5;

/** Support structure definitions. */
export const SUPPORT_TYPES = {
  village: {
    id: 'village',
    name: 'Village',
    description: 'Choose Economy, Military, or Engineering specialization.',
    cost: 120,
    color: '#8d6e63',
    icon: '⌂',
    maxLevel: 4,
    upgradeCosts: [90, 150, 240],
    requiresBranch: true,
    branches: {
      economy: {
        name: 'Economy',
        description: 'Boosts nearby Sunpatch income.',
        perLevel: { farmIncomeMult: 0.18 },
      },
      military: {
        name: 'Military',
        description: 'Empowers nearby towers in combat.',
        perLevel: { damageMult: 0.12, attackSpeedMult: 0.08, rangeMult: 0.06 },
      },
      engineering: {
        name: 'Engineering',
        description: 'Cheaper upgrades, better sell value, build discounts.',
        perLevel: { upgradeCostMult: -0.1, sellValueMult: 0.15, buildCostMult: -0.05 },
      },
    },
  },

  bank: {
    id: 'bank',
    name: 'Bank',
    description: 'Store gold and earn interest each wave.',
    cost: 100,
    color: '#f9a825',
    icon: '¤',
    maxLevel: 5,
    upgradeCosts: [70, 120, 200, 320],
    perLevel: {
      capacity: [200, 400, 700, 1200, 2000],
      interestRate: [0.06, 0.08, 0.1, 0.12, 0.15],
    },
  },

  marketplace: {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Global bonus to all gold earned.',
    cost: 90,
    color: '#e67e22',
    icon: '◈',
    maxLevel: 5,
    upgradeCosts: [60, 110, 180, 280],
    perLevel: { goldEarnedMult: [0.05, 0.1, 0.15, 0.22, 0.3] },
  },

  research_lab: {
    id: 'research_lab',
    name: 'Research Lab',
    description: 'Generates Research Points each wave.',
    cost: 110,
    color: '#5c6bc0',
    icon: '⚗',
    maxLevel: 4,
    upgradeCosts: [80, 140, 220],
    perLevel: { rpPerWave: [3, 5, 8, 12] },
  },

  repair_station: {
    id: 'repair_station',
    name: 'Repair Station',
    description: 'Repairs nearby structures between waves and slowly during combat.',
    cost: 85,
    color: '#43a047',
    icon: '+',
    maxLevel: 4,
    upgradeCosts: [65, 110, 175],
    perLevel: {
      radius: [2.5, 3.0, 3.5, 4.5],
      waveRepairAmount: [25, 45, 70, 110],
      combatRepairPerSec: [2, 4, 7, 12],
      maxSimultaneous: [1, 2, 3, 4],
      lifeHealAmount: [0, 0, 1, 2],
      lifeHealInterval: [99, 99, 5, 4],
    },
  },

  forge: {
    id: 'forge',
    name: 'Forge',
    description: 'Global tower enhancements — choose a path.',
    cost: 130,
    color: '#78909c',
    icon: '⚒',
    maxLevel: 4,
    upgradeCosts: [100, 170, 260],
    requiresBranch: true,
    branches: {
      velocity: {
        name: 'Velocity',
        description: 'Faster projectiles and attack speed.',
        perLevel: { projectileSpeedMult: 0.12, attackSpeedMult: 0.06 },
      },
      precision: {
        name: 'Precision',
        description: 'Critical hits and armor penetration.',
        perLevel: { critChance: 0.04, critDamageMult: 0.25, armorPen: 0.08 },
      },
      elemental: {
        name: 'Elemental',
        description: 'Burn, slow, and chain effects.',
        perLevel: { burnDPSAdd: 2, slowPercentAdd: 0.05, chainCountAdd: 0.25 },
      },
    },
  },

  crystal_extractor: {
    id: 'crystal_extractor',
    name: 'Crystal Extractor',
    description: 'Generates Crystals after the first boss. Used for premium upgrades.',
    cost: 150,
    color: '#ab47bc',
    icon: '◆',
    maxLevel: 4,
    upgradeCosts: [120, 200, 320],
    unlockAfterWave: 15,
    perLevel: { crystalsPerWave: [1, 2, 3, 5] },
  },
};

/** Build order in HUD — supports grouped after combat/farm. */
export const SUPPORT_BUILD_ORDER = [
  'village',
  'bank',
  'marketplace',
  'research_lab',
  'repair_station',
  'forge',
  'crystal_extractor',
];
