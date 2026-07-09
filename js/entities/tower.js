import { CELL_SIZE } from '../config/constants.js';
import { getTowerStats } from '../config/towerTypes.js';

export class Tower {
  constructor(typeDef, col, row, level = 1) {
    this.category = 'tower';
    this.typeDef = typeDef;
    this.typeId = typeDef.id;
    this.col = col;
    this.row = row;
    this.level = level;
    this.cooldown = 0;
    this.x = col * CELL_SIZE + CELL_SIZE / 2;
    this.y = row * CELL_SIZE + CELL_SIZE / 2;
    this.refreshStats();
  }

  refreshStats() {
    this.stats = getTowerStats(this.typeDef, this.level);
  }

  upgrade() {
    if (this.level >= this.typeDef.maxLevel) return false;
    this.level += 1;
    this.refreshStats();
    return true;
  }

  update(dt, enemies, projectiles, combatSystem) {
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (this.cooldown > 0) return;

    const target = combatSystem.findTarget(this, enemies);
    if (!target) return;

    combatSystem.fireProjectile(this, target, projectiles);
    this.cooldown = 1 / this.stats.attackSpeed;
  }

  draw(ctx, selected = false) {
    const { color, shape } = this.typeDef;
    const size = 16 + this.level * 2;

    ctx.save();
    ctx.translate(this.x, this.y);

    if (selected) {
      ctx.beginPath();
      ctx.arc(0, 0, this.stats.range, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(91, 159, 212, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(91, 159, 212, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.fillStyle = color;
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;

    if (shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, size * 0.7);
      ctx.lineTo(-size, size * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (shape === 'square') {
      ctx.fillRect(-size * 0.75, -size * 0.75, size * 1.5, size * 1.5);
      ctx.strokeRect(-size * 0.75, -size * 0.75, size * 1.5, size * 1.5);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(this.level), 0, 0);

    ctx.restore();
  }
}
