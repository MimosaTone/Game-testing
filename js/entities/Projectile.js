import { GAME_CONFIG } from '../config/gameConfig.js';

let nextProjectileId = 1;

/**
 * Projectile with support for splash, pierce, chain, and slow effects.
 */
export class Projectile {
  constructor(tower, target, combatStats, combatSystem = null) {
    this.id = nextProjectileId++;
    this.tower = tower;
    this.target = target;
    this.targetId = target.id;
    this.damage = combatStats.damage;
    this.splashRadius = combatStats.splashRadius || 0;
    this.splashFalloff = combatStats.splashFalloff ?? 0.5;
    this.pierceRemaining = combatStats.pierce || 0;
    this.chainCount = combatStats.chainCount || 0;
    this.chainDamageMult = combatStats.chainDamageMult || 0.6;
    this.chainRange = combatStats.chainRange || 80;
    this.slowPercent = combatStats.slowPercent || 0;
    this.slowDuration = combatStats.slowDuration || 0;
    this.burnDPS = combatStats.burnDPS || 0;
    this.burnDuration = combatStats.burnDuration || 0;
    this.burnIgnoresArmor = combatStats.burnIgnoresArmor || 0;
    this.burnSpread = combatStats.burnSpread || 0;
    this.burnSpreadCount = combatStats.burnSpreadCount || 0;
    this.hitIds = new Set();
    const speedMult = combatStats.projectileSpeedMult || 1;
    this.speed = tower.definition.projectileSpeed * 60 * speedMult;
    this.critChance = combatStats.critChance || 0;
    this.critDamageMult = combatStats.critDamageMult || 1.5;
    this.armorPen = combatStats.armorPen || 0;
    this.groundBurn = combatStats.groundBurn || false;
    this.combatSystem = combatSystem;
    this.color = tower.definition.projectileColor;
    this.alive = true;

    const pos = tower.getPixelPosition(GAME_CONFIG.tileSize);
    this.x = pos.x;
    this.y = pos.y;
    this.vx = 0;
    this.vy = 0;
  }

  update(dt, enemies) {
    if (!this.alive) return [];

    let target = enemies.find((e) => e.id === this.targetId && e.alive && !this.hitIds.has(e.id));

    if (!target && this.pierceRemaining > 0) {
      target = this._findNextPierceTarget(enemies);
      if (target) this.targetId = target.id;
    }

    if (!target) {
      this.alive = false;
      return [];
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 10) {
      return this._resolveHit(target, enemies);
    }

    const move = this.speed * dt;
    this.vx = dx / dist;
    this.vy = dy / dist;
    this.x += this.vx * move;
    this.y += this.vy * move;
    return [];
  }

  _findNextPierceTarget(enemies) {
    let best = null;
    let bestDot = -Infinity;

    for (const enemy of enemies) {
      if (!enemy.alive || this.hitIds.has(enemy.id)) continue;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 120) continue;
      const dot = (dx * this.vx + dy * this.vy) / (dist || 1);
      if (dot > 0.5 && dot > bestDot) {
        bestDot = dot;
        best = enemy;
      }
    }

    return best;
  }

  _resolveHit(primaryTarget, enemies) {
    const killed = [];
    const hitEnemies = [primaryTarget];

    this.hitIds.add(primaryTarget.id);

    if (this.splashRadius > 0) {
      const splashPx = this.splashRadius * GAME_CONFIG.tileSize;
      for (const enemy of enemies) {
        if (!enemy.alive || enemy.id === primaryTarget.id) continue;
        const d = Math.hypot(enemy.x - primaryTarget.x, enemy.y - primaryTarget.y);
        if (d <= splashPx) hitEnemies.push(enemy);
      }
    }

    if (this.chainCount > 0) {
      const chained = this._findChainTargets(primaryTarget, enemies, this.chainCount);
      hitEnemies.push(...chained);
    }

    const unique = [...new Map(hitEnemies.map((e) => [e.id, e])).values()];

    for (const enemy of unique) {
      let dmg = this.damage;
      if (enemy.id !== primaryTarget.id) {
        if (this.chainCount > 0) {
          dmg *= this.chainDamageMult;
        } else if (this.splashRadius > 0) {
          const d = Math.hypot(enemy.x - primaryTarget.x, enemy.y - primaryTarget.y);
          const splashPx = this.splashRadius * GAME_CONFIG.tileSize;
          const falloff = 1 - (d / splashPx) * this.splashFalloff;
          dmg *= Math.max(0.15, falloff);
        }
      }

      dmg *= this._rollCrit();

      if (enemy.isBoss && this.tower.getStats().bossDamageMult) {
        dmg *= this.tower.getStats().bossDamageMult;
      } else if (this._isElite(enemy) && this.tower.getStats().eliteDamageMult) {
        dmg *= this.tower.getStats().eliteDamageMult;
      }

      if (this.slowPercent > 0) {
        enemy.applySlow(this.slowPercent, this.slowDuration);
      }

      if (this.burnDPS > 0) {
        enemy.applyBurn(this.burnDPS, this.burnDuration, this.burnIgnoresArmor);
      }

      if (enemy.alive && enemy.takeDamage(dmg, this.armorPen)) {
        killed.push(enemy);
      }
    }

    if (this.burnSpread > 0 && this.burnDPS > 0) {
      const spreadTargets = this._findChainTargets(primaryTarget, enemies, this.burnSpreadCount);
      for (const enemy of spreadTargets) {
        enemy.applyBurn(this.burnDPS * 0.7, this.burnDuration, this.burnIgnoresArmor);
      }
    }

    if (this.groundBurn && this.combatSystem) {
      const splashTiles = this.splashRadius > 0 ? this.splashRadius : 1.2;
      this.combatSystem.addGroundBurn(
        primaryTarget.x,
        primaryTarget.y,
        splashTiles,
        this.burnDPS || this.damage * 0.15,
        this.burnDuration || 4
      );
    }

    if (this.pierceRemaining > 0) {
      this.pierceRemaining--;
      const next = this._findNextPierceTarget(enemies);
      if (next) {
        this.targetId = next.id;
        return killed;
      }
    }

    this.alive = false;
    return killed;
  }

  _rollCrit() {
    if (this.critChance <= 0) return 1;
    if (Math.random() < this.critChance) return this.critDamageMult;
    return 1;
  }

  _isElite(enemy) {
    return !enemy.isBoss && ['husk', 'drift', 'ward', 'rime', 'titan'].includes(enemy.typeId);
  }

  _findChainTargets(origin, enemies, count) {
    const candidates = enemies
      .filter((e) => e.alive && e.id !== origin.id)
      .map((e) => ({
        enemy: e,
        dist: Math.hypot(e.x - origin.x, e.y - origin.y),
      }))
      .filter((c) => c.dist <= this.chainRange)
      .sort((a, b) => a.dist - b.dist);

    return candidates.slice(0, count).map((c) => c.enemy);
  }
}
