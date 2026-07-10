import { ENEMY_TYPES } from './enemyTypes.js';

/** Display metadata for mixed-faction waves. */
export const MIXED_ASSAULT = {
  id: 'mixed',
  displayName: 'Mixed Assault',
  warning: 'Multiple enemy factions coordinating',
  strength: 'Varied threats — adapt quickly',
  color: '#b39ddb',
};

/**
 * Enemy faction definitions — wave identity, spawn weights, and modifiers.
 * Wave effects are applied generically via waveModifier fields.
 */
export const FACTIONS = {
  swarm: {
    id: 'swarm',
    displayName: 'Swarm',
    description: 'Overwhelming numbers of fragile invaders.',
    warning: 'Large numbers of fast enemies',
    strength: 'Splash and crowd control',
    color: '#7e57c2',
    memberIds: ['mote', 'drift'],
    specialistIds: [],
    unlockWorldTier: 1,
    waveSpawnWeights: { 1: 50, 2: 45, 3: 30, 4: 22, 5: 18, 6: 15 },
    bossPool: [],
    escortPool: ['mote', 'drift'],
    waveModifier: {
      enemyCountMult: 1.3,
      healthMult: 0.9,
      spawnDelayMult: 0.85,
    },
  },

  bastion: {
    id: 'bastion',
    displayName: 'Bastion',
    description: 'Armored defenders that absorb punishment.',
    warning: 'Heavy armor and durable enemies',
    strength: 'Armor penetration and sustained DPS',
    color: '#546e7a',
    memberIds: ['husk', 'ward', 'titan', 'legendary_titan'],
    specialistIds: [],
    unlockWorldTier: 1,
    waveSpawnWeights: { 1: 18, 2: 22, 3: 28, 4: 30, 5: 32, 6: 30 },
    bossPool: [],
    escortPool: ['husk', 'ward'],
    waveModifier: {
      enemyCountMult: 0.78,
      healthMult: 1.1,
      armorAdd: 0.05,
      spawnDelayMult: 1.12,
    },
  },

  frostbound: {
    id: 'frostbound',
    displayName: 'Frostbound',
    description: 'Regenerating ice-bound forces.',
    warning: 'Regenerating enemies — attrition fights',
    strength: 'Burn, burst damage, or control',
    color: '#4fc3f7',
    memberIds: ['rime', 'ancient_rime'],
    specialistIds: [],
    unlockWorldTier: 3,
    waveSpawnWeights: { 1: 0, 2: 0, 3: 22, 4: 24, 5: 22, 6: 20 },
    bossPool: [],
    escortPool: ['rime'],
    waveModifier: {
      regenMult: 1.45,
      regenAdd: 0.8,
      speedMult: 0.93,
    },
  },

  raiders: {
    id: 'raiders',
    displayName: 'Raiders',
    description: 'Specialists that target your economy and structures.',
    warning: 'Structure attackers expected',
    strength: 'Protect farms and support buildings',
    color: '#ff6f00',
    memberIds: ['bomber', 'saboteur', 'siege', 'skyrift'],
    specialistIds: ['bomber', 'saboteur', 'siege', 'skyrift'],
    unlockWorldTier: 1,
    waveSpawnWeights: { 1: 8, 2: 12, 3: 18, 4: 22, 5: 26, 6: 28 },
    bossPool: [],
    escortPool: ['bomber', 'saboteur'],
    waveModifier: {
      specialistWeightMult: 1.8,
      enemyCountMult: 0.9,
    },
  },

  ancients: {
    id: 'ancients',
    displayName: 'Ancients',
    description: 'Capstone bosses and their elite escorts.',
    warning: 'Boss escorts and elite units',
    strength: 'Boss damage and anti-elite tools',
    color: '#2e7d32',
    memberIds: ['boss_briar', 'boss_gale', 'boss_mire', 'ancient_rime', 'legendary_titan'],
    specialistIds: [],
    unlockWorldTier: 4,
    waveSpawnWeights: { 1: 0, 2: 0, 3: 0, 4: 8, 5: 12, 6: 15 },
    bossPool: ['boss_briar', 'boss_gale', 'boss_mire'],
    escortPool: ['drift', 'husk', 'ward', 'rime'],
    waveModifier: {
      eliteTraitBonus: 0.12,
      healthMult: 1.05,
    },
  },
};

const FACTION_LIST = Object.values(FACTIONS);

/** Deterministic pseudo-random in [0, 1) from wave number. */
export function waveRng(waveNumber, salt = 0) {
  const x = Math.sin(waveNumber * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function getFaction(id) {
  return FACTIONS[id] ?? null;
}

export function getEnemyFactionId(enemyId) {
  return ENEMY_TYPES[enemyId]?.faction ?? null;
}

/** Factions available at the given world tier (excludes boss-only ancients from regular picks). */
export function getSelectableFactions(worldTier, includeAncients = false) {
  return FACTION_LIST.filter((f) => {
    if (f.id === 'ancients' && !includeAncients) return false;
    return worldTier >= f.unlockWorldTier;
  });
}

function getFactionWeight(faction, worldTier) {
  return faction.waveSpawnWeights[worldTier] ?? faction.waveSpawnWeights[1] ?? 0;
}

function weightedPick(candidates, worldTier, roll) {
  const weights = candidates.map((f) => getFactionWeight(f, worldTier));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return candidates[0]?.id ?? 'swarm';

  let threshold = roll * total;
  for (let i = 0; i < candidates.length; i++) {
    threshold -= weights[i];
    if (threshold <= 0) return candidates[i].id;
  }
  return candidates[candidates.length - 1].id;
}

/** Mixed-wave chance rises with world tier; early waves strongly favor focused waves. */
export function getMixedWaveChance(worldTier, waveNumber) {
  const baseMixed = 0.3;
  const earlyPenalty = waveNumber <= 10 ? (10 - waveNumber) * 0.025 : 0;
  const tierBonus = Math.max(0, worldTier - 3) * 0.04;
  return Math.min(0.42, Math.max(0.05, baseMixed - earlyPenalty + tierBonus));
}

/**
 * Merge wave modifiers from one or more factions.
 * Mixed waves dampen per-faction extremes.
 */
export function mergeFactionModifiers(factionIds, isMixed = false) {
  const mods = factionIds.map((id) => FACTIONS[id]?.waveModifier ?? {});
  const dampen = isMixed ? 0.6 : 1;

  const blendMult = (key, fallback = 1) => {
    const vals = mods.map((m) => m[key] ?? fallback);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return 1 + (avg - 1) * dampen;
  };

  const blendAdd = (key, fallback = 0) => {
    const vals = mods.map((m) => m[key] ?? fallback);
    return (vals.reduce((a, b) => a + b, 0) / vals.length) * dampen;
  };

  return {
    enemyCountMult: blendMult('enemyCountMult'),
    healthMult: blendMult('healthMult'),
    speedMult: blendMult('speedMult'),
    armorAdd: blendAdd('armorAdd'),
    regenMult: blendMult('regenMult'),
    regenAdd: blendAdd('regenAdd'),
    spawnDelayMult: blendMult('spawnDelayMult'),
    specialistWeightMult: blendMult('specialistWeightMult'),
    eliteTraitBonus: blendAdd('eliteTraitBonus'),
  };
}

/**
 * Resolve which faction(s) lead the upcoming wave.
 * Returns stable results for a given wave + tier (deterministic RNG).
 */
export function resolveWaveFactions(waveNumber, challengeFx = {}, { isBoss = false } = {}) {
  const tier = challengeFx.tier ?? {};
  const worldTier = tier.tier ?? 1;

  if (isBoss) {
    return {
      factions: ['ancients'],
      isMixed: false,
      primaryFaction: 'ancients',
      modifier: mergeFactionModifiers(['ancients']),
      worldTier,
    };
  }

  if (waveNumber <= 2) {
    return {
      factions: ['swarm'],
      isMixed: false,
      primaryFaction: 'swarm',
      modifier: mergeFactionModifiers(['swarm']),
      worldTier,
    };
  }

  const candidates = getSelectableFactions(worldTier);
  const mixedChance = getMixedWaveChance(worldTier, waveNumber);
  const mixedRoll = waveRng(waveNumber, 1);

  if (mixedRoll < mixedChance && candidates.length >= 2) {
    const first = weightedPick(candidates, worldTier, waveRng(waveNumber, 2));
    const remaining = candidates.filter((f) => f.id !== first);
    const second = weightedPick(remaining, worldTier, waveRng(waveNumber, 3));
    const factions = [first, second];
    return {
      factions,
      isMixed: true,
      primaryFaction: first,
      modifier: mergeFactionModifiers(factions, true),
      worldTier,
    };
  }

  const primary = weightedPick(candidates, worldTier, waveRng(waveNumber, 4));
  return {
    factions: [primary],
    isMixed: false,
    primaryFaction: primary,
    modifier: mergeFactionModifiers([primary]),
    worldTier,
  };
}

/** HUD display bundle for a wave faction resolution. */
export function getFactionDisplay(factionMeta) {
  if (factionMeta.isMixed) {
    return { ...MIXED_ASSAULT, isMixed: true };
  }
  const faction = FACTIONS[factionMeta.primaryFaction];
  if (!faction) return { ...MIXED_ASSAULT, isMixed: true };
  return {
    id: faction.id,
    displayName: faction.displayName,
    warning: faction.warning,
    strength: faction.strength,
    color: faction.color,
    isMixed: false,
  };
}

/** Filter member IDs by world-tier gates on special units. */
export function getAvailableMembers(factionId, worldTier) {
  const faction = FACTIONS[factionId];
  if (!faction) return [];
  return faction.memberIds.filter((id) => {
    if (id === 'ancient_rime' && worldTier < 4) return false;
    if (id === 'legendary_titan' && worldTier < 5) return false;
    if (ENEMY_TYPES[id]?.isBoss) return false;
    return true;
  });
}
