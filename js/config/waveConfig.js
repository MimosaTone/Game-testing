/**
 * Wave composition generator.
 * Early waves stay gentle; late waves demand upgraded towers and strong economy.
 */
export function generateWave(waveNumber) {
  const waves = [];

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

  return waves.filter((g) => g.count > 0);
}

/**
 * Scaling curve: approachable waves 1–5, steep ramp after wave 10.
 * Late waves add armor and regeneration to force smart builds.
 */
export function getWaveScaling(waveNumber) {
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

  return {
    healthMultiplier,
    speedMultiplier,
    goldMultiplier: 1 + (waveNumber - 1) * 0.075,
    armor,
    regenPerSec,
  };
}
