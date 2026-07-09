import { ENEMY_TYPES } from './enemyTypes.js';

/**
 * Wave composition generator.
 * Each wave entry: { type, count, spawnDelayMs }
 * Difficulty scales with wave number via health/speed multipliers in WaveManager.
 */
export function generateWave(waveNumber) {
  const waves = [];

  if (waveNumber <= 3) {
    waves.push(
      { type: 'grunt', count: 4 + waveNumber * 2, spawnDelayMs: 900 },
      { type: 'runner', count: Math.max(0, waveNumber - 1) * 2, spawnDelayMs: 700 },
    );
  } else if (waveNumber <= 7) {
    waves.push(
      { type: 'grunt', count: 6 + waveNumber, spawnDelayMs: 800 },
      { type: 'runner', count: 3 + waveNumber, spawnDelayMs: 600 },
      { type: 'tank', count: Math.floor((waveNumber - 3) / 2), spawnDelayMs: 1400 },
    );
  } else if (waveNumber <= 12) {
    waves.push(
      { type: 'grunt', count: 8 + waveNumber, spawnDelayMs: 700 },
      { type: 'runner', count: 5 + waveNumber, spawnDelayMs: 500 },
      { type: 'tank', count: 2 + Math.floor(waveNumber / 3), spawnDelayMs: 1200 },
      { type: 'boss', count: waveNumber >= 10 ? 1 : 0, spawnDelayMs: 3000 },
    );
  } else {
    const scale = waveNumber - 12;
    waves.push(
      { type: 'grunt', count: 15 + scale * 2, spawnDelayMs: 600 },
      { type: 'runner', count: 10 + scale * 2, spawnDelayMs: 450 },
      { type: 'tank', count: 4 + scale, spawnDelayMs: 1000 },
      { type: 'boss', count: 1 + Math.floor(scale / 3), spawnDelayMs: 2500 },
    );
  }

  return waves.filter((g) => g.count > 0);
}

/** Health and speed scale per wave for incremental difficulty. */
export function getWaveScaling(waveNumber) {
  return {
    healthMultiplier: 1 + (waveNumber - 1) * 0.12,
    speedMultiplier: 1 + (waveNumber - 1) * 0.03,
    goldMultiplier: 1 + (waveNumber - 1) * 0.05,
  };
}
