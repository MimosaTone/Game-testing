/**
 * Enemy entity — follows path waypoints until reaching the end or dying.
 */
export class Enemy {
  constructor(typeDef, stats, waypoints) {
    this.typeDef = typeDef;
    this.maxHp = stats.maxHp;
    this.hp = stats.maxHp;
    this.speed = stats.speed;
    this.goldReward = stats.goldReward;
    this.size = stats.size;
    this.waypoints = waypoints;
    this.waypointIndex = 0;
    this.x = waypoints[0].x;
    this.y = waypoints[0].y;
    this.alive = true;
    this.reachedEnd = false;
  }

  update(dt) {
    if (!this.alive) return;

    const target = this.waypoints[this.waypointIndex + 1];
    if (!target) {
      this.reachedEnd = true;
      this.alive = false;
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 2) {
      this.waypointIndex += 1;
      if (this.waypointIndex >= this.waypoints.length - 1) {
        this.reachedEnd = true;
        this.alive = false;
      }
      return;
    }

    const step = this.speed * dt;
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  draw(ctx) {
    const { color, shape } = this.typeDef;
    const hpRatio = this.hp / this.maxHp;

    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = color;
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1.5;

    if (shape === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(this.size, 0);
      ctx.lineTo(0, this.size);
      ctx.lineTo(-this.size, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (shape === 'square') {
      ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
      ctx.strokeRect(-this.size, -this.size, this.size * 2, this.size * 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    const barW = this.size * 2;
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-barW / 2, -this.size - 8, barW, 4);
    ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f1c40f' : '#e74c3c';
    ctx.fillRect(-barW / 2, -this.size - 8, barW * hpRatio, 4);

    ctx.restore();
  }
}
