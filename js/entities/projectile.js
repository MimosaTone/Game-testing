/**
 * Projectile — homes toward target enemy; splashes on impact if configured.
 */
export class Projectile {
  constructor(x, y, target, damage, speed, color, splashRadius = 0) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.color = color;
    this.splashRadius = splashRadius;
    this.alive = true;
    this.radius = splashRadius > 0 ? 6 : 4;
  }

  update(dt) {
    if (!this.alive) return;
    if (!this.target || !this.target.alive) {
      this.alive = false;
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < this.speed * dt + this.target.size) {
      this.x = this.target.x;
      this.y = this.target.y;
      this.alive = false;
      return;
    }

    this.x += (dx / dist) * this.speed * dt;
    this.y += (dy / dist) * this.speed * dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
