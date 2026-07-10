import { scaledCost } from './investmentConfig.js';

/** Permanent tower overclocks — late-game gold sink after max upgrade tier. */
export const PERMANENT_OVERCLOCK = {
  unlockWave: 22,
  maxLevelPerPath: 8,
  baseCost: 900,
  costGrowth: 1.68,
  /** Each level on this tower raises costs for all paths. */
  totalLevelCostMult: 1.14,
  /** Per-level effect multiplier (diminishing returns). */
  effectDiminishPerLevel: 0.055,
  minEffectScale: 0.35,
  eliteMinTotalLevels: 14,
  eliteBaseCost: 14000,
  eliteCostPerLevel: 650,
};

/**
 * Per-tower overclock paths — different towers favor different investments.
 * effectPerLevel values are additive fractions merged into mult stats (e.g. 0.03 = +3%).
 */
export const TOWER_OVERCLOCK_PATHS = {
  needle: {
    damage: {
      id: 'damage',
      name: 'Needle Calibration',
      description: '+3% damage per level',
      effectPerLevel: { damageMult: 0.03 },
    },
    speed: {
      id: 'speed',
      name: 'Trigger Tuning',
      description: '+2.5% attack speed per level',
      effectPerLevel: { attackSpeedMult: 0.025 },
    },
    crit: {
      id: 'crit',
      name: 'Weak-Point Scanner',
      description: '+2% crit chance per level',
      effectPerLevel: { critChance: 0.02 },
    },
  },
  boulder: {
    damage: {
      id: 'damage',
      name: 'Siege Payload',
      description: '+3.5% damage per level',
      effectPerLevel: { damageMult: 0.035 },
    },
    splash: {
      id: 'splash',
      name: 'Shrapnel Spread',
      description: '+4% splash radius per level',
      effectPerLevel: { splashRadiusMult: 0.04 },
    },
    range: {
      id: 'range',
      name: 'Arc Extension',
      description: '+2% range per level',
      effectPerLevel: { rangeMult: 0.02 },
    },
  },
  prism: {
    damage: {
      id: 'damage',
      name: 'Prism Focus',
      description: '+3% damage per level',
      effectPerLevel: { damageMult: 0.03 },
    },
    chain: {
      id: 'chain',
      name: 'Refraction Matrix',
      description: '+0.25 chain targets per level (rounded)',
      effectPerLevel: { chainCountAdd: 0.25 },
    },
    speed: {
      id: 'speed',
      name: 'Pulse Cadence',
      description: '+2.5% attack speed per level',
      effectPerLevel: { attackSpeedMult: 0.025 },
    },
  },
  gust: {
    aura: {
      id: 'aura',
      name: 'Gale Amplifier',
      description: '+2% aura slow per level',
      effectPerLevel: { auraSlowMult: 0.02 },
    },
    knockback: {
      id: 'knockback',
      name: 'Pressure Valve',
      description: '-3% knockback cooldown per level',
      effectPerLevel: { knockbackIntervalMult: -0.03 },
    },
    range: {
      id: 'range',
      name: 'Wind Reach',
      description: '+2.5% range per level',
      effectPerLevel: { rangeMult: 0.025 },
    },
  },
  ember: {
    burn: {
      id: 'burn',
      name: 'Ember Intensity',
      description: '+4% burn DPS per level',
      effectPerLevel: { burnDPSAdd: 0.2 },
    },
    damage: {
      id: 'damage',
      name: 'Heat Core',
      description: '+2.5% damage per level',
      effectPerLevel: { damageMult: 0.025 },
    },
    armor: {
      id: 'armor',
      name: 'Melt Penetration',
      description: '+1.5% armor pen per level',
      effectPerLevel: { armorPen: 0.015 },
    },
  },
  thorn: {
    damage: {
      id: 'damage',
      name: 'Bolt Forging',
      description: '+3.5% damage per level',
      effectPerLevel: { damageMult: 0.035 },
    },
    elite: {
      id: 'elite',
      name: 'Hunter Marks',
      description: '+3% elite damage per level',
      effectPerLevel: { eliteDamageMult: 0.03 },
    },
    boss: {
      id: 'boss',
      name: 'Titan Breaker',
      description: '+2.5% boss damage per level',
      effectPerLevel: { bossDamageMult: 0.025 },
    },
  },
  frost: {
    slow: {
      id: 'slow',
      name: 'Deep Chill',
      description: '+2% slow strength per level',
      effectPerLevel: { slowPercentAdd: 0.02 },
    },
    aura: {
      id: 'aura',
      name: 'Permafrost Field',
      description: '+2% aura slow per level',
      effectPerLevel: { auraSlowMult: 0.02 },
    },
    duration: {
      id: 'duration',
      name: 'Rime Lock',
      description: '+3% slow duration per level',
      effectPerLevel: { slowDurationMult: 0.03 },
    },
  },
};

/** Elite overclock — one per tower after heavy permanent investment. */
export const ELITE_TOWER_OVERCLOCKS = {
  needle: {
    id: 'needle_elite',
    name: 'Assassin Protocol',
    description: 'Crits deal +15% damage; volley shots leave a faint trail.',
    effects: { critDamageMult: 1.15 },
    tag: '★ Elite Overclock',
  },
  boulder: {
    id: 'boulder_elite',
    name: 'Cataclysm Loader',
    description: 'Splash hits +12% damage; heavier impact visuals.',
    effects: { splashFalloff: 0.88, damageMult: 1.06 },
    tag: '★ Elite Overclock',
  },
  prism: {
    id: 'prism_elite',
    name: 'Infinite Refraction',
    description: '+1 chain bounce; arcs pulse brighter.',
    effects: { chainCountAdd: 1 },
    tag: '★ Elite Overclock',
  },
  gust: {
    id: 'gust_elite',
    name: 'Maelstrom Core',
    description: 'Aura slow +8%; periodic gust ripple visual.',
    effects: { auraSlowMult: 1.08 },
    tag: '★ Elite Overclock',
  },
  ember: {
    id: 'ember_elite',
    name: 'Wildfire Heart',
    description: 'Burn spreads to +1 nearby foe; ember glow intensifies.',
    effects: { burnSpread: 1, burnSpreadCount: 1 },
    tag: '★ Elite Overclock',
  },
  thorn: {
    id: 'thorn_elite',
    name: 'Piercing Judgment',
    description: '+10% armor pen; bolts leave thorn trails.',
    effects: { armorPen: 0.1 },
    tag: '★ Elite Overclock',
  },
  frost: {
    id: 'frost_elite',
    name: 'Absolute Zero',
    description: 'Slowed foes take +8% damage; icy aura brightens.',
    effects: { slowPercentAdd: 0.08 },
    tag: '★ Elite Overclock',
  },
};

export function getOverclockPathsForTower(typeId) {
  return TOWER_OVERCLOCK_PATHS[typeId] ?? null;
}

export function getPermanentOverclockCost(totalLevels, pathLevel) {
  const cfg = PERMANENT_OVERCLOCK;
  const base = cfg.baseCost * Math.pow(cfg.totalLevelCostMult, totalLevels);
  return scaledCost(base, cfg.costGrowth, pathLevel);
}

export function getEliteOverclockCost(totalLevels) {
  const cfg = PERMANENT_OVERCLOCK;
  return Math.round(cfg.eliteBaseCost + totalLevels * cfg.eliteCostPerLevel);
}

export function computePathEffect(effectPerLevel, level) {
  const cfg = PERMANENT_OVERCLOCK;
  const scale = Math.max(cfg.minEffectScale, 1 - level * cfg.effectDiminishPerLevel);
  const out = {};
  for (const [key, perLevel] of Object.entries(effectPerLevel)) {
    out[key] = perLevel * level * scale;
  }
  return out;
}
