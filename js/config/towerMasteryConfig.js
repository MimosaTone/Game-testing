/** Per-tower instance mastery — XP earned from kills during a run. */
export const MASTERY_CONFIG = {
  xpPerKill: 8,
  xpPerBossKill: 40,
  xpPerWaveSurvived: 3,

  /** XP required to reach each level (index = target level). */
  xpThresholds: [0, 50, 120, 220, 350, 520, 720, 960, 1250, 1600, 2000],

  /** Passive bonus per mastery level (stacks). */
  perLevelBonus: {
    damageMult: 0.04,
    rangeMult: 0.02,
    attackSpeedMult: 0.03,
  },
};

/** Unique Master Upgrade unlocked at max mastery level per tower type. */
export const MASTER_UPGRADES = {
  needle: {
    name: 'Storm Needle',
    description: 'Every 5th shot fires a bonus dart at full damage.',
    effects: { bonusShotInterval: 5 },
  },
  boulder: {
    name: 'Cataclysm',
    description: 'Splash damage no longer falls off at range.',
    effects: { splashFalloff: 0 },
  },
  prism: {
    name: 'Arcane Conduit',
    description: '+2 chain targets on every hit.',
    effects: { chainCount: 2 },
  },
  gust: {
    name: 'Tempest Heart',
    description: 'Aura slow doubled; knockback cooldown halved.',
    effects: { auraSlowMult: 2, knockbackIntervalMult: 0.5 },
  },
  ember: {
    name: 'Inferno Core',
    description: 'Burn spreads to 3 nearby foes and ignores all armor.',
    effects: { burnSpread: 1, burnSpreadCount: 3, burnIgnoresArmor: 1 },
  },
};

export function getMasteryLevel(xp) {
  let level = 0;
  for (let i = 1; i < MASTERY_CONFIG.xpThresholds.length; i++) {
    if (xp >= MASTERY_CONFIG.xpThresholds[i]) level = i;
    else break;
  }
  return level;
}

export function getMasteryProgress(xp) {
  const level = getMasteryLevel(xp);
  const maxLevel = MASTERY_CONFIG.xpThresholds.length - 1;
  if (level >= maxLevel) return { level, maxLevel, current: 0, needed: 0, pct: 1 };

  const current = xp - MASTERY_CONFIG.xpThresholds[level];
  const needed = MASTERY_CONFIG.xpThresholds[level + 1] - MASTERY_CONFIG.xpThresholds[level];
  return { level, maxLevel, current, needed, pct: current / needed };
}

export function getMasteryModifiers(level, masterUnlocked, typeId) {
  const bonus = MASTERY_CONFIG.perLevelBonus;
  const mods = {
    damageMult: 1 + level * bonus.damageMult,
    rangeMult: 1 + level * bonus.rangeMult,
    attackSpeedMult: 1 + level * bonus.attackSpeedMult,
  };

  if (masterUnlocked && MASTER_UPGRADES[typeId]) {
    Object.assign(mods, MASTER_UPGRADES[typeId].effects);
  }

  return mods;
}
