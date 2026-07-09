import { Enemy } from '../entities/Enemy.js';
import { generateWave, getWaveScaling, isBossWave } from '../config/waveConfig.js';
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
    this.challengeFx = {};

    this.eventBus.on(Events.BOSS_SPAWN_MINIONS, (data) => {
      this._spawnBossMinions(data);
    });
  }

  get isWaveComplete() {
    return this.active && this.spawnQueue.length === 0 && this.enemies.length === 0;
  }

  setChallengeEffects(fx) {
    this.challengeFx = fx || {};
  }

  startNextWave() {
    this.waveNumber++;
    this.scaling = getWaveScaling(this.waveNumber, this.challengeFx);
    this.spawnQueue = [];
    this.waveElapsedMs = 0;

    const groups = generateWave(this.waveNumber, this.challengeFx);
    let spawnAt = 0;
    let first = true;
    for (const group of groups) {
      for (let i = 0; i < group.count; i++) {
        if (!first) spawnAt += group.spawnDelayMs;
        first = false;
        this.spawnQueue.push({ type: group.type, spawnAt });
      }
    }

    this.active = true;
    this.eventBus.emit(Events.WAVE_CHANGED, this.waveNumber);
    this.eventBus.emit(Events.WAVE_STARTED, this.waveNumber);

    if (isBossWave(this.waveNumber)) {
      this.eventBus.emit(Events.BOSS_WAVE, this.waveNumber);
    }
  }

  update(dt) {
    if (!this.active) return;

    this.waveElapsedMs += dt * 1000;
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].spawnAt <= this.waveElapsedMs) {
      const next = this.spawnQueue.shift();
      this.enemies.push(new Enemy(next.type, this.path, this.scaling, this.eventBus));
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

  _spawnBossMinions({ boss, count, type }) {
    if (!this.active || !boss.alive) return;

    for (let i = 0; i < count; i++) {
      const minion = new Enemy(type, this.path, this.scaling, this.eventBus);
      minion.distance = Math.max(0, boss.distance - 20 - i * 15);
      const pos = this.path.getPositionAt(minion.distance);
      minion.x = pos.x;
      minion.y = pos.y;
      minion.maxHealth = Math.round(minion.maxHealth * 0.5);
      minion.health = minion.maxHealth;
      this.enemies.push(minion);
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
