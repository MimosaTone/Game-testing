/** Prestige Tree branches and nodes — permanent upgrades purchased with Prestige Tokens (✿). */

export const PRESTIGE_BRANCHES = {
  economy: { id: 'economy', name: 'Economy', icon: '◎' },
  military: { id: 'military', name: 'Military', icon: '⚔' },
  engineering: { id: 'engineering', name: 'Engineering', icon: '⚙' },
  research: { id: 'research', name: 'Research', icon: '⚗' },
  boss_hunter: { id: 'boss_hunter', name: 'Boss Hunter', icon: '☠' },
  world: { id: 'world', name: 'World', icon: '🌍' },
};

export const PRESTIGE_BRANCH_ORDER = ['economy', 'military', 'engineering', 'research', 'boss_hunter', 'world'];

/**
 * @typedef {object} TreeNodeDef
 * @property {string} id
 * @property {string} branch
 * @property {string} name
 * @property {string} description
 * @property {number} cost — tokens per rank
 * @property {number} maxRank
 * @property {string[]} prerequisites — node ids requiring rank ≥ 1
 * @property {string[]} [requiresMaxed] — node ids requiring max rank
 * @property {number} [unlockPrestigeLevel] — minimum lifetime prestiges to unlock
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
  raider_insurance: {
    id: 'raider_insurance', branch: 'economy', row: 3, col: 0,
    name: 'Raider Insurance', description: '-6% structure damage taken per rank',
    cost: 18, maxRank: 3, prerequisites: [], requiresMaxed: ['golden_fields'],
    effect: (r) => ({ structureDamageTakenMult: Math.max(0.78, 1 - r * 0.06) }),
  },
  merchant_guild: {
    id: 'merchant_guild', branch: 'economy', row: 3, col: 1,
    name: 'Merchant Guild', description: '+5% kill gold per rank',
    cost: 16, maxRank: 3, prerequisites: [], requiresMaxed: ['golden_fields'],
    effect: (r) => ({ killGoldMult: 1 + r * 0.05 }),
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
  armor_breaker: {
    id: 'armor_breaker', branch: 'military', row: 3, col: 0,
    name: 'Armor Breaker', description: '+4% armor penetration per rank',
    cost: 20, maxRank: 4, prerequisites: [], requiresMaxed: ['war_council'],
    effect: (r) => ({ armorPen: r * 0.04 }),
  },
  elite_hunter: {
    id: 'elite_hunter', branch: 'military', row: 3, col: 1,
    name: 'Elite Hunter', description: '+7% damage vs elites per rank',
    cost: 22, maxRank: 3, prerequisites: [], requiresMaxed: ['war_council'],
    effect: (r) => ({ eliteDamageMult: 1 + r * 0.07 }),
  },
  swarm_slayer: {
    id: 'swarm_slayer', branch: 'military', row: 4, col: 0,
    name: 'Swarm Slayer', description: '+8% splash radius per rank',
    cost: 24, maxRank: 3, prerequisites: [], requiresMaxed: ['armor_breaker', 'elite_hunter'],
    effect: (r) => ({ splashRadiusMult: 1 + r * 0.08 }),
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
  fortified_structures: {
    id: 'fortified_structures', branch: 'engineering', row: 3, col: 0,
    name: 'Fortified Structures', description: '+6% tower & structure health per rank',
    cost: 18, maxRank: 3, prerequisites: [], requiresMaxed: ['engineers_guild'],
    effect: (r) => ({ structureHealthMult: 1 + r * 0.06, towerHealthMult: 1 + r * 0.06 }),
  },
  rapid_recovery: {
    id: 'rapid_recovery', branch: 'engineering', row: 3, col: 1,
    name: 'Rapid Recovery', description: '+3 passive repair per wave per rank',
    cost: 17, maxRank: 3, prerequisites: [], requiresMaxed: ['engineers_guild'],
    effect: (r) => ({ passiveRepairPerWave: r * 3 }),
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
  elemental_ward: {
    id: 'elemental_ward', branch: 'research', row: 3, col: 0,
    name: 'Elemental Ward', description: '+8% slow duration per rank',
    cost: 18, maxRank: 3, prerequisites: [], requiresMaxed: ['grand_library'],
    effect: (r) => ({ slowDurationMult: 1 + r * 0.08 }),
  },
  pyre_mastery: {
    id: 'pyre_mastery', branch: 'research', row: 3, col: 1,
    name: 'Pyre Mastery', description: '+2 burn DPS per rank',
    cost: 17, maxRank: 4, prerequisites: [], requiresMaxed: ['grand_library'],
    effect: (r) => ({ burnDPSAdd: r * 2 }),
  },
  arcane_confluence: {
    id: 'arcane_confluence', branch: 'research', row: 4, col: 0,
    name: 'Arcane Confluence', description: '+5% spell damage & +10% mastery XP per rank',
    cost: 22, maxRank: 3, prerequisites: [], requiresMaxed: ['elemental_ward', 'pyre_mastery'],
    effect: (r) => ({ towerDamageMult: 1 + r * 0.05, masteryXpMult: 1 + r * 0.1 }),
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
  endless_bounty: {
    id: 'endless_bounty', branch: 'boss_hunter', row: 3, col: 0,
    name: 'Endless Bounty', description: '+5% prestige tokens earned per rank',
    cost: 22, maxRank: 3, prerequisites: [], requiresMaxed: ['apex_predator'],
    effect: (r) => ({ prestigeTokenMult: 1 + r * 0.05 }),
  },
  legend_slayer: {
    id: 'legend_slayer', branch: 'boss_hunter', row: 3, col: 1,
    name: 'Legend Slayer', description: '+10% boss damage per rank',
    cost: 20, maxRank: 3, prerequisites: [], requiresMaxed: ['bounty_hunter', 'titan_slayer'],
    effect: (r) => ({ bossDamageMult: 1 + r * 0.1 }),
  },

  // ── World (Tier II — unlocks after Prestige Level 3) ──
  meadow_covenant: {
    id: 'meadow_covenant', branch: 'world', row: 0, col: 0,
    name: 'Meadow Covenant', description: '+4% World Tier reward bonus per rank',
    cost: 15, maxRank: 4, prerequisites: [], unlockPrestigeLevel: 3,
    effect: (r) => ({ worldTierRewardMult: 1 + r * 0.04 }),
  },
  faction_insight: {
    id: 'faction_insight', branch: 'world', row: 0, col: 1,
    name: 'Faction Insight', description: '+3% challenge rewards per rank',
    cost: 14, maxRank: 4, prerequisites: [], unlockPrestigeLevel: 3,
    effect: (r) => ({ challengeRewardMult: 1 + r * 0.03 }),
  },
  ancient_vigil: {
    id: 'ancient_vigil', branch: 'world', row: 1, col: 0,
    name: 'Ancient Vigil', description: '+6% boss damage per rank',
    cost: 20, maxRank: 3, prerequisites: ['meadow_covenant'], unlockPrestigeLevel: 5,
    effect: (r) => ({ bossDamageMult: 1 + r * 0.06 }),
  },
  raider_bastion: {
    id: 'raider_bastion', branch: 'world', row: 1, col: 1,
    name: 'Raider Bastion', description: '-5% structure damage taken per rank',
    cost: 18, maxRank: 3, prerequisites: ['faction_insight'], unlockPrestigeLevel: 5,
    effect: (r) => ({ structureDamageTakenMult: Math.max(0.8, 1 - r * 0.05) }),
  },
  cataclysm_ward: {
    id: 'cataclysm_ward', branch: 'world', row: 2, col: 0,
    name: 'Cataclysm Ward', description: '+8% structure health & +5% elite damage per rank',
    cost: 28, maxRank: 2, prerequisites: [], requiresMaxed: ['ancient_vigil', 'raider_bastion'],
    unlockPrestigeLevel: 8,
    effect: (r) => ({
      structureHealthMult: 1 + r * 0.08,
      eliteDamageMult: 1 + r * 0.05,
    }),
  },
};
