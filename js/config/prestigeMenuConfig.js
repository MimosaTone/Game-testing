/** Ascension perks, milestones, artifacts, shop, world legacy, events, and UI copy. */

export const PRESTIGE_TAB_ORDER = [
  'overview',
  'tree',
  'perks',
  'milestones',
  'artifacts',
  'shop',
  'world_legacy',
  'legacy_hall',
  'world_events',
];

export const PRESTIGE_TAB_LABELS = {
  overview: 'Overview',
  tree: 'Prestige Tree',
  perks: 'Ascension Perks',
  milestones: 'Milestones',
  artifacts: 'Legacy Artifacts',
  shop: 'Prestige Shop',
  world_legacy: 'World Legacy',
  legacy_hall: 'Legacy Hall',
  world_events: 'World Events',
};

/** One-time permanent perk choices unlocked at prestige levels. */
export const ASCENSION_PERKS = {
  eternal_harvest: {
    id: 'eternal_harvest',
    name: 'Eternal Harvest',
    description: 'Sunpatches start at level 2 on new runs.',
    unlockPrestigeLevel: 1,
  },
  iron_bastion: {
    id: 'iron_bastion',
    name: 'Iron Bastion',
    description: '+3 starting lives on all future runs.',
    unlockPrestigeLevel: 2,
    effect: () => ({ bonusStartingLives: 3 }),
  },
  swift_defense: {
    id: 'swift_defense',
    name: 'Swift Defense',
    description: 'Towers gain +10% attack speed globally.',
    unlockPrestigeLevel: 3,
    effect: () => ({ attackSpeedMult: 1.1 }),
  },
  crystal_affinity: {
    id: 'crystal_affinity',
    name: 'Crystal Affinity',
    description: 'Crystal Extractors unlock after wave 10 instead of first boss.',
    unlockPrestigeLevel: 4,
  },
  war_legend: {
    id: 'war_legend',
    name: 'War Legend',
    description: '+25% prestige token gain from all sources.',
    unlockPrestigeLevel: 5,
    effect: () => ({ prestigeTokenMult: 1.25 }),
  },
  timeless_scholar: {
    id: 'timeless_scholar',
    name: 'Timeless Scholar',
    description: 'Research Labs generate +1 RP per wave.',
    unlockPrestigeLevel: 6,
    effect: () => ({ bonusRpPerWave: 1 }),
  },
};

export const PRESTIGE_MILESTONES = [
  { id: 'first_prestige', name: 'First Ascension', requirement: { totalPrestiges: 1 }, reward: 'Unlock Artifact slot 1', tokens: 5 },
  { id: 'wave_75', name: 'Deep Meadow', requirement: { bestWave: 75 }, reward: 'Unlock World Events tab', tokens: 8 },
  { id: 'wave_100', name: 'Century Guard', requirement: { bestWave: 100 }, reward: 'Unlock Artifact slot 2', tokens: 15 },
  { id: 'prestige_5', name: 'Veteran Commander', requirement: { totalPrestiges: 5 }, reward: '+10% permanent damage', tokens: 20 },
  { id: 'prestige_10', name: 'Legend of the Meadow', requirement: { totalPrestiges: 10 }, reward: 'Unlock Artifact slot 3', tokens: 30 },
  { id: 'wave_150', name: 'Eternal Sentinel', requirement: { bestWave: 150 }, reward: 'Unlock Grand Marketplace theme', tokens: 40 },
];

export const LEGACY_ARTIFACTS = {
  sunstone_amulet: {
    id: 'sunstone_amulet',
    name: 'Sunstone Amulet',
    description: '+15% farm income while equipped.',
    cost: 12,
    unlockMilestone: 'first_prestige',
    effect: () => ({ farmIncomeMult: 1.15 }),
  },
  war_banner: {
    id: 'war_banner',
    name: 'War Banner',
    description: '+12% tower damage while equipped.',
    cost: 15,
    unlockMilestone: 'wave_75',
    effect: () => ({ towerDamageMult: 1.12 }),
  },
  crystal_lens: {
    id: 'crystal_lens',
    name: 'Crystal Lens',
    description: '+20% crystal generation while equipped.',
    cost: 18,
    unlockMilestone: 'wave_100',
    effect: () => ({ crystalMult: 1.2 }),
  },
  architects_compass: {
    id: 'architects_compass',
    name: "Architect's Compass",
    description: '-12% build and upgrade costs while equipped.',
    cost: 20,
    unlockMilestone: 'prestige_5',
    effect: () => ({ buildCostMult: 0.88, upgradeCostMult: 0.88 }),
  },
  crown_of_ages: {
    id: 'crown_of_ages',
    name: 'Crown of Ages',
    description: '+30% prestige tokens earned on reset.',
    cost: 35,
    unlockMilestone: 'prestige_10',
    effect: () => ({ prestigeTokenMult: 1.3 }),
  },
};

export const ARTIFACT_SLOT_UNLOCKS = [
  { slot: 0, prestigeLevel: 1, label: 'Slot 1 — unlocked at Prestige Level 1' },
  { slot: 1, prestigeLevel: 3, label: 'Slot 2 — unlocked at Prestige Level 3' },
  { slot: 2, prestigeLevel: 5, label: 'Slot 3 — unlocked at Prestige Level 5' },
];

export const PRESTIGE_SHOP_ITEMS = {
  unlock_gust_early: {
    id: 'unlock_gust_early',
    name: 'Gust Totem Blueprint',
    description: 'Unlock Gust Totem from wave 1 on new runs.',
    cost: 25,
    category: 'unlock',
  },
  unlock_bank_early: {
    id: 'unlock_bank_early',
    name: 'Bank Charter',
    description: 'Banks available from wave 5 instead of wave 15.',
    cost: 30,
    category: 'unlock',
  },
  theme_twilight: {
    id: 'theme_twilight',
    name: 'Twilight HUD Theme',
    description: 'Purple-gold interface theme.',
    cost: 15,
    category: 'cosmetic',
  },
  theme_emerald: {
    id: 'theme_emerald',
    name: 'Emerald HUD Theme',
    description: 'Deep green interface theme.',
    cost: 15,
    category: 'cosmetic',
  },
  music_tranquil: {
    id: 'music_tranquil',
    name: 'Tranquil Meadows (Music)',
    description: 'Unlock ambient meadow soundtrack slot.',
    cost: 20,
    category: 'music',
  },
  map_autumn: {
    id: 'map_autumn',
    name: 'Autumn Map Theme',
    description: 'Warm autumn terrain palette.',
    cost: 25,
    category: 'map',
  },
  wonder_blueprint: {
    id: 'wonder_blueprint',
    name: 'Wonder Blueprint',
    description: 'World Wonders cost 10% less gold.',
    cost: 40,
    category: 'unlock',
    effect: () => ({ wonderCostMult: 0.9 }),
  },
};

export const WORLD_LEGACY_STAGES = [
  { id: 'village', name: 'Village Square', description: 'Restore the humble village at the meadow edge.', cost: 20, maxRank: 3 },
  { id: 'castle_walls', name: 'Castle Walls', description: 'Rebuild the ancient castle fortifications.', cost: 35, maxRank: 3 },
  { id: 'gardens', name: 'Royal Gardens', description: 'Cultivate the surrounding gardens for prosperity.', cost: 30, maxRank: 3 },
  { id: 'watchtower', name: 'Sky Watchtower', description: 'Erect a watchtower overlooking the path.', cost: 45, maxRank: 2 },
  { id: 'monument', name: 'Heroes Monument', description: 'A monument to every commander who defended the meadow.', cost: 60, maxRank: 1 },
];

export const WORLD_EVENTS = {
  harvest_festival: {
    id: 'harvest_festival',
    name: 'Harvest Festival',
    description: '+50% farm income for 5 waves when activated.',
    durationWaves: 5,
    unlockRequirement: { bestWave: 30 },
    effect: { farmIncomeMult: 0.5 },
    activationCost: 5,
  },
  war_drum: {
    id: 'war_drum',
    name: 'War Drum',
    description: '+25% tower damage for 3 waves when activated.',
    durationWaves: 3,
    unlockRequirement: { totalPrestiges: 2 },
    effect: { damageMult: 0.25 },
    activationCost: 8,
  },
  crystal_storm: {
    id: 'crystal_storm',
    name: 'Crystal Storm',
    description: 'Double crystal drops for 4 waves when activated.',
    durationWaves: 4,
    unlockRequirement: { bestWave: 75 },
    effect: { crystalMult: 1.0 },
    activationCost: 10,
  },
  golden_age: {
    id: 'golden_age',
    name: 'Golden Age',
    description: '+20% all gold earned for 5 waves when activated.',
    durationWaves: 5,
    unlockRequirement: { totalPrestiges: 5 },
    effect: { goldEarnedMult: 0.2 },
    activationCost: 12,
  },
  ancient_awakening: {
    id: 'ancient_awakening',
    name: 'Ancient Awakening',
    description: '+30% tower damage for 4 waves when activated.',
    durationWaves: 4,
    unlockRequirement: { worldTier: 4 },
    effect: { damageMult: 0.3 },
    activationCost: 15,
  },
  cataclysm_fury: {
    id: 'cataclysm_fury',
    name: 'Cataclysm Fury',
    description: '+50% all rewards for 3 waves when activated.',
    durationWaves: 3,
    unlockRequirement: { worldTier: 6 },
    effect: { goldEarnedMult: 0.5, crystalMult: 0.5 },
    activationCost: 20,
  },
};

export const PRESTIGE_RESET_LIST = {
  willReset: [
    'Current wave progress',
    'Gold and lives',
    'All towers, farms, and support structures',
    'Current-run research points and upgrades',
    'Temporary commander buffs and overclocks',
    'Run investments and World Wonder built this run',
  ],
  willRemain: [
    'Prestige Level and Prestige Tokens (✿)',
    'Prestige Tree upgrades',
    'Ascension Perks',
    'Legacy Artifacts and equipped loadout',
    'Prestige Shop unlocks and cosmetics',
    'World Legacy restoration progress',
    'Lifetime statistics and accomplishments',
    'Game settings and save data',
  ],
};
