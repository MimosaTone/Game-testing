/** Prestige Tree branches and nodes — permanent upgrades purchased with Prestige Tokens (✿). */

export const PRESTIGE_BRANCHES = {
  economy: { id: 'economy', name: 'Economy', icon: '◎' },
  military: { id: 'military', name: 'Military', icon: '⚔' },
  engineering: { id: 'engineering', name: 'Engineering', icon: '⚙' },
  research: { id: 'research', name: 'Research', icon: '⚗' },
  boss_hunter: { id: 'boss_hunter', name: 'Boss Hunter', icon: '☠' },
};

export const PRESTIGE_BRANCH_ORDER = ['economy', 'military', 'engineering', 'research', 'boss_hunter'];

/**
 * @typedef {object} TreeNodeDef
 * @property {string} id
 * @property {string} branch
 * @property {string} name
 * @property {string} description
 * @property {number} cost — tokens per rank
 * @property {number} maxRank
 * @property {string[]} prerequisites — node ids requiring rank ≥ 1
 * @property {number} row
 * @property {number} col
 * @property {(rank: number) => object} effect
 */

/** @type {Record<string, TreeNodeDef>} */
export const PRESTIGE_TREE_NODES = {
  // ── Economy ──
  fertile_soil: {
    id: 'fertile_soil', branch: 'economy', row: 0, col: 0,
    name: 'Fertile Soil', description: '+12% Sunpatch income per rank',
    cost: 5, maxRank: 5, prerequisites: [],
    effect: (r) => ({ farmIncomeMult: 1 + r * 0.12 }),
  },
  meadow_bounty: {
    id: 'meadow_bounty', branch: 'economy', row: 0, col: 1,
    name: 'Meadow Bounty', description: '+20 starting gold per rank',
    cost: 4, maxRank: 5, prerequisites: [],
    effect: (r) => ({ bonusStartingGold: r * 20 }),
  },
  harvest_rite: {
    id: 'harvest_rite', branch: 'economy', row: 1, col: 0,
    name: 'Harvest Rite', description: '+10% wave clear bonus per rank',
    cost: 6, maxRank: 4, prerequisites: ['fertile_soil'],
    effect: (r) => ({ waveBonusMult: 1 + r * 0.1 }),
  },
  trade_network: {
    id: 'trade_network', branch: 'economy', row: 1, col: 1,
    name: 'Trade Network', description: '+5% all gold earned per rank',
    cost: 7, maxRank: 4, prerequisites: ['meadow_bounty'],
    effect: (r) => ({ goldEarnedMult: 1 + r * 0.05 }),
  },
  golden_fields: {
    id: 'golden_fields', branch: 'economy', row: 2, col: 0,
    name: 'Golden Fields', description: '+8% farm & bank income per rank',
    cost: 10, maxRank: 3, prerequisites: ['harvest_rite', 'trade_network'],
    effect: (r) => ({ farmIncomeMult: 1 + r * 0.08, bankInterestMult: 1 + r * 0.08 }),
  },

  // ── Military ──
  tower_mastery: {
    id: 'tower_mastery', branch: 'military', row: 0, col: 0,
    name: 'Tower Mastery', description: '+8% tower damage per rank',
    cost: 8, maxRank: 4, prerequisites: [],
    effect: (r) => ({ towerDamageMult: 1 + r * 0.08 }),
  },
  sturdy_roots: {
    id: 'sturdy_roots', branch: 'military', row: 0, col: 1,
    name: 'Sturdy Roots', description: '+1 starting life per rank',
    cost: 5, maxRank: 5, prerequisites: [],
    effect: (r) => ({ bonusStartingLives: r }),
  },
  volley_training: {
    id: 'volley_training', branch: 'military', row: 1, col: 0,
    name: 'Volley Training', description: '+5% attack speed per rank',
    cost: 7, maxRank: 4, prerequisites: ['tower_mastery'],
    effect: (r) => ({ attackSpeedMult: 1 + r * 0.05 }),
  },
  fortified_walls: {
    id: 'fortified_walls', branch: 'military', row: 1, col: 1,
    name: 'Fortified Walls', description: '+5% structure health per rank',
    cost: 6, maxRank: 4, prerequisites: ['sturdy_roots'],
    effect: (r) => ({ structureHealthMult: 1 + r * 0.05 }),
  },
  war_council: {
    id: 'war_council', branch: 'military', row: 2, col: 0,
    name: 'War Council', description: '+6% damage & +3% range per rank',
    cost: 12, maxRank: 3, prerequisites: ['volley_training', 'fortified_walls'],
    effect: (r) => ({ towerDamageMult: 1 + r * 0.06, rangeMult: 1 + r * 0.03 }),
  },

  // ── Engineering ──
  quick_build: {
    id: 'quick_build', branch: 'engineering', row: 0, col: 0,
    name: 'Quick Build', description: '-5% build costs per rank',
    cost: 5, maxRank: 4, prerequisites: [],
    effect: (r) => ({ buildCostMult: 1 - r * 0.05 }),
  },
  efficient_repairs: {
    id: 'efficient_repairs', branch: 'engineering', row: 0, col: 1,
    name: 'Efficient Repairs', description: '-8% repair costs per rank',
    cost: 5, maxRank: 4, prerequisites: [],
    effect: (r) => ({ repairCostMult: 1 - r * 0.08 }),
  },
  master_craft: {
    id: 'master_craft', branch: 'engineering', row: 1, col: 0,
    name: 'Master Craft', description: '-6% upgrade costs per rank',
    cost: 7, maxRank: 4, prerequisites: ['quick_build'],
    effect: (r) => ({ upgradeCostMult: 1 - r * 0.06 }),
  },
  salvage_expert: {
    id: 'salvage_expert', branch: 'engineering', row: 1, col: 1,
    name: 'Salvage Expert', description: '+8% sell value per rank',
    cost: 6, maxRank: 4, prerequisites: ['efficient_repairs'],
    effect: (r) => ({ sellValueMult: 1 + r * 0.08 }),
  },
  engineers_guild: {
    id: 'engineers_guild', branch: 'engineering', row: 2, col: 0,
    name: "Engineer's Guild", description: '-10% all structure costs per rank',
    cost: 11, maxRank: 3, prerequisites: ['master_craft', 'salvage_expert'],
    effect: (r) => ({ buildCostMult: 1 - r * 0.1, upgradeCostMult: 1 - r * 0.05 }),
  },

  // ── Research ──
  scholar_path: {
    id: 'scholar_path', branch: 'research', row: 0, col: 0,
    name: 'Scholar Path', description: '+10% RP generation per rank',
    cost: 6, maxRank: 4, prerequisites: [],
    effect: (r) => ({ researchMult: 1 + r * 0.1 }),
  },
  crystal_lore: {
    id: 'crystal_lore', branch: 'research', row: 0, col: 1,
    name: 'Crystal Lore', description: '+12% crystal yield per rank',
    cost: 7, maxRank: 4, prerequisites: [],
    effect: (r) => ({ crystalMult: 1 + r * 0.12 }),
  },
  mastery_focus: {
    id: 'mastery_focus', branch: 'research', row: 1, col: 0,
    name: 'Mastery Focus', description: '+15% tower mastery XP per rank',
    cost: 8, maxRank: 3, prerequisites: ['scholar_path'],
    effect: (r) => ({ masteryXpMult: 1 + r * 0.15 }),
  },
  arcane_insight: {
    id: 'arcane_insight', branch: 'research', row: 1, col: 1,
    name: 'Arcane Insight', description: '+5% spell damage per rank',
    cost: 8, maxRank: 4, prerequisites: ['crystal_lore'],
    effect: (r) => ({ towerDamageMult: 1 + r * 0.05 }),
  },
  grand_library: {
    id: 'grand_library', branch: 'research', row: 2, col: 0,
    name: 'Grand Library', description: '+1 starting RP per rank',
    cost: 10, maxRank: 3, prerequisites: ['mastery_focus', 'arcane_insight'],
    effect: (r) => ({ bonusStartingRP: r * 1 }),
  },

  // ── Boss Hunter ──
  bounty_hunter: {
    id: 'bounty_hunter', branch: 'boss_hunter', row: 0, col: 0,
    name: 'Bounty Hunter', description: '+10% boss rewards per rank',
    cost: 7, maxRank: 4, prerequisites: [],
    effect: (r) => ({ bossRewardMult: 1 + r * 0.1 }),
  },
  titan_slayer: {
    id: 'titan_slayer', branch: 'boss_hunter', row: 0, col: 1,
    name: 'Titan Slayer', description: '+8% damage vs bosses per rank',
    cost: 8, maxRank: 4, prerequisites: [],
    effect: (r) => ({ bossDamageMult: 1 + r * 0.08 }),
  },
  challenge_seeker: {
    id: 'challenge_seeker', branch: 'boss_hunter', row: 1, col: 0,
    name: 'Challenge Seeker', description: '+5% challenge reward mult per rank',
    cost: 9, maxRank: 3, prerequisites: ['bounty_hunter'],
    effect: (r) => ({ challengeRewardMult: 1 + r * 0.05 }),
  },
  colossus_breaker: {
    id: 'colossus_breaker', branch: 'boss_hunter', row: 1, col: 1,
    name: 'Colossus Breaker', description: '+15% boss kill gold per rank',
    cost: 10, maxRank: 3, prerequisites: ['titan_slayer'],
    effect: (r) => ({ bossRewardMult: 1 + r * 0.15 }),
  },
  apex_predator: {
    id: 'apex_predator', branch: 'boss_hunter', row: 2, col: 0,
    name: 'Apex Predator', description: 'Double boss shard bonus on prestige',
    cost: 15, maxRank: 1, prerequisites: ['challenge_seeker', 'colossus_breaker'],
    effect: (r) => ({ prestigeBossShardMult: r > 0 ? 2 : 1 }),
  },
};
