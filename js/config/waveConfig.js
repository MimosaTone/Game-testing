import { BOSS_ROTATION } from './enemyTypes.js';
import {
  BOSS_TIER_MECHANICS,
  BOSS_TIER_MODIFIERS,
} from './worldTierConfig.js';

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
  if (tier.bossRandomModifier) {
    bossTierModifier = BOSS_TIER_MODIFIERS[(cycle + waveNumber) % BOSS_TIER_MODIFIERS.length];
    if (bossTierModifier === 'armored') bossEmpowered = true;
  }
  if (tier.eliteBossChance > 0 && cycle % 3 === 2) {
    bossEmpowered = true;
  }
  if (tier.multiPhaseBoss) {
    bossMultiPhase = true;
  }

  return { bossTierMechanic, bossTierModifier, bossMultiPhase, bossEmpowered };
}

/**
 * Boss wave composition — one unique boss plus supporting minions.
 * @param {object} challengeFx - challenge + world tier effects
 */
export function generateBossWave(waveNumber, challengeFx = {}) {
  const fx = mergeEffects(challengeFx);
  const tier = fx.tier ?? {};
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

  const escortDelay = tier.coordinatedWaves ? 500 : 700;
  waves.push(
    { type: 'drift', count: escort, spawnDelayMs: escortDelay },
    { type: 'husk', count: Math.floor(escort / 2), spawnDelayMs: escortDelay + 400 },
  );

  if (tier.coordinatedWaves) {
    waves.push({ type: 'ward', count: Math.ceil(escort / 3), spawnDelayMs: escortDelay + 200 });
  }

  return waves;
}

/** Inject special structure-attacking enemies based on wave, challenges, and tier. */
function injectSpecialEnemies(waves, waveNumber, challengeFx) {
  const tier = challengeFx.tier ?? {};
  const offset = tier.specialWaveOffset ?? 0;
  if (waveNumber < 6 - offset && !challengeFx.spawnSpecialEnemies) return waves;

  const mult = challengeFx.eliteSpawnMult ?? 1;
  const extra = [];

  if (waveNumber >= 6 - offset || challengeFx.spawnSpecialEnemies) {
    extra.push({ type: 'bomber', count: Math.ceil(1 * mult), spawnDelayMs: 1200 });
  }
  if (waveNumber >= 9 - offset || challengeFx.spawnSpecialEnemies) {
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

/** Inject ancient and legendary enemies at higher world tiers. */
function injectTierEnemies(waves, waveNumber, challengeFx) {
  const tier = challengeFx.tier ?? {};
  const extra = [];

  if (tier.ancientChance > 0 && waveNumber >= 8) {
    const count = Math.max(1, Math.floor((waveNumber / 10) * tier.ancientChance * 2));
    extra.push({ type: 'ancient_rime', count, spawnDelayMs: 1800 });
  }

  if (tier.legendaryChance > 0 && waveNumber >= 12 && waveNumber % 7 === 0) {
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
 * Wave composition generator.
 * @param {object} challengeFx - merged challenge + tier effects (challengeFx.tier)
 */
export function generateWave(waveNumber, challengeFx = {}) {
  const fx = mergeEffects(challengeFx);

  if (isBossWave(waveNumber)) {
    const bossWaves = generateBossWave(waveNumber, fx);
    return scaleWaveGroups(
      injectSpecialEnemies(bossWaves, waveNumber, fx),
      fx
    );
  }

  let waves = [];

  if (waveNumber === 1) {
    waves.push({ type: 'mote', count: 5, spawnDelayMs: 1000 });
  } else if (waveNumber === 2) {
    waves.push(
      { type: 'mote', count: 6, spawnDelayMs: 900 },
      { type: 'drift', count: 2, spawnDelayMs: 750 },
    );
  } else if (waveNumber <= 4) {
    waves.push(
      { type: 'mote', count: 4 + waveNumber, spawnDelayMs: 900 },
      { type: 'drift', count: waveNumber, spawnDelayMs: 700 },
    );
  } else if (waveNumber <= 8) {
    waves.push(
      { type: 'mote', count: 5 + waveNumber, spawnDelayMs: 800 },
      { type: 'drift', count: 2 + waveNumber, spawnDelayMs: 600 },
      { type: 'husk', count: Math.floor((waveNumber - 4) / 2), spawnDelayMs: 1300 },
    );
  } else if (waveNumber <= 12) {
    waves.push(
      { type: 'mote', count: 6 + waveNumber, spawnDelayMs: 700 },
      { type: 'drift', count: 3 + waveNumber, spawnDelayMs: 520 },
      { type: 'husk', count: 1 + Math.floor(waveNumber / 3), spawnDelayMs: 1050 },
      { type: 'ward', count: waveNumber >= 10 ? Math.floor((waveNumber - 9) / 2) : 0, spawnDelayMs: 1100 },
      { type: 'titan', count: waveNumber >= 11 ? 1 : 0, spawnDelayMs: 2600 },
    );
  } else if (waveNumber <= 18) {
    waves.push(
      { type: 'drift', count: 5 + waveNumber, spawnDelayMs: 480 },
      { type: 'husk', count: 2 + Math.floor(waveNumber / 2), spawnDelayMs: 900 },
      { type: 'ward', count: 2 + Math.floor(waveNumber / 4), spawnDelayMs: 950 },
      { type: 'rime', count: waveNumber >= 14 ? Math.floor((waveNumber - 12) / 2) : 0, spawnDelayMs: 1400 },
      { type: 'titan', count: 1 + Math.floor((waveNumber - 12) / 3), spawnDelayMs: 2200 },
    );
  } else {
    const scale = waveNumber - 18;
    waves.push(
      { type: 'drift', count: 14 + scale * 2, spawnDelayMs: 400 },
      { type: 'husk', count: 6 + scale, spawnDelayMs: 750 },
      { type: 'ward', count: 4 + scale, spawnDelayMs: 800 },
      { type: 'rime', count: 3 + Math.floor(scale / 2), spawnDelayMs: 1100 },
      { type: 'titan', count: 2 + Math.floor(scale / 2), spawnDelayMs: 1800 },
    );
  }

  waves = waves.filter((g) => g.count > 0);
  waves = injectSpecialEnemies(waves, waveNumber, fx);
  waves = injectTierEnemies(waves, waveNumber, fx);
  waves = applyCoordinatedSpawns(waves, fx);
  return scaleWaveGroups(waves, fx);
}

/** Scaling curve with optional challenge and world tier multipliers. */
export function getWaveScaling(waveNumber, challengeFx = {}) {
  const fx = mergeEffects(challengeFx);
  const tier = fx.tier ?? {};
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

  const armor =
    waveNumber >= 18 ? 0.22 :
    waveNumber >= 14 ? 0.15 :
    waveNumber >= 10 ? 0.1 :
    waveNumber >= 7 ? 0.05 : 0;

  const regenPerSec =
    waveNumber >= 20 ? 5 :
    waveNumber >= 16 ? 3.5 :
    waveNumber >= 12 ? 2 :
    waveNumber >= 9 ? 0.8 : 0;

  const bossFx = isBossWave(waveNumber) ? computeBossTierFx(waveNumber, fx) : {};

  return {
    healthMultiplier: healthMultiplier * bossHealthMult * (fx.enemyHealthMult ?? 1),
    speedMultiplier: speedMultiplier * (fx.enemySpeedMult ?? 1),
    goldMultiplier: (1 + (waveNumber - 1) * 0.075) * (fx.killGoldMult ?? 1),
    bossGoldMult: fx.bossGoldMult ?? 1,
    armor,
    regenPerSec,
    isBossWave: isBossWave(waveNumber),
    bossEmpowered: bossFx.bossEmpowered ?? fx.bossEmpowered ?? false,
    bossTierMechanic: bossFx.bossTierMechanic ?? null,
    bossTierModifier: bossFx.bossTierModifier ?? null,
    bossMultiPhase: bossFx.bossMultiPhase ?? false,
    tierTraitChance: tier.enemyTraitChance ?? 0,
    worldTier: tier.tier ?? 1,
    worldTierName: tier.name ?? 'Peaceful Meadows',
  };
}
