/** Scaling RP cost: base * growth^level */
export function researchCost(base, growth, level) {
  return Math.max(1, Math.round(base * Math.pow(growth, level)));
}

export const RESEARCH_BRANCHES = {
  economy: { id: 'economy', name: 'Economy', icon: '◎' },
  military: { id: 'military', name: 'Military', icon: '⚔' },
  defensive: { id: 'defensive', name: 'Defensive', icon: '🛡' },
  engineering: { id: 'engineering', name: 'Engineering', icon: '⚙' },
  elemental: { id: 'elemental', name: 'Elemental', icon: '✦' },
  boss_hunter: { id: 'boss_hunter', name: 'Boss Hunter', icon: '☠' },
  world: { id: 'world', name: 'World', icon: '🌍' },
  qol: { id: 'qol', name: 'Quality of Life', icon: '◈' },
  endless: { id: 'endless', name: 'Endless', icon: '∞' },
};

export const RESEARCH_BRANCH_ORDER = [
  'economy', 'military', 'defensive', 'engineering', 'elemental', 'boss_hunter', 'world', 'qol', 'endless',
];

export const RESEARCH_TAB_LABELS = {
  economy: 'Economy',
  military: 'Military',
  defensive: 'Defensive',
  engineering: 'Engineering',
  elemental: 'Elemental',
  boss_hunter: 'Boss Hunter',
  world: 'World',
  qol: 'QoL',
  endless: 'Endless',
};

/** Minimum main-tree ranks purchased before Endless tab unlocks (unless World node bought). */
export const ENDLESS_UNLOCK_RANKS = 24;

/**
 * @typedef {object} ResearchNodeDef
 * @property {string} id
 * @property {string} branch
 * @property {string} name
 * @property {string} description
 * @property {number} cost
 * @property {number} [costGrowth]
 * @property {number} maxLevel
 * @property {string[]} prerequisites
 * @property {number} row
 * @property {number} col
 * @property {Record<string, number>} effectsPerLevel
 * @property {boolean} [metaPersistent] — saved to meta, persists across runs
 * @property {string} [unlockFlag] — meta flag key for content unlocks
 */

/** @type {Record<string, ResearchNodeDef>} */
export const RESEARCH_TREE_NODES = {
  // ── Economy ──
  farm_income: {
    id: 'farm_income', branch: 'economy', row: 0, col: 0,
    name: 'Fertile Fields', description: '+8% Sunpatch income per rank',
    cost: 8, maxLevel: 6, prerequisites: [],
    effectsPerLevel: { farmIncomeMult: 0.08 },
  },
  farm_production: {
    id: 'farm_production', branch: 'economy', row: 0, col: 1,
    name: 'Swift Harvest', description: '+5% farm wave scaling per rank',
    cost: 10, maxLevel: 5, prerequisites: [],
    effectsPerLevel: { farmWaveScalingMult: 0.05 },
  },
  bank_interest: {
    id: 'bank_interest', branch: 'economy', row: 1, col: 0,
    name: 'Banking Theory', description: '+10% bank interest per rank',
    cost: 12, maxLevel: 4, prerequisites: ['farm_income'],
    effectsPerLevel: { bankInterestMult: 0.1 },
  },
  marketplace_bonus: {
    id: 'marketplace_bonus', branch: 'economy', row: 1, col: 1,
    name: 'Trade Routes', description: '+6% marketplace gold bonus per rank',
    cost: 11, maxLevel: 5, prerequisites: ['farm_production'],
    effectsPerLevel: { goldEarnedMult: 0.06 },
  },
  kill_gold: {
    id: 'kill_gold', branch: 'economy', row: 2, col: 0,
    name: 'Bounty Hunting', description: '+5% gold from enemy kills per rank',
    cost: 10, maxLevel: 5, prerequisites: ['bank_interest'],
    effectsPerLevel: { killGoldMult: 0.05 },
  },
  boss_gold: {
    id: 'boss_gold', branch: 'economy', row: 2, col: 1,
    name: 'Boss Bounty', description: '+12% boss kill gold per rank',
    cost: 14, maxLevel: 4, prerequisites: ['marketplace_bonus'],
    effectsPerLevel: { bossRewardMult: 0.12 },
  },
  crystal_production: {
    id: 'crystal_production', branch: 'economy', row: 3, col: 0,
    name: 'Crystal Prospecting', description: '+10% crystal yield per rank',
    cost: 15, maxLevel: 4, prerequisites: ['kill_gold'],
    effectsPerLevel: { crystalMult: 0.1 },
  },
  research_generation: {
    id: 'research_generation', branch: 'economy', row: 3, col: 1,
    name: 'Scholarly Focus', description: '+8% RP generation per rank',
    cost: 12, maxLevel: 5, prerequisites: ['boss_gold'],
    effectsPerLevel: { researchMult: 0.08 },
  },
  building_costs: {
    id: 'building_costs', branch: 'economy', row: 4, col: 0,
    name: 'Efficient Crafting', description: '-4% build costs per rank',
    cost: 13, maxLevel: 5, prerequisites: ['crystal_production'],
    effectsPerLevel: { buildCostMult: -0.04 },
  },
  sell_value: {
    id: 'sell_value', branch: 'economy', row: 4, col: 1,
    name: 'Salvage Expert', description: '+10% sell value per rank',
    cost: 11, maxLevel: 4, prerequisites: ['research_generation'],
    effectsPerLevel: { sellValueMult: 0.1 },
  },
  starting_gold: {
    id: 'starting_gold', branch: 'economy', row: 5, col: 0,
    name: 'Golden Harvest', description: '+12 gold immediately and on future runs this run',
    cost: 8, maxLevel: 4, prerequisites: ['building_costs'],
    effectsPerLevel: { bonusStartingGold: 12, instantGold: 12 },
  },
  passive_income: {
    id: 'passive_income', branch: 'economy', row: 5, col: 1,
    name: 'Passive Treasury', description: '+4 gold per wave per rank',
    cost: 14, maxLevel: 5, prerequisites: ['sell_value'],
    effectsPerLevel: { passiveGoldPerWave: 4 },
  },

  // ── Military ──
  global_damage: {
    id: 'global_damage', branch: 'military', row: 0, col: 0,
    name: 'Sharpened Blades', description: '+7% tower damage per rank',
    cost: 10, maxLevel: 6, prerequisites: [],
    effectsPerLevel: { damageMult: 0.07 },
  },
  global_attack_speed: {
    id: 'global_attack_speed', branch: 'military', row: 0, col: 1,
    name: 'Rapid Training', description: '+5% attack speed per rank',
    cost: 12, maxLevel: 5, prerequisites: [],
    effectsPerLevel: { attackSpeedMult: 0.05 },
  },
  global_range: {
    id: 'global_range', branch: 'military', row: 1, col: 0,
    name: 'Extended Reach', description: '+6% tower range per rank',
    cost: 9, maxLevel: 5, prerequisites: ['global_damage'],
    effectsPerLevel: { rangeMult: 0.06 },
  },
  crit_chance: {
    id: 'crit_chance', branch: 'military', row: 1, col: 1,
    name: 'Keen Eye', description: '+4% critical hit chance per rank',
    cost: 14, maxLevel: 4, prerequisites: ['global_attack_speed'],
    effectsPerLevel: { critChance: 0.04 },
  },
  crit_damage: {
    id: 'crit_damage', branch: 'military', row: 2, col: 0,
    name: 'Lethal Strikes', description: '+10% critical damage per rank',
    cost: 13, maxLevel: 4, prerequisites: ['global_range'],
    effectsPerLevel: { critDamageMult: 0.1 },
  },
  projectile_speed: {
    id: 'projectile_speed', branch: 'military', row: 2, col: 1,
    name: 'Velocity Tuning', description: '+8% projectile speed per rank',
    cost: 11, maxLevel: 4, prerequisites: ['crit_chance'],
    effectsPerLevel: { projectileSpeedMult: 0.08 },
  },
  splash_radius: {
    id: 'splash_radius', branch: 'military', row: 3, col: 0,
    name: 'Blast Radius', description: '+10% splash radius per rank',
    cost: 15, maxLevel: 4, prerequisites: ['crit_damage'],
    effectsPerLevel: { splashRadiusMult: 0.1 },
  },
  armor_pen: {
    id: 'armor_pen', branch: 'military', row: 3, col: 1,
    name: 'Armor Piercing', description: '+5% armor penetration per rank',
    cost: 16, maxLevel: 4, prerequisites: ['projectile_speed'],
    effectsPerLevel: { armorPen: 0.05 },
  },
  boss_damage: {
    id: 'boss_damage', branch: 'military', row: 4, col: 0,
    name: 'Titan Slayer', description: '+10% damage vs bosses per rank',
    cost: 18, maxLevel: 4, prerequisites: ['splash_radius'],
    effectsPerLevel: { bossDamageMult: 0.1 },
  },
  elite_damage: {
    id: 'elite_damage', branch: 'military', row: 4, col: 1,
    name: 'Elite Hunter', description: '+8% damage vs elite enemies per rank',
    cost: 14, maxLevel: 4, prerequisites: ['armor_pen'],
    effectsPerLevel: { eliteDamageMult: 0.08 },
  },

  // ── Defensive ──
  base_health: {
    id: 'base_health', branch: 'defensive', row: 0, col: 0,
    name: 'Fortified Base', description: '+8% structure max health per rank',
    cost: 10, maxLevel: 5, prerequisites: [],
    effectsPerLevel: { structureHealthMult: 0.08 },
  },
  base_armor: {
    id: 'base_armor', branch: 'defensive', row: 0, col: 1,
    name: 'Reinforced Walls', description: '+4% structure armor per rank',
    cost: 11, maxLevel: 5, prerequisites: [],
    effectsPerLevel: { structureArmor: 0.04 },
  },
  base_regen: {
    id: 'base_regen', branch: 'defensive', row: 1, col: 0,
    name: 'Passive Regeneration', description: '+3 HP to all structures each wave per rank',
    cost: 12, maxLevel: 5, prerequisites: ['base_health'],
    effectsPerLevel: { passiveRepairPerWave: 3 },
  },
  tower_health: {
    id: 'tower_health', branch: 'defensive', row: 1, col: 1,
    name: 'Tower Fortification', description: '+10% tower health per rank',
    cost: 13, maxLevel: 4, prerequisites: ['base_armor'],
    effectsPerLevel: { towerHealthMult: 0.1 },
  },
  tower_armor: {
    id: 'tower_armor', branch: 'defensive', row: 2, col: 0,
    name: 'Tower Plating', description: '+5% tower armor per rank',
    cost: 14, maxLevel: 4, prerequisites: ['base_regen'],
    effectsPerLevel: { towerArmorAdd: 0.05 },
  },
  repair_speed: {
    id: 'repair_speed', branch: 'defensive', row: 2, col: 1,
    name: 'Rapid Repairs', description: '+15% repair station effectiveness per rank',
    cost: 12, maxLevel: 4, prerequisites: ['tower_health'],
    effectsPerLevel: { repairSpeedMult: 0.15 },
  },
  repair_cost: {
    id: 'repair_cost', branch: 'defensive', row: 3, col: 0,
    name: 'Efficient Repairs', description: '-8% manual repair costs per rank',
    cost: 10, maxLevel: 5, prerequisites: ['tower_armor'],
    effectsPerLevel: { repairCostMult: -0.08 },
  },
  structure_durability: {
    id: 'structure_durability', branch: 'defensive', row: 3, col: 1,
    name: 'Durability Engineering', description: '+6% all structure durability per rank',
    cost: 15, maxLevel: 4, prerequisites: ['repair_speed', 'repair_cost'],
    effectsPerLevel: { structureHealthMult: 0.06, towerHealthMult: 0.06 },
  },

  // ── Engineering ──
  upgrade_costs: {
    id: 'upgrade_costs', branch: 'engineering', row: 0, col: 0,
    name: 'Master Craft', description: '-5% upgrade costs per rank',
    cost: 12, maxLevel: 5, prerequisites: [],
    effectsPerLevel: { upgradeCostMult: -0.05 },
  },
  mastery_gain: {
    id: 'mastery_gain', branch: 'engineering', row: 0, col: 1,
    name: 'Veteran Training', description: '+12% tower mastery XP per rank',
    cost: 14, maxLevel: 4, prerequisites: [],
    effectsPerLevel: { masteryXpMult: 0.12 },
  },
  support_radius: {
    id: 'support_radius', branch: 'engineering', row: 1, col: 0,
    name: 'Aura Extension', description: '+8% support structure aura radius per rank',
    cost: 13, maxLevel: 4, prerequisites: ['upgrade_costs'],
    effectsPerLevel: { supportRadiusMult: 0.08 },
  },
  build_expansion: {
    id: 'build_expansion', branch: 'engineering', row: 1, col: 1,
    name: 'Land Survey', description: 'Unlocks 1 extra build tile investment per rank',
    cost: 20, maxLevel: 2, prerequisites: ['mastery_gain'],
    effectsPerLevel: { bonusBuildExpansions: 1 },
  },
  fast_construction: {
    id: 'fast_construction', branch: 'engineering', row: 2, col: 0,
    name: 'Rapid Deployment', description: '-6% build costs per rank',
    cost: 11, maxLevel: 4, prerequisites: ['support_radius'],
    effectsPerLevel: { buildCostMult: -0.06 },
  },
  sell_efficiency: {
    id: 'sell_efficiency', branch: 'engineering', row: 2, col: 1,
    name: 'Quick Dismantle', description: '+8% sell value per rank',
    cost: 10, maxLevel: 4, prerequisites: ['build_expansion'],
    effectsPerLevel: { sellValueMult: 0.08 },
  },

  // ── Elemental ──
  fire_dot: {
    id: 'fire_dot', branch: 'elemental', row: 0, col: 0,
    name: 'Ignition', description: '+2 burn DPS to burn towers per rank',
    cost: 14, maxLevel: 4, prerequisites: [],
    effectsPerLevel: { burnDPSAdd: 2 },
  },
  freeze_duration: {
    id: 'freeze_duration', branch: 'elemental', row: 0, col: 1,
    name: 'Deep Freeze', description: '+15% slow/freeze duration per rank',
    cost: 13, maxLevel: 4, prerequisites: [],
    effectsPerLevel: { slowDurationMult: 0.15 },
  },
  chain_lightning: {
    id: 'chain_lightning', branch: 'elemental', row: 1, col: 0,
    name: 'Chain Lightning', description: '+1 chain target per 2 ranks',
    cost: 18, maxLevel: 4, prerequisites: ['fire_dot'],
    effectsPerLevel: { chainCountAdd: 0.5 },
  },
  poison_damage: {
    id: 'poison_damage', branch: 'elemental', row: 1, col: 1,
    name: 'Toxic Coating', description: '+3 poison/burn DPS per rank',
    cost: 15, maxLevel: 4, prerequisites: ['freeze_duration'],
    effectsPerLevel: { burnDPSAdd: 3 },
  },
  armor_break: {
    id: 'armor_break', branch: 'elemental', row: 2, col: 0,
    name: 'Armor Break', description: '+6% armor penetration per rank',
    cost: 16, maxLevel: 4, prerequisites: ['chain_lightning'],
    effectsPerLevel: { armorPen: 0.06 },
  },
  explosion_radius: {
    id: 'explosion_radius', branch: 'elemental', row: 2, col: 1,
    name: 'Detonation', description: '+12% explosion/splash radius per rank',
    cost: 17, maxLevel: 4, prerequisites: ['poison_damage'],
    effectsPerLevel: { splashRadiusMult: 0.12 },
  },
  burn_spread: {
    id: 'burn_spread', branch: 'elemental', row: 3, col: 0,
    name: 'Wildfire', description: 'Burns spread to +1 nearby foe per rank',
    cost: 20, maxLevel: 3, prerequisites: ['armor_break'],
    effectsPerLevel: { burnSpreadCount: 1 },
  },
  shock_stun: {
    id: 'shock_stun', branch: 'elemental', row: 3, col: 1,
    name: 'Static Shock', description: '+5% stun/slow strength per rank',
    cost: 16, maxLevel: 4, prerequisites: ['explosion_radius'],
    effectsPerLevel: { slowPercentAdd: 0.05 },
  },

  // ── Boss Hunter ──
  bh_boss_rewards: {
    id: 'bh_boss_rewards', branch: 'boss_hunter', row: 0, col: 0,
    name: 'Boss Profiteer', description: '+15% boss rewards per rank',
    cost: 16, maxLevel: 4, prerequisites: [],
    effectsPerLevel: { bossRewardMult: 0.15 },
  },
  bh_crystal_drops: {
    id: 'bh_crystal_drops', branch: 'boss_hunter', row: 0, col: 1,
    name: 'Crystal Harvest', description: '+12% crystal drops per rank',
    cost: 15, maxLevel: 4, prerequisites: [],
    effectsPerLevel: { crystalMult: 0.12 },
  },
  bh_challenge_rewards: {
    id: 'bh_challenge_rewards', branch: 'boss_hunter', row: 1, col: 0,
    name: 'Challenge Seeker', description: '+5% challenge reward multiplier per rank',
    cost: 18, maxLevel: 3, prerequisites: ['bh_boss_rewards'],
    effectsPerLevel: { challengeRewardMult: 0.05 },
  },
  bh_legendary_chance: {
    id: 'bh_legendary_chance', branch: 'boss_hunter', row: 1, col: 1,
    name: 'Legendary Insight', description: '-8% legendary upgrade cost per rank',
    cost: 22, maxLevel: 3, prerequisites: ['bh_crystal_drops'],
    effectsPerLevel: { legendaryCostMult: -0.08 },
  },
  bh_elite_hunter: {
    id: 'bh_elite_hunter', branch: 'boss_hunter', row: 2, col: 0,
    name: 'Elite Bounty', description: '+10% gold from elite kills per rank',
    cost: 14, maxLevel: 4, prerequisites: ['bh_challenge_rewards'],
    effectsPerLevel: { eliteGoldMult: 0.1 },
  },

  // ── World (meta-persistent) ──
  world_gust_unlock: {
    id: 'world_gust_unlock', branch: 'world', row: 0, col: 0,
    name: 'Gust Totem Blueprint', description: 'Unlock Gust Totem from wave 1 on all future runs.',
    cost: 35, maxLevel: 1, prerequisites: [],
    metaPersistent: true, unlockFlag: 'gust_from_wave_1',
    effectsPerLevel: {},
  },
  world_ember_unlock: {
    id: 'world_ember_unlock', branch: 'world', row: 0, col: 1,
    name: 'Ember Hearth Schematics', description: 'Unlock Ember Hearth from wave 8 on all future runs.',
    cost: 40, maxLevel: 1, prerequisites: [],
    metaPersistent: true, unlockFlag: 'ember_early',
    effectsPerLevel: {},
  },
  world_bank_early: {
    id: 'world_bank_early', branch: 'world', row: 1, col: 0,
    name: 'Bank Charter', description: 'Banks available from wave 5 on all future runs.',
    cost: 30, maxLevel: 1, prerequisites: ['world_gust_unlock'],
    metaPersistent: true, unlockFlag: 'bank_wave_5',
    effectsPerLevel: {},
  },
  world_challenges: {
    id: 'world_challenges', branch: 'world', row: 1, col: 1,
    name: 'Challenge Codex', description: 'All challenge modifiers available from wave 1.',
    cost: 45, maxLevel: 1, prerequisites: ['world_ember_unlock'],
    metaPersistent: true, unlockFlag: 'all_challenges',
    effectsPerLevel: {},
  },
  world_endless_research: {
    id: 'world_endless_research', branch: 'world', row: 2, col: 0,
    name: 'Infinite Inquiry', description: 'Unlock the Endless Research branch.',
    cost: 50, maxLevel: 1, prerequisites: ['world_bank_early', 'world_challenges'],
    metaPersistent: true, unlockFlag: 'endless_research',
    effectsPerLevel: {},
  },
  world_wonder_discount: {
    id: 'world_wonder_discount', branch: 'world', row: 2, col: 1,
    name: 'Wonder Architecture', description: '-10% World Wonder gold cost on all future runs.',
    cost: 55, maxLevel: 1, prerequisites: ['world_endless_research'],
    metaPersistent: true, unlockFlag: 'wonder_discount',
    effectsPerLevel: { wonderCostMult: -0.1 },
  },

  // ── Quality of Life ──
  qol_fast_wave: {
    id: 'qol_fast_wave', branch: 'qol', row: 0, col: 0,
    name: 'Quick Start', description: '-15% auto-start delay per rank',
    cost: 8, maxLevel: 3, prerequisites: [],
    effectsPerLevel: { autoStartDelayMult: -0.15 },
  },
  qol_auto_repair: {
    id: 'qol_auto_repair', branch: 'qol', row: 0, col: 1,
    name: 'Auto-Repair Boost', description: '+20% passive repair per rank',
    cost: 10, maxLevel: 4, prerequisites: [],
    effectsPerLevel: { passiveRepairPerWave: 2 },
  },
  qol_fast_forward: {
    id: 'qol_fast_forward', branch: 'qol', row: 1, col: 0,
    name: 'Overdrive', description: 'Unlock additional fast-forward speed tier',
    cost: 25, maxLevel: 1, prerequisites: ['qol_fast_wave'],
    effectsPerLevel: { extraSpeedTier: 1 },
  },
  qol_enemy_info: {
    id: 'qol_enemy_info', branch: 'qol', row: 1, col: 1,
    name: 'Scout Reports', description: '+10% estimated wave reward accuracy',
    cost: 12, maxLevel: 1, prerequisites: ['qol_auto_repair'],
    effectsPerLevel: { waveRewardInsight: 1 },
  },
};

/** Endless research — no max level, escalating RP cost. */
export const ENDLESS_RESEARCH_NODES = {
  endless_damage: {
    id: 'endless_damage', branch: 'endless',
    name: 'Endless Damage', description: '+1% tower damage per level (no cap)',
    baseCost: 25, costGrowth: 1.38,
    effectsPerLevel: { damageMult: 0.01 },
  },
  endless_gold: {
    id: 'endless_gold', branch: 'endless',
    name: 'Endless Gold', description: '+1% all gold earned per level (no cap)',
    baseCost: 28, costGrowth: 1.4,
    effectsPerLevel: { goldEarnedMult: 0.01 },
  },
  endless_farm: {
    id: 'endless_farm', branch: 'endless',
    name: 'Endless Farm Income', description: '+1% farm income per level (no cap)',
    baseCost: 24, costGrowth: 1.37,
    effectsPerLevel: { farmIncomeMult: 0.01 },
  },
  endless_boss: {
    id: 'endless_boss', branch: 'endless',
    name: 'Endless Boss Rewards', description: '+1% boss rewards per level (no cap)',
    baseCost: 32, costGrowth: 1.42,
    effectsPerLevel: { bossRewardMult: 0.01 },
  },
  endless_crystal: {
    id: 'endless_crystal', branch: 'endless',
    name: 'Endless Crystal Chance', description: '+1% crystal yield per level (no cap)',
    baseCost: 30, costGrowth: 1.41,
    effectsPerLevel: { crystalMult: 0.01 },
  },
  endless_research_speed: {
    id: 'endless_research_speed', branch: 'endless',
    name: 'Endless Research Speed', description: '+1% RP generation per level (no cap)',
    baseCost: 26, costGrowth: 1.39,
    effectsPerLevel: { researchMult: 0.01 },
  },
};

/** Legacy flat-list ids mapped to new tree nodes for save migration. */
export const LEGACY_RESEARCH_MAP = {
  sharpened_blades: 'global_damage',
  extended_reach: 'global_range',
  rapid_training: 'global_attack_speed',
  fertile_fields: 'farm_income',
  efficient_crafting: 'building_costs',
  golden_harvest: 'starting_gold',
  salvage_expert: 'sell_value',
  boss_bounty: 'boss_gold',
};
