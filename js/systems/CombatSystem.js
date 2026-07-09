import { Projectile } from '../entities/Projectile.js';
import { Events } from '../core/EventBus.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * Handles tower targeting, firing, and projectile updates.
 */
export class CombatSystem {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.projectiles = [];
    this.towers = [];
  }

  setTowers(towers) {
    this.towers = towers;
  }

  update(dt, enemies) {
    for (const tower of this.towers) {
      this._updateTower(tower, dt, enemies);
    }

    const allKilled = [];
    const remaining = [];

    for (const proj of this.projectiles) {
      const killed = proj.update(dt, enemies);
      allKilled.push(...killed);
      if (proj.alive) remaining.push(proj);
    }

    this.projectiles = remaining;

    for (const enemy of allKilled) {
      this.eventBus.emit(Events.ENEMY_KILLED, enemy);
    }
  }

  _updateTower(tower, dt, enemies) {
    tower.cooldown -= dt;

    const stats = tower.getStats();
    const pos = tower.getPixelPosition(GAME_CONFIG.tileSize);
    const rangePx = stats.range * GAME_CONFIG.tileSize;

    if (!tower.target || !tower.target.alive) {
      tower.target = this._findTarget(pos, rangePx, enemies);
    } else {
      const dist = Math.hypot(tower.target.x - pos.x, tower.target.y - pos.y);
      if (dist > rangePx) {
        tower.target = this._findTarget(pos, rangePx, enemies);
      }
    }

    if (tower.target) {
      tower.angle = Math.atan2(tower.target.y - pos.y, tower.target.x - pos.x);
    }

    if (tower.cooldown <= 0 && tower.target) {
      tower.cooldown = 1 / stats.attackSpeed;
      this.projectiles.push(
        new Projectile(tower, tower.target, stats.damage, stats.splashRadius)
      );
    }
  }

  _findTarget(pos, rangePx, enemies) {
    let best = null;
    let bestDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - pos.x, enemy.y - pos.y);
      if (dist <= rangePx && dist < bestDist) {
        bestDist = dist;
        best = enemy;
      }
    }

    return best;
  }

  reset() {
    this.projectiles = [];
    this.towers = [];
  }
}
