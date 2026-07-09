let nextProjectileId = 1;

/**
 * Visual projectile traveling from tower to enemy.
 */
export class Projectile {
  constructor(tower, target, damage, splashRadius = 0) {
    this.id = nextProjectileId++;
    this.tower = tower;
    this.target = target;
    this.targetId = target.id;
    this.damage = damage;
    this.splashRadius = splashRadius;
    this.speed = tower.definition.projectileSpeed * 60;
    this.color = tower.definition.projectileColor;
    this.alive = true;

    const pos = tower.getPixelPosition(40);
    this.x = pos.x;
    this.y = pos.y;
  }

  update(dt, enemies) {
    if (!this.alive) return [];

    const target = enemies.find((e) => e.id === this.targetId && e.alive);
    if (!target) {
      this.alive = false;
      return [];
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 8) {
      this.alive = false;
      return this._resolveHit(target, enemies);
    }

    const move = this.speed * dt;
    this.x += (dx / dist) * move;
    this.y += (dy / dist) * move;
    return [];
  }

  _resolveHit(primaryTarget, enemies) {
    const killed = [];

    if (this.splashRadius > 0) {
      const splashPx = this.splashRadius * 40;
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const d = Math.hypot(enemy.x - primaryTarget.x, enemy.y - primaryTarget.y);
        const dmg = d <= splashPx ? this.damage * (1 - d / splashPx * 0.5) : 0;
        if (dmg > 0 && enemy.takeDamage(dmg)) {
          killed.push(enemy);
        }
      }
    } else if (primaryTarget.alive && primaryTarget.takeDamage(this.damage)) {
      killed.push(primaryTarget);
    }

    return killed;
  }
}
