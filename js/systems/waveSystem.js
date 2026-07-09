import { getWaveRecipe } from '../config/waveConfig.js';
import { getEnemyStats } from '../config/enemyTypes.js';
import { Enemy } from '../entities/enemy.js';

/**
 * Spawns enemies on a timer according to wave recipes.
 */
export class WaveSystem {
  constructor(pathSystem) {
    this.pathSystem = pathSystem;
    this.currentWave = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.active = false;
    this.completed = false;
  }

  startWave(waveNumber) {
    this.currentWave = waveNumber;
    this.spawnQueue = getWaveRecipe(waveNumber).map((entry, index, arr) => {
      const cumulativeDelay = arr.slice(0, index + 1).reduce((sum, e) => sum + e.delay, 0);
      return { type: entry.type, spawnAt: cumulativeDelay };
    });
    this.spawnTimer = 0;
    this.active = true;
    this.completed = false;
  }

  update(dt, enemies) {
    if (!this.active) return;

    this.spawnTimer += dt;

    while (this.spawnQueue.length > 0 && this.spawnTimer >= this.spawnQueue[0].spawnAt) {
      const entry = this.spawnQueue.shift();
      const stats = getEnemyStats(entry.type, this.currentWave);
      enemies.push(new Enemy(entry.type, stats, this.pathSystem.getWaypoints()));
    }

    if (this.spawnQueue.length === 0 && enemies.length === 0) {
      this.active = false;
      this.completed = true;
    }
  }

  isWaveActive() {
    return this.active;
  }

  isWaveComplete() {
    return this.completed;
  }

  resetCompleteFlag() {
    this.completed = false;
  }
}
