import { Projectile } from '../entities/Projectile.js';
import { Events } from '../core/EventBus.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { MASTERY_CONFIG } from '../config/towerMasteryConfig.js';

/**
 * Handles tower targeting, firing, aura effects, and projectile updates.
 */
export class CombatSystem {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.projectiles = [];
    this.towers = [];
    this.groundBurns = [];
  }

  setTowers(towers) {
    this.towers = towers.filter((t) => !t.destroyed);
  }

  update(dt, enemies) {
    this._updateGroundBurns(dt, enemies);
    this._updateAuras(dt, enemies);

    for (const tower of this.towers) {
      this._updateTower(tower, dt, enemies);
    }

    const killEvents = [];
    const remaining = [];

    for (const proj of this.projectiles) {
      const killed = proj.update(dt, enemies);
      for (const enemy of killed) {
        killEvents.push({ enemy, killerTower: proj.tower });
      }
      if (proj.alive) remaining.push(proj);
    }

    this.projectiles = remaining;

    for (const { enemy, killerTower } of killEvents) {
      this.eventBus.emit(Events.ENEMY_KILLED, { enemy, killerTower });
    }
  }

  _updateAuras(dt, enemies) {
    for (const tower of this.towers) {
      const stats = tower.getStats();
      if (stats.auraSlow <= 0 && stats.knockbackPulse <= 0 && stats.frostPulseSlow <= 0) continue;

      tower.knockbackCooldown = (tower.knockbackCooldown || 0) - dt;
      tower.frostPulseCooldown = (tower.frostPulseCooldown || 0) - dt;
      const pos = tower.getPixelPosition(GAME_CONFIG.tileSize);
      const rangePx = stats.range * GAME_CONFIG.tileSize;
      let knocked = false;
      let pulsed = false;

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dist = Math.hypot(enemy.x - pos.x, enemy.y - pos.y);
        if (dist > rangePx) continue;

        if (stats.auraSlow > 0) {
          enemy.applySlow(stats.auraSlow, 0.6);
        }

        if (stats.knockbackPulse > 0 && tower.knockbackCooldown <= 0) {
          enemy.applyKnockback(stats.knockbackPulse);
          knocked = true;
        }
      }

      if (
        stats.frostPulseSlow > 0
        && stats.frostPulseInterval > 0
        && tower.frostPulseCooldown <= 0
      ) {
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const dist = Math.hypot(enemy.x - pos.x, enemy.y - pos.y);
          if (dist > rangePx) continue;

          let slowAmt = stats.frostPulseSlow;
          let dur = stats.frostPulseDuration || 2.5;
          if (enemy.isBoss) {
            slowAmt *= 0.45;
            dur *= 0.5;
          } else if (this._isEliteEnemy(enemy)) {
            slowAmt *= 0.65;
            dur *= 0.7;
          }
          enemy.applySlow(slowAmt, dur);
          pulsed = true;
        }
      }

      if (knocked && stats.knockbackInterval > 0) {
        tower.knockbackCooldown = stats.knockbackInterval;
      }
      if (pulsed && stats.frostPulseInterval > 0) {
        tower.frostPulseCooldown = stats.frostPulseInterval;
      }
    }
  }

  _isEliteEnemy(enemy) {
    if (enemy.isLegendary || enemy.isAncient) return true;
    return !enemy.isBoss && ['husk', 'drift', 'ward', 'rime', 'titan', 'ancient_rime', 'legendary_titan'].includes(enemy.typeId);
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
      tower.shotsFired = (tower.shotsFired || 0) + 1;

      const count = stats.projectileCount || 1;
      for (let i = 0; i < count; i++) {
        this.projectiles.push(new Projectile(tower, tower.target, stats, this));
      }

      if (stats.bonusShotInterval && tower.shotsFired % stats.bonusShotInterval === 0) {
        this.projectiles.push(new Projectile(tower, tower.target, stats, this));
      }
    }
  }

  _findTarget(pos, rangePx, enemies) {
    let best = null;
    let bestScore = -Infinity;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - pos.x, enemy.y - pos.y);
      if (dist > rangePx) continue;

      let score = -dist;
      if (enemy.isBoss) score += 200;
      if (enemy.regenPerSec > 0) score += 40;
      if (enemy.typeId === 'drift' || enemy.typeId === 'rime') score += 20;
      if (enemy.health / enemy.maxHealth < 0.35) score += 30;

      if (score > bestScore) {
        bestScore = score;
        best = enemy;
      }
    }

    return best;
  }

  awardWaveSurvivalXP(challengeMult = 1) {
    for (const tower of this.towers) {
      if (tower.destroyed) continue;
      const xp = Math.round(MASTERY_CONFIG.xpPerWaveSurvived * challengeMult);
      const result = tower.awardMasteryXP(xp);
      if (result.newLevel > result.prevLevel || result.unlockedMaster) {
        this.eventBus.emit(Events.MASTERY_GAINED, { tower, ...result });
      }
    }
  }

  reset() {
    this.projectiles = [];
    this.towers = [];
    this.groundBurns = [];
  }

  addGroundBurn(x, y, radiusTiles, dps, duration) {
    if (!dps || !duration || radiusTiles <= 0) return;
    this.groundBurns.push({
      x,
      y,
      radiusPx: radiusTiles * GAME_CONFIG.tileSize,
      dps,
      timeLeft: duration,
    });
  }

  _updateGroundBurns(dt, enemies) {
    const remaining = [];
    for (const zone of this.groundBurns) {
      zone.timeLeft -= dt;
      if (zone.timeLeft <= 0) continue;
      remaining.push(zone);
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dist = Math.hypot(enemy.x - zone.x, enemy.y - zone.y);
        if (dist <= zone.radiusPx) {
          enemy.applyBurn(zone.dps, 0.35, 1);
        }
      }
    }
    this.groundBurns = remaining;
  }
}
