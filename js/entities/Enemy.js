import { ENEMY_TYPES } from '../config/enemyTypes.js';
import { Events } from '../core/EventBus.js';

let nextEnemyId = 1;

const BOSS_SPAWN_THRESHOLDS = [0.8, 0.6, 0.4, 0.2];

/**
 * Enemy entity — follows path, takes damage, awards gold on death.
 * Supports armor, regeneration, slow, burn, knockback, and boss abilities.
 */
export class Enemy {
  constructor(typeId, path, scaling = {}, eventBus = null) {
    const def = ENEMY_TYPES[typeId];
    if (!def) throw new Error(`Unknown enemy type: ${typeId}`);

    const healthMult = scaling.healthMultiplier ?? 1;
    const speedMult = scaling.speedMultiplier ?? 1;
    const goldMult = scaling.goldMultiplier ?? 1;

    this.id = nextEnemyId++;
    this.typeId = typeId;
    this.definition = def;
    this.path = path;
    this.eventBus = eventBus;
    this.maxHealth = Math.round(def.baseHealth * healthMult);
    this.health = this.maxHealth;
    this.baseSpeed = def.speed * speedMult * 60;
    this.speed = this.baseSpeed;
    this.goldReward = Math.round(def.goldReward * goldMult * (def.isBoss ? 1.5 : 1));
    this.armor = Math.min(0.5, (def.innateArmor || 0) + (scaling.armor || 0));
    this.regenPerSec = (def.innateRegen || 0) + (scaling.regenPerSec || 0);
    this.distance = 0;
    this.alive = true;
    this.reachedEnd = false;
    this.slowTimer = 0;
    this.slowFactor = 1;
    this.burnDPS = 0;
    this.burnTimer = 0;
    this.burnIgnoresArmor = 0;
    this.x = path.waypoints[0].x;
    this.y = path.waypoints[0].y;

    this.bossPhaseSpawned = new Set();
    this.abilityTimer = 0;
    this.surgeActive = false;
    this.shieldActive = false;
  }

  update(dt) {
    if (!this.alive) return;

    this._updateBossAbilities(dt);

    if (this.regenPerSec > 0 && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + this.regenPerSec * dt);
    }

    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      const burnDamage = this.burnDPS * dt;
      if (burnDamage > 0) {
        const effectiveArmor = this.armor * (1 - this.burnIgnoresArmor);
        this.health -= burnDamage * (1 - effectiveArmor);
        if (this.health <= 0) {
          this.health = 0;
          this.alive = false;
        }
      }
      if (this.burnTimer <= 0) {
        this.burnDPS = 0;
        this.burnIgnoresArmor = 0;
      }
    }

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowTimer = 0;
        this.slowFactor = 1;
      }
    }

    const surgeMult = this.surgeActive ? 1.75 : 1;
    this.speed = this.baseSpeed * this.slowFactor * surgeMult;
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

  _updateBossAbilities(dt) {
    const ability = this.definition.bossAbility;
    if (!ability) return;

    this.abilityTimer += dt;

    if (ability === 'speed_surge') {
      if (this.surgeActive && this.abilityTimer >= 2.5) {
        this.surgeActive = false;
        this.abilityTimer = 0;
      } else if (!this.surgeActive && this.abilityTimer >= 5) {
        this.surgeActive = true;
        this.abilityTimer = 0;
      }
    }

    if (ability === 'damage_shield') {
      if (this.shieldActive && this.abilityTimer >= 2) {
        this.shieldActive = false;
        this.abilityTimer = 0;
      } else if (!this.shieldActive && this.abilityTimer >= 8) {
        this.shieldActive = true;
        this.abilityTimer = 0;
      }
    }
  }

  applySlow(percent, duration) {
    const newFactor = 1 - percent;
    if (newFactor < this.slowFactor) {
      this.slowFactor = newFactor;
    }
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  applyBurn(dps, duration, ignoresArmor = 0) {
    if (dps > this.burnDPS) this.burnDPS = dps;
    this.burnTimer = Math.max(this.burnTimer, duration);
    this.burnIgnoresArmor = Math.max(this.burnIgnoresArmor, ignoresArmor);
  }

  applyKnockback(distance) {
    this.distance = Math.max(0, this.distance - distance);
    const pos = this.path.getPositionAt(this.distance);
    this.x = pos.x;
    this.y = pos.y;
  }

  takeDamage(amount) {
    if (!this.alive) return false;

    if (this.shieldActive) {
      amount *= 0.15;
    }

    const healthBefore = this.health;
    const actual = amount * (1 - this.armor);
    this.health -= actual;

    if (this.definition.bossAbility === 'spawn_minions' && this.eventBus) {
      const pct = this.health / this.maxHealth;
      for (const threshold of BOSS_SPAWN_THRESHOLDS) {
        const wasAbove = healthBefore / this.maxHealth > threshold;
        const isBelow = pct <= threshold;
        if (wasAbove && isBelow && !this.bossPhaseSpawned.has(threshold)) {
          this.bossPhaseSpawned.add(threshold);
          this.eventBus.emit(Events.BOSS_SPAWN_MINIONS, {
            boss: this,
            count: 3,
            type: 'mote',
          });
        }
      }
    }

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

  get isBoss() {
    return !!this.definition.isBoss;
  }

  get isSlowed() {
    return this.slowTimer > 0;
  }

  get isBurning() {
    return this.burnTimer > 0;
  }
}
