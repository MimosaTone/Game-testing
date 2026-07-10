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
  reinforced_5: {
    id: 'reinforced_5',
    name: 'Reinforced Enemies V',
    category: 'combat',
    group: 'reinforced',
    description: '+200% enemy health',
    difficulty: '+200% HP',
    effects: { enemyHealthMult: 3.0 },
    rewardBonus: 1.15,
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
  pitiless_assault: {
    id: 'pitiless_assault',
    name: 'Pitiless Assault',
    category: 'combat',
    group: 'swift',
    description: 'Enemies move 75% faster',
    difficulty: '+75% speed',
    effects: { enemySpeedMult: 1.75 },
    rewardBonus: 0.55,
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
  cataclysmic_horde: {
    id: 'cataclysmic_horde',
    name: 'Cataclysmic Horde',
    category: 'combat',
    group: 'horde',
    description: '150% more enemies per wave',
    difficulty: '+150% enemies',
    effects: { enemyCountMult: 2.5 },
    rewardBonus: 0.8,
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
    group: 'economy',
    description: 'Farms earn 40% less; kills and bosses pay much more',
    difficulty: '-40% farm income',
    effects: { farmIncomeMult: 0.6, killGoldMult: 1.8, bossGoldMult: 2.0 },
    rewardBonus: 0.5,
  },
  economic_ruin: {
    id: 'economic_ruin',
    name: 'Economic Ruin',
    category: 'economy',
    group: 'economy',
    description: 'Farms earn 55% less; kills and bosses pay even more',
    difficulty: '-55% farm income',
    effects: { farmIncomeMult: 0.45, killGoldMult: 2.5, bossGoldMult: 3.0 },
    rewardBonus: 0.65,
  },
  limited_construction: {
    id: 'limited_construction',
    name: 'Limited Construction',
    category: 'structures',
    group: 'construction',
    description: '35% fewer build locations available',
    difficulty: '-35% build spots',
    effects: { buildSpotMult: 0.65 },
    rewardBonus: 0.35,
  },
  scorched_land: {
    id: 'scorched_land',
    name: 'Scorched Land',
    category: 'structures',
    group: 'construction',
    description: '50% fewer build locations available',
    difficulty: '-50% build spots',
    effects: { buildSpotMult: 0.5 },
    rewardBonus: 0.45,
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
  doomed_stakes: {
    id: 'doomed_stakes',
    name: 'Doomed Stakes',
    category: 'survival',
    group: 'stakes',
    description: 'Begin with 16 fewer lives',
    difficulty: '-16 lives',
    effects: { livesReduction: 16 },
    rewardBonus: 0.7,
  },
  relentless_assault: {
    id: 'relentless_assault',
    name: 'Relentless Assault',
    category: 'pace',
    group: 'pace',
    description: 'Auto-start delay cut by 60%',
    difficulty: 'Less prep time',
    effects: { autoStartDelayMult: 0.4 },
    rewardBonus: 0.3,
  },
  no_quarter: {
    id: 'no_quarter',
    name: 'No Quarter',
    category: 'pace',
    group: 'pace',
    description: 'Auto-start delay cut by 80%',
    difficulty: 'Almost no prep time',
    effects: { autoStartDelayMult: 0.2 },
    rewardBonus: 0.4,
  },
};

export const CHALLENGE_PRESETS = {
  normal: {
    id: 'normal',
    name: '🌿 Warm Up',
    traditionalName: 'Normal',
    description: 'The meadow is still being kind.',
    modifiers: [],
  },
  veteran: {
    id: 'veteran',
    name: "⚔ Let's Get Started",
    traditionalName: 'Veteran',
    description: "Time to see what you've learned.",
    modifiers: ['reinforced_1', 'swift_assault'],
  },
  expert: {
    id: 'expert',
    name: "🔥 You're Playing the Actual Game Now",
    traditionalName: 'Expert',
    description: 'The training wheels are officially off.',
    modifiers: ['reinforced_2', 'elite_forces', 'endless_horde'],
  },
  nightmare: {
    id: 'nightmare',
    name: "🏋️ Let's Add Some More Weight",
    traditionalName: 'Nightmare',
    description: "You've got the fundamentals. Let's see if they hold up.",
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
    name: '💪 Do You Even Lift?',
    traditionalName: 'Apocalypse',
    description: 'The meadow has been putting in work too.',
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
    name: '🩸 Pain Is Weakness Leaving the Body',
    traditionalName: 'Extreme',
    description: "If it doesn't challenge you, it won't change you.",
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
  who_hurt_you: {
    id: 'who_hurt_you',
    name: '💔 Who Hurt You?',
    traditionalName: 'Ultimate',
    description: "...We're genuinely impressed you clicked this.",
    modifiers: [
      'reinforced_5',
      'boss_empowerment',
      'double_boss',
      'doomed_stakes',
      'economic_ruin',
      'no_quarter',
      'pitiless_assault',
      'elite_forces',
      'cataclysmic_horde',
      'scorched_land',
    ],
  },
};

/** Resolve display labels for built-in or saved custom presets. */
export function formatTraditionalLabel(name) {
  return name ? `(${name})` : '';
}

export function formatFlavorQuote(description) {
  if (!description) return '';
  return `"${description}"`;
}

export function getPresetDisplay(presetId, customPresets = []) {
  const builtin = CHALLENGE_PRESETS[presetId];
  if (builtin) {
    return {
      title: builtin.name,
      traditional: formatTraditionalLabel(builtin.traditionalName),
      description: formatFlavorQuote(builtin.description),
      isBuiltin: true,
    };
  }

  const custom = customPresets.find((p) => p.id === presetId);
  if (custom) {
    return {
      title: custom.name,
      traditional: null,
      description: 'Your saved custom modifier mix',
      isBuiltin: false,
    };
  }

  if (presetId === 'custom') {
    return {
      title: 'Custom Mix',
      traditional: null,
      description: 'Hand-picked modifiers — not matching a built-in preset',
      isBuiltin: false,
    };
  }

  return {
    title: 'Custom',
    traditional: null,
    description: '',
    isBuiltin: false,
  };
}

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
