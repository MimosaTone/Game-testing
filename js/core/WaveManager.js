import { Enemy } from '../entities/Enemy.js';
import { generateWave, getWaveScaling } from '../config/waveConfig.js';
import { Events } from './EventBus.js';

/**
 * Spawns enemies in waves with increasing difficulty.
 */
export class WaveManager {
  constructor(eventBus, path) {
    this.eventBus = eventBus;
    this.path = path;
    this.waveNumber = 0;
    this.enemies = [];
    this.spawnQueue = [];
    this.waveElapsedMs = 0;
    this.active = false;
    this.scaling = getWaveScaling(1);
  }

  get isWaveComplete() {
    return this.active && this.spawnQueue.length === 0 && this.enemies.length === 0;
  }

  startNextWave() {
    this.waveNumber++;
    this.scaling = getWaveScaling(this.waveNumber);
    this.spawnQueue = [];
    this.waveElapsedMs = 0;

    const groups = generateWave(this.waveNumber);
    let spawnAt = 0;
    let first = true;
    for (const group of groups) {
      for (let i = 0; i < group.count; i++) {
        if (!first) spawnAt += group.spawnDelayMs;
        first = false;
        this.spawnQueue.push({ type: group.type, spawnAt });
      }
    }

    this.waveElapsedMs = 0;
    this.active = true;
    this.eventBus.emit(Events.WAVE_CHANGED, this.waveNumber);
    this.eventBus.emit(Events.WAVE_STARTED, this.waveNumber);
  }

  update(dt) {
    if (!this.active) return;

    this.waveElapsedMs += dt * 1000;
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].spawnAt <= this.waveElapsedMs) {
      const next = this.spawnQueue.shift();
      this.enemies.push(new Enemy(next.type, this.path, this.scaling));
    }

    const escaped = [];
    const remaining = [];

    for (const enemy of this.enemies) {
      enemy.update(dt);
      if (enemy.reachedEnd) {
        escaped.push(enemy);
      } else if (enemy.alive) {
        remaining.push(enemy);
      }
    }

    this.enemies = remaining;

    for (const enemy of escaped) {
      this.eventBus.emit(Events.ENEMY_ESCAPED, enemy);
    }
  }

  removeEnemy(enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) this.enemies.splice(idx, 1);
  }

  reset() {
    this.waveNumber = 0;
    this.enemies = [];
    this.spawnQueue = [];
    this.waveElapsedMs = 0;
    this.active = false;
  }
}
