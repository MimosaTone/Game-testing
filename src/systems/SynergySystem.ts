import Phaser from 'phaser';
import { SYNERGY } from '../config';
import { Commander, Companion } from '../entities/Unit';

export class SynergySystem {
  private bondGfx?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.bondGfx = scene.add.graphics();
    this.bondGfx.setDepth(-2);
  }

  update(commander: Commander, companion: Companion): boolean {
    const inRange =
      commander.isAlive &&
      companion.isAlive &&
      Phaser.Math.Distance.Between(commander.x, commander.y, companion.x, companion.y) <=
        SYNERGY.bondRadius;

    companion.bondActive = inRange;

    if (inRange) {
      commander.damageMultiplier = 1 + SYNERGY.damageBonus;
      commander.damageReduction = SYNERGY.damageReduction;
      companion.damageMultiplier = 1 + SYNERGY.damageBonus;
      companion.damageReduction = SYNERGY.damageReduction;
      this.drawBond(commander, companion);
    } else {
      commander.damageMultiplier = 1;
      commander.damageReduction = 0;
      companion.damageMultiplier = 1;
      companion.damageReduction = 0;
      this.bondGfx?.clear();
    }

    return inRange;
  }

  private drawBond(commander: Commander, companion: Companion): void {
    if (!this.bondGfx) return;
    this.bondGfx.clear();
    this.bondGfx.lineStyle(2, 0xffd166, 0.25);
    this.bondGfx.beginPath();
    this.bondGfx.moveTo(commander.x, commander.y);
    this.bondGfx.lineTo(companion.x, companion.y);
    this.bondGfx.strokePath();

    this.bondGfx.lineStyle(1, 0x4a9eff, 0.15);
    this.bondGfx.strokeCircle(commander.x, commander.y, SYNERGY.bondRadius);
  }

  destroy(): void {
    this.bondGfx?.destroy();
  }
}
