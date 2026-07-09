import { ENEMY_TYPES } from '../config/enemyTypes.js';

let nextEnemyId = 1;

/**
 * Enemy entity — follows path, takes damage, awards gold on death.
 * Supports armor, regeneration, and slow debuffs for late-game scaling.
 */
export class Enemy {
  constructor(typeId, path, scaling = {}) {
    const def = ENEMY_TYPES[typeId];
    if (!def) throw new Error(`Unknown enemy type: ${typeId}`);

    const healthMult = scaling.healthMultiplier ?? 1;
    const speedMult = scaling.speedMultiplier ?? 1;
    const goldMult = scaling.goldMultiplier ?? 1;

    this.id = nextEnemyId++;
    this.typeId = typeId;
    this.definition = def;
    this.path = path;
    this.maxHealth = Math.round(def.baseHealth * healthMult);
    this.health = this.maxHealth;
    this.baseSpeed = def.speed * speedMult * 60;
    this.speed = this.baseSpeed;
    this.goldReward = Math.round(def.goldReward * goldMult);
    this.armor = Math.min(0.5, (def.innateArmor || 0) + (scaling.armor || 0));
    this.regenPerSec = (def.innateRegen || 0) + (scaling.regenPerSec || 0);
    this.distance = 0;
    this.alive = true;
    this.reachedEnd = false;
    this.slowTimer = 0;
    this.slowFactor = 1;
    this.x = path.waypoints[0].x;
    this.y = path.waypoints[0].y;
  }

  update(dt) {
    if (!this.alive) return;

    if (this.regenPerSec > 0 && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + this.regenPerSec * dt);
    }

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowTimer = 0;
        this.slowFactor = 1;
      }
    }

    this.speed = this.baseSpeed * this.slowFactor;
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

  applySlow(percent, duration) {
    if (percent > 1 - this.slowFactor) {
      this.slowFactor = 1 - percent;
      this.slowTimer = Math.max(this.slowTimer, duration);
    }
  }

  takeDamage(amount) {
    if (!this.alive) return false;
    const actual = amount * (1 - this.armor);
    this.health -= actual;
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

  get isSlowed() {
    return this.slowTimer > 0;
  }
}
