/**
 * Voluntary challenge modifiers — stack for greater risk and reward.
 * Only one tier per grouped modifier (e.g. reinforced) may be active.
 */

export const CHALLENGE_MODIFIER_CATEGORIES = {
  combat: { id: 'combat', name: 'Combat', icon: '⚔' },
  bosses: { id: 'bosses', name: 'Bosses', icon: '☠' },
  economy: { id: 'economy', name: 'Economy', icon: '◎' },
  structures: { id: 'structures', name: 'Structures', icon: '⌂' },
  survival: { id: 'survival', name: 'Survival', icon: '♥' },
  pace: { id: 'pace', name: 'Pace', icon: '⏱' },
};

export const CHALLENGE_MODIFIER_CATEGORY_ORDER = [
  'combat', 'bosses', 'economy', 'structures', 'survival', 'pace',
];

export const CHALLENGE_MODIFIERS = {
  reinforced_1: {
    id: 'reinforced_1',
    name: 'Reinforced Enemies I',
    category: 'combat',
    group: 'reinforced',
    description: '+25% enemy health',
    difficulty: '+25% HP',
    effects: { enemyHealthMult: 1.25 },
    rewardBonus: 0.2,
  },
  reinforced_2: {
    id: 'reinforced_2',
    name: 'Reinforced Enemies II',
    category: 'combat',
    group: 'reinforced',
    description: '+50% enemy health',
    difficulty: '+50% HP',
    effects: { enemyHealthMult: 1.5 },
    rewardBonus: 0.4,
  },
  reinforced_3: {
    id: 'reinforced_3',
    name: 'Reinforced Enemies III',
    category: 'combat',
    group: 'reinforced',
    description: '+100% enemy health',
    difficulty: '+100% HP',
    effects: { enemyHealthMult: 2.0 },
    rewardBonus: 0.8,
  },
  reinforced_4: {
    id: 'reinforced_4',
    name: 'Reinforced Enemies IV',
    category: 'combat',
    group: 'reinforced',
    description: '+150% enemy health',
    difficulty: '+150% HP',
    effects: { enemyHealthMult: 2.5 },
    rewardBonus: 1.0,
  },
  swift_assault: {
    id: 'swift_assault',
    name: 'Swift Assault',
    category: 'combat',
    group: 'swift',
    description: 'Enemies move 35% faster',
    difficulty: '+35% speed',
    effects: { enemySpeedMult: 1.35 },
    rewardBonus: 0.3,
  },
  merciless_assault: {
    id: 'merciless_assault',
    name: 'Merciless Assault',
    category: 'combat',
    group: 'swift',
    description: 'Enemies move 55% faster',
    difficulty: '+55% speed',
    effects: { enemySpeedMult: 1.55 },
    rewardBonus: 0.45,
  },
  elite_forces: {
    id: 'elite_forces',
    name: 'Elite Forces',
    category: 'combat',
    description: 'Special enemies appear more often with bonus abilities',
    difficulty: 'More elites',
    effects: { eliteSpawnMult: 2.5, spawnSpecialEnemies: true },
    rewardBonus: 0.4,
  },
  endless_horde: {
    id: 'endless_horde',
    name: 'Endless Horde',
    category: 'combat',
    group: 'horde',
    description: '60% more enemies per wave',
    difficulty: '+60% enemies',
    effects: { enemyCountMult: 1.6 },
    rewardBonus: 0.5,
  },
  overwhelming_horde: {
    id: 'overwhelming_horde',
    name: 'Overwhelming Horde',
    category: 'combat',
    group: 'horde',
    description: '100% more enemies per wave',
    difficulty: '+100% enemies',
    effects: { enemyCountMult: 2.0 },
    rewardBonus: 0.65,
  },
  boss_empowerment: {
    id: 'boss_empowerment',
    name: 'Boss Empowerment',
    category: 'bosses',
    description: 'Bosses gain +50% health and empowered abilities',
    difficulty: 'Stronger bosses',
    effects: { bossHealthMult: 1.5, bossEmpowered: true },
    rewardBonus: 0.75,
  },
  double_boss: {
    id: 'double_boss',
    name: 'Double Boss',
    category: 'bosses',
    description: 'Boss waves spawn two weaker bosses',
    difficulty: 'Twin bosses',
    effects: { doubleBoss: true, bossHealthMult: 0.7 },
    rewardBonus: 1.0,
  },
  economic_crisis: {
    id: 'economic_crisis',
    name: 'Economic Crisis',
    category: 'economy',
    description: 'Farms earn 40% less; kills and bosses pay much more',
    difficulty: '-40% farm income',
    effects: { farmIncomeMult: 0.6, killGoldMult: 1.8, bossGoldMult: 2.0 },
    rewardBonus: 0.5,
  },
  limited_construction: {
    id: 'limited_construction',
    name: 'Limited Construction',
    category: 'structures',
    description: '35% fewer build locations available',
    difficulty: '-35% build spots',
    effects: { buildSpotMult: 0.65 },
    rewardBonus: 0.35,
  },
  high_stakes: {
    id: 'high_stakes',
    name: 'High Stakes',
    category: 'survival',
    group: 'stakes',
    description: 'Begin with 8 fewer lives',
    difficulty: '-8 lives',
    effects: { livesReduction: 8 },
    rewardBonus: 0.4,
  },
  brutal_stakes: {
    id: 'brutal_stakes',
    name: 'Brutal Stakes',
    category: 'survival',
    group: 'stakes',
    description: 'Begin with 12 fewer lives',
    difficulty: '-12 lives',
    effects: { livesReduction: 12 },
    rewardBonus: 0.55,
  },
  relentless_assault: {
    id: 'relentless_assault',
    name: 'Relentless Assault',
    category: 'pace',
    description: 'Auto-start delay cut by 60%',
    difficulty: 'Less prep time',
    effects: { autoStartDelayMult: 0.4 },
    rewardBonus: 0.3,
  },
};

export const CHALLENGE_PRESETS = {
  normal: {
    id: 'normal',
    name: 'Normal',
    description: 'Standard meadow defense — no bonus rewards',
    modifiers: [],
  },
  veteran: {
    id: 'veteran',
    name: 'Veteran',
    description: 'Tougher foes with modest reward bonuses',
    modifiers: ['reinforced_1', 'swift_assault'],
  },
  expert: {
    id: 'expert',
    name: 'Expert',
    description: 'Serious pressure for experienced commanders',
    modifiers: ['reinforced_2', 'elite_forces', 'endless_horde'],
  },
  nightmare: {
    id: 'nightmare',
    name: 'Nightmare',
    description: 'Extreme challenge — massive rewards',
    modifiers: [
      'reinforced_3',
      'boss_empowerment',
      'double_boss',
      'high_stakes',
      'economic_crisis',
      'relentless_assault',
    ],
  },
  apocalypse: {
    id: 'apocalypse',
    name: 'Apocalypse',
    description: 'Nightmare plus every remaining modifier — the meadow fights back',
    modifiers: [
      'reinforced_3',
      'boss_empowerment',
      'double_boss',
      'high_stakes',
      'economic_crisis',
      'relentless_assault',
      'swift_assault',
      'elite_forces',
      'endless_horde',
      'limited_construction',
    ],
  },
  pain_lover: {
    id: 'pain_lover',
    name: 'You Really Like Pain, Huh?',
    shortName: 'Pain Lover?',
    description: 'Apocalypse, but worse — max-tier misery for max-tier rewards',
    modifiers: [
      'reinforced_4',
      'boss_empowerment',
      'double_boss',
      'brutal_stakes',
      'economic_crisis',
      'relentless_assault',
      'merciless_assault',
      'elite_forces',
      'overwhelming_horde',
      'limited_construction',
    ],
  },
};

/** Group modifiers by category for the Custom Game Editor UI. */
export function getModifiersByCategory() {
  const grouped = {};
  for (const catId of CHALLENGE_MODIFIER_CATEGORY_ORDER) {
    grouped[catId] = [];
  }
  for (const mod of Object.values(CHALLENGE_MODIFIERS)) {
    const cat = mod.category ?? 'combat';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(mod);
  }
  return grouped;
}
