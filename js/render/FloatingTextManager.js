/**
 * Floating gold popups for satisfying harvest feedback.
 */
export class FloatingTextManager {
  constructor() {
    this.texts = [];
  }

  add(x, y, text, color = '#f1c40f', size = 16) {
    this.texts.push({ x, y, text, color, size, life: 1.6, maxLife: 1.6 });
  }

  update(dt) {
    this.texts = this.texts.filter((t) => {
      t.life -= dt;
      t.y -= 28 * dt;
      return t.life > 0;
    });
  }

  draw(ctx) {
    for (const t of this.texts) {
      const alpha = Math.min(1, t.life / (t.maxLife * 0.6));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
