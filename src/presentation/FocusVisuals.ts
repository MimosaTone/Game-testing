import Phaser from 'phaser';
import type { EnemyUnit } from '../enemies/EnemyUnit';
import { PALETTE } from './palette';

export class FocusVisuals {
  private marks = new Map<string, Phaser.GameObjects.Graphics>();

  setMark(enemy: EnemyUnit): void {
    this.clearMark(enemy.id);
    const gfx = enemy.sprite.scene.add.graphics().setDepth(6);
    this.marks.set(enemy.id, gfx);
    this.drawMark(gfx, enemy);
  }

  update(enemies: EnemyUnit[]): void {
    for (const enemy of enemies) {
      const gfx = this.marks.get(enemy.id);
      if (gfx?.active) this.drawMark(gfx, enemy);
    }
    for (const [id] of this.marks) {
      if (!enemies.some((e) => e.id === id && e.isAlive)) {
        this.clearMark(id);
      }
    }
  }

  showKillConfirm(x: number, y: number, scene: Phaser.Scene): void {
    const burst = scene.add.graphics().setDepth(15);
    burst.lineStyle(2, PALETTE.focusGold, 1);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      burst.beginPath();
      burst.moveTo(x, y);
      burst.lineTo(x + Math.cos(a) * 20, y + Math.sin(a) * 20);
      burst.strokePath();
    }
    scene.tweens.add({ targets: burst, alpha: 0, duration: 400, onComplete: () => burst.destroy() });
  }

  clearAll(): void {
    for (const id of [...this.marks.keys()]) this.clearMark(id);
  }

  private drawMark(gfx: Phaser.GameObjects.Graphics, enemy: EnemyUnit): void {
    gfx.clear();
    const r = enemy.sprite.radius + 8;
    gfx.lineStyle(2, PALETTE.focusGold, 0.95);
    gfx.strokeCircle(enemy.x, enemy.y, r);
    gfx.lineStyle(1, PALETTE.sealBronze, 0.7);
    gfx.strokeCircle(enemy.x, enemy.y, r - 4);
    // Seal cross
    gfx.lineStyle(1, PALETTE.focusGold, 0.5);
    gfx.beginPath();
    gfx.moveTo(enemy.x - r * 0.5, enemy.y);
    gfx.lineTo(enemy.x + r * 0.5, enemy.y);
    gfx.moveTo(enemy.x, enemy.y - r * 0.5);
    gfx.lineTo(enemy.x, enemy.y + r * 0.5);
    gfx.strokePath();
  }

  private clearMark(id: string): void {
    this.marks.get(id)?.destroy();
    this.marks.delete(id);
  }
}
