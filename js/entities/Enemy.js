import { ENEMY_TYPES } from '../config/enemyTypes.js';

let nextEnemyId = 1;

/**
 * Enemy entity — follows path, takes damage, awards gold on death.
 */
export class Enemy {
  constructor(typeId, path, scaling = { healthMultiplier: 1, speedMultiplier: 1, goldMultiplier: 1 }) {
    const def = ENEMY_TYPES[typeId];
    if (!def) throw new Error(`Unknown enemy type: ${typeId}`);

    this.id = nextEnemyId++;
    this.typeId = typeId;
    this.definition = def;
    this.path = path;
    this.maxHealth = Math.round(def.baseHealth * scaling.healthMultiplier);
    this.health = this.maxHealth;
    this.speed = def.speed * scaling.speedMultiplier * 60;
    this.goldReward = Math.round(def.goldReward * scaling.goldMultiplier);
    this.distance = 0;
    this.alive = true;
    this.reachedEnd = false;
    this.x = path.waypoints[0].x;
    this.y = path.waypoints[0].y;
  }

  update(dt) {
    if (!this.alive) return;

    this.distance += this.speed * dt;
    if (this.distance >= this.path.totalLength) {
      this.reachedEnd = true;
      this.alive = false;
      return;
    }

    const pos = this.path.getPositionAt(this.distance);
    this.x = pos.x;
    this.y = pos.y;
  }

  takeDamage(amount) {
    if (!this.alive) return false;
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      return true;
    }
    return false;
  }

  get size() {
    return this.definition.size;
  }

  get color() {
    return this.definition.color;
  }
}
