import { Enemy } from '../entities/Enemy.js';
import {
  generateWave,
  getWaveFactionMeta,
  getWaveScaling,
  isBossWave,
} from '../config/waveConfig.js';
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
    this.factionMeta = getWaveFactionMeta(1);
    this.challengeFx = {};
    this.tierFx = {};

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

  setTierEffects(fx) {
    this.tierFx = fx || {};
  }

  _getMergedFx() {
    return { ...this.challengeFx, tier: this.tierFx };
  }

  /** Preview the next wave's faction identity during planning. */
  getNextWaveFactionMeta() {
    const merged = this._getMergedFx();
    return getWaveFactionMeta(this.waveNumber + 1, merged);
  }

  startNextWave() {
    this.waveNumber++;
    const merged = this._getMergedFx();
    this.factionMeta = getWaveFactionMeta(this.waveNumber, merged);
    this.scaling = getWaveScaling(this.waveNumber, merged, this.factionMeta);
    this.spawnQueue = [];
    this.waveElapsedMs = 0;

    const { waves: groups } = generateWave(this.waveNumber, merged, this.factionMeta);
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
    this.eventBus.emit(Events.WAVE_STARTED, {
      wave: this.waveNumber,
      faction: this.factionMeta,
    });

    if (isBossWave(this.waveNumber)) {
      this.eventBus.emit(Events.BOSS_WAVE, {
        wave: this.waveNumber,
        tier: this.tierFx,
        scaling: this.scaling,
        faction: this.factionMeta,
      });
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
    this.factionMeta = getWaveFactionMeta(1);
  }
}
