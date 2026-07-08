import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { PALETTE } from './palette';

/** First March — dispatch-table battlefield with pressure rings */
export class Battlefield {
  private gfx: Phaser.GameObjects.Graphics;
  private pressureGfx: Phaser.GameObjects.Graphics;
  private elapsed = 0;

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add.graphics().setDepth(-5);
    this.pressureGfx = scene.add.graphics().setDepth(-4);
    this.draw();
  }

  update(delta: number): void {
    this.elapsed += delta;
    this.drawPressure();
  }

  private draw(): void {
    this.gfx.clear();
    this.gfx.fillStyle(PALETTE.marchDust, 1);
    this.gfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Ink scoring — previous battle marks
    this.gfx.lineStyle(1, PALETTE.scoredInk, 0.35);
    for (let i = 0; i < 12; i++) {
      const x1 = Phaser.Math.Between(40, GAME_WIDTH - 40);
      const y1 = Phaser.Math.Between(40, GAME_HEIGHT - 40);
      const x2 = x1 + Phaser.Math.Between(-80, 80);
      const y2 = y1 + Phaser.Math.Between(-80, 80);
      this.gfx.beginPath();
      this.gfx.moveTo(x1, y1);
      this.gfx.lineTo(x2, y2);
      this.gfx.strokePath();
    }

    // Arena border — brass frame
    this.gfx.lineStyle(2, PALETTE.sealBronze, 0.5);
    this.gfx.strokeRect(8, 8, GAME_WIDTH - 16, GAME_HEIGHT - 16);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.gfx.lineStyle(1, PALETTE.scoredInk, 0.2);
    for (let r = 120; r <= 360; r += 120) {
      this.gfx.strokeCircle(cx, cy, r);
    }
  }

  private drawPressure(): void {
    this.pressureGfx.clear();
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const pulse = 0.08 + Math.sin(this.elapsed * 0.0008) * 0.03;
    const baseRadius = 300 - Math.min(this.elapsed * 0.008, 40);

    this.pressureGfx.lineStyle(2, PALETTE.pressureRing, pulse);
    this.pressureGfx.strokeCircle(cx, cy, baseRadius);

    // Vignette corners — pressure closing in
    const corners = [
      [0, 0], [GAME_WIDTH, 0], [0, GAME_HEIGHT], [GAME_WIDTH, GAME_HEIGHT],
    ];
    for (const [x, y] of corners) {
      this.pressureGfx.fillStyle(PALETTE.duskBlue, 0.12);
      this.pressureGfx.fillCircle(x, y, 180);
    }
  }

  destroy(): void {
    this.gfx.destroy();
    this.pressureGfx.destroy();
  }
}
