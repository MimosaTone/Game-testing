/**
 * Prestige milestone and permanent upgrade definitions.
 * Bloom Shards persist across runs and unlock meaningful bonuses.
 */
export const PRESTIGE_CONFIG = {
  /** Minimum wave to unlock voluntary prestige during a run. */
  unlockWave: 50,

  /** Shards awarded when prestiging at a given wave. */
  calculateShards(waveReached) {
    const base = Math.floor(waveReached / 4);
    const milestoneBonus = waveReached >= 50 ? 25 : waveReached >= 30 ? 10 : 0;
    return base + milestoneBonus;
  },

  storageKey: 'meadow-defense-prestige',
  settingsKey: 'meadow-defense-settings',
};

/** Permanent upgrades purchased with Bloom Shards. */
export const PRESTIGE_UPGRADES = {
  fertile_soil: {
    id: 'fertile_soil',
    name: 'Fertile Soil',
    description: '+12% Sunpatch income per level',
    cost: 5,
    maxLevel: 5,
    effect: (level) => ({ farmIncomeMult: 1 + level * 0.12 }),
  },
  meadow_bounty: {
    id: 'meadow_bounty',
    name: 'Meadow Bounty',
    description: '+20 starting gold per level',
    cost: 4,
    maxLevel: 5,
    effect: (level) => ({ bonusStartingGold: level * 20 }),
  },
  sturdy_roots: {
    id: 'sturdy_roots',
    name: 'Sturdy Roots',
    description: '+1 starting life per level',
    cost: 5,
    maxLevel: 5,
    effect: (level) => ({ bonusStartingLives: level }),
  },
  tower_mastery: {
    id: 'tower_mastery',
    name: 'Tower Mastery',
    description: '+8% tower damage per level',
    cost: 8,
    maxLevel: 4,
    effect: (level) => ({ towerDamageMult: 1 + level * 0.08 }),
  },
  harvest_rite: {
    id: 'harvest_rite',
    name: 'Harvest Rite',
    description: '+10% wave clear bonus per level',
    cost: 6,
    maxLevel: 4,
    effect: (level) => ({ waveBonusMult: 1 + level * 0.1 }),
  },
};
