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

/** Path-specific Needle master upgrades — unlocked at max mastery. */
export const NEEDLE_MASTER_UPGRADES = {
  rapid_fire: {
    name: 'Needle Storm',
    description: 'Every 16s, attack speed doubles for 4 seconds.',
    effects: { needleStormCooldown: 16, needleStormDuration: 4, needleStormSpeedMult: 2 },
  },
  marksman: {
    name: 'Deadeye',
    description: 'Every 6th shot is a guaranteed crit that ignores armor.',
    effects: { deadeyeInterval: 6 },
  },
  hunter: {
    name: 'Execution Shot',
    description: 'Every 10s, fires a devastating shot vs bosses and elites.',
    effects: { executionShotInterval: 10, executionShotDamageMult: 4.5 },
  },
};

/** Unique Master Upgrade unlocked at max mastery level per tower type. */
export const MASTER_UPGRADES = {
  needle: null,
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
  thorn: {
    name: 'Impaling Volley',
    description: 'Every 5th shot pierces 6 foes with greatly increased boss and elite damage.',
    effects: {
      bonusShotInterval: 5,
      pierce: 6,
      bossDamageMult: 2.0,
      eliteDamageMult: 1.85,
      damageMult: 1.2,
    },
  },
  frost: {
    name: 'Absolute Zero',
    description: 'Periodic frost pulse heavily slows nearby foes; bosses and elites resist.',
    effects: {
      frostPulseSlow: 0.72,
      frostPulseInterval: 9,
      frostPulseDuration: 2.8,
      auraSlowMult: 1.25,
      slowPercent: 0.62,
      slowDuration: 3.5,
      rangeMult: 1.2,
    },
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

export function getMasteryModifiers(level, masterUnlocked, typeId, branch = null) {
  const bonus = MASTERY_CONFIG.perLevelBonus;
  const mods = {
    damageMult: 1 + level * bonus.damageMult,
    rangeMult: 1 + level * bonus.rangeMult,
    attackSpeedMult: 1 + level * bonus.attackSpeedMult,
  };

  if (masterUnlocked && typeId === 'needle' && branch && NEEDLE_MASTER_UPGRADES[branch]) {
    Object.assign(mods, NEEDLE_MASTER_UPGRADES[branch].effects);
  } else if (masterUnlocked && MASTER_UPGRADES[typeId]) {
    Object.assign(mods, MASTER_UPGRADES[typeId].effects);
  }

  return mods;
}

export function getNeedleMasterUpgrade(branch) {
  return NEEDLE_MASTER_UPGRADES[branch] || null;
}
