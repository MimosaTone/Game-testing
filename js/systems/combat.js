import { Projectile } from '../entities/projectile.js';

/**
 * Combat helpers — targeting and projectile creation.
 */
export class CombatSystem {
  findTarget(tower, enemies) {
    let best = null;
    let bestProgress = -1;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;

      const dist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
      if (dist > tower.stats.range) continue;

      const progress = enemy.waypointIndex + (1 - dist / tower.stats.range);
      if (progress > bestProgress) {
        bestProgress = progress;
        best = enemy;
      }
    }

    return best;
  }

  fireProjectile(tower, target, projectiles) {
    projectiles.push(
      new Projectile(
        tower.x,
        tower.y,
        target,
        tower.stats.damage,
        tower.stats.projectileSpeed,
        tower.typeDef.projectileColor,
        tower.stats.splashRadius || 0,
      ),
    );
  }

  applySplashDamage(projectile, enemies, onKill) {
    if (!projectile.splashRadius) return;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y);
      if (dist <= projectile.splashRadius) {
        const killed = enemy.takeDamage(projectile.damage * 0.6);
        if (killed) onKill(enemy);
      }
    }
  }
}
