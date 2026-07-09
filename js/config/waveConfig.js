/**
 * Wave composition — each entry spawns after a delay from the previous.
 * Extend wave recipes to introduce new enemy mixes over time.
 */
import { ENEMY_TYPES } from './enemyTypes.js';

export function getWaveRecipe(waveNumber) {
  const recipes = [];

  const gruntCount = 4 + Math.floor(waveNumber * 1.5);
  for (let i = 0; i < gruntCount; i++) {
    recipes.push({ type: ENEMY_TYPES.grunt, delay: i === 0 ? 0 : 0.8 });
  }

  if (waveNumber >= 3) {
    const runnerCount = Math.floor(waveNumber * 0.8);
    for (let i = 0; i < runnerCount; i++) {
      recipes.push({ type: ENEMY_TYPES.runner, delay: 0.6 });
    }
  }

  if (waveNumber >= 5) {
    const tankCount = Math.floor(waveNumber / 3);
    for (let i = 0; i < tankCount; i++) {
      recipes.push({ type: ENEMY_TYPES.tank, delay: 1.2 });
    }
  }

  return recipes;
}

export const TOTAL_WAVES = 20;
