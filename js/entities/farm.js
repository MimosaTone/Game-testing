import { CELL_SIZE } from '../config/constants.js';
import { getFarmIncome } from '../config/farmTypes.js';

export class Farm {
  constructor(farmDef, col, row, level = 1) {
    this.category = 'farm';
    this.typeDef = farmDef;
    this.typeId = farmDef.id;
    this.col = col;
    this.row = row;
    this.level = level;
    this.x = col * CELL_SIZE + CELL_SIZE / 2;
    this.y = row * CELL_SIZE + CELL_SIZE / 2;
    this.refreshIncome();
  }

  refreshIncome() {
    this.incomePerWave = getFarmIncome(this.typeDef, this.level);
  }

  upgrade() {
    if (this.level >= this.typeDef.maxLevel) return false;
    this.level += 1;
    this.refreshIncome();
    return true;
  }

  draw(ctx, selected = false) {
    const size = 18 + this.level;

    ctx.save();
    ctx.translate(this.x, this.y);

    if (selected) {
      ctx.strokeStyle = 'rgba(241, 196, 15, 0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-size, -size, size * 2, size * 2);
    }

    ctx.fillStyle = '#8bc34a';
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 2;
    ctx.fillRect(-size, -size * 0.4, size * 2, size * 1.4);
    ctx.strokeRect(-size, -size * 0.4, size * 2, size * 1.4);

    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(-size * 0.5, -size * 0.8, 5, 0, Math.PI * 2);
    ctx.arc(size * 0.3, -size * 0.9, 4, 0, Math.PI * 2);
    ctx.arc(size * 0.7, -size * 0.5, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(this.level), 0, size * 0.3);

    ctx.restore();
  }
}
