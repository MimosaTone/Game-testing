import { BOSS_ROTATION, ENEMY_TYPES } from './enemyTypes.js';
import {
  BOSS_TIER_MECHANICS,
  BOSS_TIER_MODIFIERS,
} from './worldTierConfig.js';
import {
  FACTIONS,
  getAvailableMembers,
  getFactionDisplay,
  mergeFactionModifiers,
  resolveWaveFactions,
} from './factionConfig.js?v=20260710c';

/** Boss waves occur every 15 rounds. */
export function isBossWave(waveNumber) {
  return waveNumber > 0 && waveNumber % 15 === 0;
}

function mergeEffects(challengeFx = {}) {
  const tier = challengeFx.tier ?? {};
  return {
    ...challengeFx,
    enemyHealthMult: (challengeFx.enemyHealthMult ?? 1) * (tier.enemyHealthMult ?? 1),
    enemySpeedMult: (challengeFx.enemySpeedMult ?? 1) * (tier.enemySpeedMult ?? 1),
    eliteSpawnMult: (challengeFx.eliteSpawnMult ?? 1) * (tier.eliteSpawnMult ?? 1),
  };
}

function computeBossTierFx(waveNumber, fx) {
  const tier = fx.tier ?? {};
  const cycle = Math.floor(waveNumber / 15) - 1;
  let bossTierMechanic = null;
  let bossTierModifier = null;
  let bossMultiPhase = false;
  let bossEmpowered = fx.bossEmpowered ?? false;

  if (tier.bossExtraMechanic) {
    bossTierMechanic = BOSS_TIER_MECHANICS[cycle % BOSS_TIER_MECHANICS.length];
  }
  if (tier.bossRandomModifier || fx.bossContamination) {
    bossTierModifier = BOSS_TIER_MODIFIERS[(cycle + waveNumber) % BOSS_TIER_MODIFIERS.length];
    if (bossTierModifier === 'armored') bossEmpowered = true;
  }
  if (fx.bossContamination && cycle > 0) {
    bossEmpowered = true;
  }
  if (tier.eliteBossChance > 0 && cycle % 3 === 2) {
    bossEmpowered = true;
  }
  if (tier.multiPhaseBoss) {
    bossMultiPhase = true;
  }

  return { bossTierMechanic, bossTierModifier, bossMultiPhase, bossEmpowered };
}

/** Shared wave baseline counts — factions distribute these across their roster. */
function getWaveBaseline(waveNumber) {
  if (waveNumber === 1) {
    return { bulk: 5, fast: 0, heavy: 0, armored: 0, elite: 0, regen: 0, delay: 1000, fastDelay: 750, heavyDelay: 1300, armoredDelay: 1100, eliteDelay: 2600, regenDelay: 1400 };
  }
  if (waveNumber === 2) {
    return { bulk: 6, fast: 2, heavy: 0, armored: 0, elite: 0, regen: 0, delay: 900, fastDelay: 750, heavyDelay: 1300, armoredDelay: 1100, eliteDelay: 2600, regenDelay: 1400 };
  }
  if (waveNumber <= 4) {
    return {
      bulk: 4 + waveNumber,
      fast: waveNumber,
      heavy: 0,
      armored: 0,
      elite: 0,
      regen: 0,
      delay: 900,
      fastDelay: 700,
      heavyDelay: 1300,
      armoredDelay: 1100,
      eliteDelay: 2600,
      regenDelay: 1400,
    };
  }
  if (waveNumber <= 8) {
    return {
      bulk: 5 + waveNumber,
      fast: 2 + waveNumber,
      heavy: Math.floor((waveNumber - 4) / 2),
      armored: 0,
      elite: 0,
      regen: 0,
      delay: 800,
      fastDelay: 600,
      heavyDelay: 1050,
      armoredDelay: 1100,
      eliteDelay: 2600,
      regenDelay: 1400,
    };
  }
  if (waveNumber <= 12) {
    return {
      bulk: 6 + waveNumber,
      fast: 3 + waveNumber,
      heavy: 1 + Math.floor(waveNumber / 3),
      armored: waveNumber >= 10 ? Math.floor((waveNumber - 9) / 2) : 0,
      elite: waveNumber >= 11 ? 1 : 0,
      regen: 0,
      delay: 700,
      fastDelay: 520,
      heavyDelay: 900,
      armoredDelay: 950,
      eliteDelay: 2200,
      regenDelay: 1400,
    };
  }
  if (waveNumber <= 18) {
    return {
      bulk: 0,
      fast: 5 + waveNumber,
      heavy: 2 + Math.floor(waveNumber / 2),
      armored: 2 + Math.floor(waveNumber / 4),
      elite: 1 + Math.floor((waveNumber - 12) / 3),
      regen: waveNumber >= 14 ? Math.floor((waveNumber - 12) / 2) : 0,
      delay: 480,
      fastDelay: 480,
      heavyDelay: 900,
      armoredDelay: 950,
      eliteDelay: 2200,
      regenDelay: 1400,
    };
  }

  const scale = waveNumber - 18;
  return {
    bulk: 0,
    fast: 14 + scale * 2,
    heavy: 6 + scale,
    armored: 4 + scale,
    elite: 2 + Math.floor(scale / 2),
    regen: 3 + Math.floor(scale / 2),
    delay: 400,
    fastDelay: 400,
    heavyDelay: 750,
    armoredDelay: 800,
    eliteDelay: 1800,
    regenDelay: 1100,
  };
}

function pushGroup(groups, type, count, spawnDelayMs) {
  if (count > 0) groups.push({ type, count, spawnDelayMs });
}

/** Build spawn groups for a single faction using the shared baseline curve. */
function buildFactionComposition(factionId, waveNumber, worldTier, challengeFx) {
  const baseline = getWaveBaseline(waveNumber);
  const mult = challengeFx.eliteSpawnMult ?? 1;
  const groups = [];
  const members = getAvailableMembers(factionId, worldTier);
  const faction = FACTIONS[factionId];
  const specMult = (faction?.waveModifier?.specialistWeightMult ?? 1) * mult;

  if (factionId === 'swarm') {
    pushGroup(groups, 'mote', Math.ceil(baseline.bulk + baseline.fast * 0.4), baseline.delay);
    pushGroup(groups, 'drift', Math.ceil(baseline.fast), baseline.fastDelay);
  } else if (factionId === 'bastion') {
    pushGroup(groups, 'husk', Math.ceil(baseline.heavy + baseline.bulk * 0.3), baseline.heavyDelay);
    pushGroup(groups, 'ward', Math.ceil(baseline.armored), baseline.armoredDelay);
    pushGroup(groups, 'titan', Math.ceil(baseline.elite), baseline.eliteDelay);
    if (members.includes('legendary_titan') && waveNumber >= 12 && waveNumber % 7 === 0) {
      pushGroup(groups, 'legendary_titan', 1, baseline.eliteDelay + 800);
    }
  } else if (factionId === 'frostbound') {
    pushGroup(groups, 'rime', Math.ceil(baseline.regen + baseline.heavy * 0.5), baseline.regenDelay);
    if (members.includes('ancient_rime') && waveNumber >= 8) {
      const ancientCount = Math.max(1, Math.floor((waveNumber / 12) * (challengeFx.tier?.ancientChance ?? 0.35) * 2));
      pushGroup(groups, 'ancient_rime', ancientCount, baseline.regenDelay + 400);
    }
  } else if (factionId === 'raiders') {
    const offset = challengeFx.tier?.specialWaveOffset ?? 0;
    if (waveNumber >= 6 - offset) {
      pushGroup(groups, 'bomber', Math.ceil(1 * specMult), 1200);
    }
    if (waveNumber >= 9 - offset) {
      pushGroup(groups, 'saboteur', Math.ceil(1 * specMult), 1400);
    }
    if (waveNumber >= 12 - offset) {
      pushGroup(groups, 'siege', Math.ceil(1 * specMult), 2000);
    }
    if (waveNumber >= 15 - offset) {
      pushGroup(groups, 'skyrift', Math.ceil(1 * specMult), 1600);
    }
    if (waveNumber < 6 - offset) {
      pushGroup(groups, 'bomber', Math.ceil(1 * specMult * 0.5), 1400);
      pushGroup(groups, 'drift', Math.ceil(baseline.fast * 0.5), baseline.fastDelay);
    }
  }

  return groups.filter((g) => members.includes(g.type) || g.type === 'drift');
}

function applyFactionToGroups(groups, modifier) {
  const countMult = modifier.enemyCountMult ?? 1;
  const delayMult = modifier.spawnDelayMult ?? 1;
  return groups.map((g) => ({
    ...g,
    count: Math.max(1, Math.round(g.count * countMult)),
    spawnDelayMs: Math.max(250, Math.round(g.spawnDelayMs * delayMult)),
  }));
}

function combineMixedGroups(factionIds, waveNumber, worldTier, challengeFx) {
  let waves = [];
  for (const factionId of factionIds) {
    const partial = buildFactionComposition(factionId, waveNumber, worldTier, challengeFx);
    waves.push(...partial.map((g) => ({
      ...g,
      count: Math.max(1, Math.round(g.count * 0.55)),
    })));
  }
  return waves;
}

function factionIncludesRaiders(factionMeta) {
  return factionMeta.factions.includes('raiders');
}

/**
 * Resolve faction metadata for a wave (deterministic preview + runtime).
 */
export function getWaveFactionMeta(waveNumber, challengeFx = {}) {
  const factionMeta = resolveWaveFactions(waveNumber, challengeFx, {
    isBoss: isBossWave(waveNumber),
  });
  return {
    ...factionMeta,
    display: getFactionDisplay(factionMeta),
  };
}

/**
 * Boss wave composition — one unique boss plus faction-themed escorts.
 */
export function generateBossWave(waveNumber, challengeFx = {}, factionMeta = null) {
  const fx = mergeEffects(challengeFx);
  const tier = fx.tier ?? {};
  const meta = factionMeta ?? getWaveFactionMeta(waveNumber, challengeFx);
  const cycle = Math.floor(waveNumber / 15) - 1;
  const bossType = BOSS_ROTATION[cycle % BOSS_ROTATION.length];
  let escort = 3 + Math.floor(waveNumber / 15) * 2;
  const waves = [];

  const bossFx = computeBossTierFx(waveNumber, fx);
  if (bossFx.bossTierModifier === 'splitting') escort = Math.ceil(escort * 1.5);

  if (fx.doubleBoss) {
    waves.push({ type: bossType, count: 2, spawnDelayMs: 0, isBoss: true });
  } else {
    waves.push({ type: bossType, count: 1, spawnDelayMs: 0, isBoss: true });
  }

  const escortPool = FACTIONS.ancients.escortPool;
  const escortDelay = tier.coordinatedWaves ? 500 : 700;
  const escortTypes = [
    { type: escortPool[0], share: 0.45 },
    { type: escortPool[1], share: 0.35 },
    { type: escortPool[2], share: 0.2 },
  ];

  for (const { type, share } of escortTypes) {
    const count = Math.max(1, Math.round(escort * share));
    waves.push({ type, count, spawnDelayMs: escortDelay });
  }

  if (tier.coordinatedWaves) {
    waves.push({
      type: escortPool[3] ?? 'ward',
      count: Math.ceil(escort / 3),
      spawnDelayMs: escortDelay + 200,
    });
  }

  return applyFactionToGroups(waves, meta.modifier);
}

/** Inject occasional specialists on non-raider waves. */
function injectSpecialEnemies(waves, waveNumber, challengeFx) {
  const tier = challengeFx.tier ?? {};
  const offset = tier.specialWaveOffset ?? 0;
  const early = challengeFx.earlySpecialists ? 3 : 0;
  if (waveNumber < 6 - offset - early && !challengeFx.spawnSpecialEnemies) return waves;

  const mult = challengeFx.eliteSpawnMult ?? 1;
  const extra = [];

  if (waveNumber >= 6 - offset - early || challengeFx.spawnSpecialEnemies) {
    extra.push({ type: 'bomber', count: Math.ceil(1 * mult), spawnDelayMs: 1200 });
  }
  if (waveNumber >= 9 - offset - early || challengeFx.spawnSpecialEnemies) {
    extra.push({ type: 'saboteur', count: Math.ceil(1 * mult), spawnDelayMs: 1400 });
  }
  if (waveNumber >= 12 - offset) {
    extra.push({ type: 'siege', count: Math.ceil(1 * mult), spawnDelayMs: 2000 });
  }
  if (waveNumber >= 15 - offset) {
    extra.push({ type: 'skyrift', count: Math.ceil(1 * mult), spawnDelayMs: 1600 });
  }

  return [...waves, ...extra];
}

const ELITE_WAVE_TYPES = ['husk', 'drift', 'ward', 'rime', 'titan'];

function ensureNoSafeWaveElites(waves, waveNumber, challengeFx) {
  if (!challengeFx.noSafeWave || waveNumber % 5 !== 0 || isBossWave(waveNumber)) return waves;
  const hasElite = waves.some((g) => ELITE_WAVE_TYPES.includes(g.type) && g.count > 0);
  if (hasElite) return waves;
  return [...waves, { type: 'husk', count: 1, spawnDelayMs: 1800 }];
}

/** Inject ancient and legendary enemies at higher world tiers (non-faction-specific). */
function injectTierEnemies(waves, waveNumber, challengeFx, factionMeta) {
  const tier = challengeFx.tier ?? {};
  const extra = [];
  const isFrostbound = factionMeta.primaryFaction === 'frostbound';
  const isBastion = factionMeta.primaryFaction === 'bastion';

  if (tier.ancientChance > 0 && waveNumber >= 8 && !isFrostbound) {
    const count = Math.max(1, Math.floor((waveNumber / 10) * tier.ancientChance * 2));
    extra.push({ type: 'ancient_rime', count, spawnDelayMs: 1800 });
  }

  if (tier.legendaryChance > 0 && waveNumber >= 12 && waveNumber % 7 === 0 && !isBastion) {
    extra.push({ type: 'legendary_titan', count: 1, spawnDelayMs: 3000 });
  }

  return [...waves, ...extra];
}

function scaleWaveGroups(waves, challengeFx) {
  const countMult = challengeFx.enemyCountMult ?? 1;
  if (countMult === 1) return waves;
  return waves.map((g) => ({
    ...g,
    count: Math.max(1, Math.round(g.count * countMult)),
  }));
}

function applyCoordinatedSpawns(waves, challengeFx) {
  const tier = challengeFx.tier ?? {};
  if (!tier.coordinatedWaves) return waves;
  return waves.map((g) => ({
    ...g,
    spawnDelayMs: Math.max(300, Math.round(g.spawnDelayMs * 0.65)),
  }));
}

/**
 * Wave composition generator with faction identity.
 * @returns {{ waves: object[], factionMeta: object }}
 */
export function generateWave(waveNumber, challengeFx = {}, factionMeta = null) {
  const fx = mergeEffects(challengeFx);
  const meta = factionMeta ?? getWaveFactionMeta(waveNumber, challengeFx);
  const worldTier = meta.worldTier ?? fx.tier?.tier ?? 1;

  if (isBossWave(waveNumber)) {
    const bossWaves = generateBossWave(waveNumber, fx, meta);
    return {
      waves: scaleWaveGroups(injectSpecialEnemies(bossWaves, waveNumber, fx), fx),
      factionMeta: meta,
    };
  }

  let waves;
  if (meta.isMixed) {
    waves = combineMixedGroups(meta.factions, waveNumber, worldTier, fx);
  } else {
    waves = buildFactionComposition(meta.primaryFaction, waveNumber, worldTier, fx);
  }

  waves = applyFactionToGroups(waves, meta.modifier);
  waves = waves.filter((g) => g.count > 0 && ENEMY_TYPES[g.type]);

  if (!factionIncludesRaiders(meta)) {
    waves = injectSpecialEnemies(waves, waveNumber, fx);
  }
  waves = injectTierEnemies(waves, waveNumber, fx, meta);
  waves = ensureNoSafeWaveElites(waves, waveNumber, fx);
  waves = applyCoordinatedSpawns(waves, fx);

  return {
    waves: scaleWaveGroups(waves, fx),
    factionMeta: meta,
  };
}

/** Convenience: spawn groups only (backward-compatible call sites). */
export function generateWaveGroups(waveNumber, challengeFx = {}, factionMeta = null) {
  return generateWave(waveNumber, challengeFx, factionMeta).waves;
}

/** Scaling curve with challenge, world tier, and faction multipliers. */
export function getWaveScaling(waveNumber, challengeFx = {}, factionMeta = null) {
  const fx = mergeEffects(challengeFx);
  const tier = fx.tier ?? {};
  const meta = factionMeta ?? getWaveFactionMeta(waveNumber, challengeFx);
  const fmod = meta.modifier ?? mergeFactionModifiers(meta.factions, meta.isMixed);

  let healthMultiplier;
  let speedMultiplier;

  if (waveNumber <= 5) {
    healthMultiplier = 1 + (waveNumber - 1) * 0.06;
    speedMultiplier = 1 + (waveNumber - 1) * 0.018;
  } else if (waveNumber <= 10) {
    healthMultiplier = 1 + 4 * 0.06 + (waveNumber - 5) * 0.12;
    speedMultiplier = 1 + 4 * 0.018 + (waveNumber - 5) * 0.03;
  } else if (waveNumber <= 15) {
    healthMultiplier = 1 + 4 * 0.06 + 5 * 0.12 + (waveNumber - 10) * 0.18;
    speedMultiplier = 1 + 4 * 0.018 + 5 * 0.03 + (waveNumber - 10) * 0.04;
  } else {
    healthMultiplier = 1 + 4 * 0.06 + 5 * 0.12 + 5 * 0.18 + (waveNumber - 15) * 0.24;
    speedMultiplier = 1 + 4 * 0.018 + 5 * 0.03 + 5 * 0.04 + (waveNumber - 15) * 0.045;
  }

  const bossHealthMult = isBossWave(waveNumber) ? 1 + (waveNumber / 15) * 0.35 : 1;

  let armor =
    waveNumber >= 18 ? 0.22 :
    waveNumber >= 14 ? 0.15 :
    waveNumber >= 10 ? 0.1 :
    waveNumber >= 7 ? 0.05 : 0;

  let regenPerSec =
    waveNumber >= 20 ? 5 :
    waveNumber >= 16 ? 3.5 :
    waveNumber >= 12 ? 2 :
    waveNumber >= 9 ? 0.8 : 0;

  armor = Math.min(0.5, armor + (fmod.armorAdd ?? 0));
  regenPerSec = (regenPerSec + (fmod.regenAdd ?? 0)) * (fmod.regenMult ?? 1);

  const bossFx = isBossWave(waveNumber) ? computeBossTierFx(waveNumber, fx) : {};

  return {
    healthMultiplier: healthMultiplier * bossHealthMult * (fx.enemyHealthMult ?? 1) * (fmod.healthMult ?? 1),
    speedMultiplier: speedMultiplier * (fx.enemySpeedMult ?? 1) * (fmod.speedMult ?? 1),
    goldMultiplier: (1 + (waveNumber - 1) * 0.075) * (fx.killGoldMult ?? 1),
    bossGoldMult: fx.bossGoldMult ?? 1,
    armor,
    regenPerSec,
    isBossWave: isBossWave(waveNumber),
    bossEmpowered: bossFx.bossEmpowered ?? fx.bossEmpowered ?? false,
    bossTierMechanic: bossFx.bossTierMechanic ?? null,
    bossTierModifier: bossFx.bossTierModifier ?? null,
    bossMultiPhase: bossFx.bossMultiPhase ?? false,
    tierTraitChance: (tier.enemyTraitChance ?? 0) + (fmod.eliteTraitBonus ?? 0),
    worldTier: tier.tier ?? 1,
    worldTierName: tier.name ?? 'Peaceful Meadows',
    factionMeta: meta,
  };
}
