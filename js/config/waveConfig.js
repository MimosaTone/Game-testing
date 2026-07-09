/**
 * Wave composition generator.
 * Early waves are gentle so players can invest in economy without feeling starved.
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
      { type: 'mote', count: 5 + waveNumber, spawnDelayMs: 850 },
      { type: 'drift', count: 1 + waveNumber, spawnDelayMs: 650 },
    );
  } else if (waveNumber <= 8) {
    waves.push(
      { type: 'mote', count: 6 + waveNumber, spawnDelayMs: 800 },
      { type: 'drift', count: 2 + waveNumber, spawnDelayMs: 580 },
      { type: 'husk', count: Math.floor((waveNumber - 4) / 2), spawnDelayMs: 1300 },
    );
  } else if (waveNumber <= 14) {
    waves.push(
      { type: 'mote', count: 7 + waveNumber, spawnDelayMs: 700 },
      { type: 'drift', count: 4 + waveNumber, spawnDelayMs: 500 },
      { type: 'husk', count: 1 + Math.floor(waveNumber / 3), spawnDelayMs: 1100 },
      { type: 'titan', count: waveNumber >= 11 ? 1 : 0, spawnDelayMs: 2800 },
    );
  } else {
    const scale = waveNumber - 14;
    waves.push(
      { type: 'mote', count: 12 + scale * 2, spawnDelayMs: 600 },
      { type: 'drift', count: 8 + scale * 2, spawnDelayMs: 450 },
      { type: 'husk', count: 3 + scale, spawnDelayMs: 950 },
      { type: 'titan', count: 1 + Math.floor(scale / 3), spawnDelayMs: 2400 },
    );
  }

  return waves.filter((g) => g.count > 0);
}

/** Scaling tuned for a smooth early curve and tougher late game. */
export function getWaveScaling(waveNumber) {
  const earlyEase = waveNumber <= 4 ? 0.08 : 0.11;
  return {
    healthMultiplier: 1 + (waveNumber - 1) * earlyEase,
    speedMultiplier: 1 + (waveNumber - 1) * 0.025,
    goldMultiplier: 1 + (waveNumber - 1) * 0.06,
  };
}
