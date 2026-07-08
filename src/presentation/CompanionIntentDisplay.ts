import Phaser from 'phaser';
import { INTENT_LABELS, type CompanionIntent } from '../command/companionIntent';
import { PALETTE } from './palette';

export class CompanionIntentDisplay {
  private label?: Phaser.GameObjects.Text;
  private calloutGfx?: Phaser.GameObjects.Graphics;
  private calloutUntil = 0;

  constructor(private scene: Phaser.Scene) {}

  update(x: number, y: number, intent: CompanionIntent, now: number): void {
    if (!this.label) {
      this.label = this.scene.add.text(x, y - 32, '', {
        fontFamily: 'serif',
        fontSize: '10px',
        color: '#d4a054',
      }).setOrigin(0.5).setDepth(12).setAlpha(0.9);
    }

    const isUrgent = intent === 'intercepting' || intent === 'returning';
    this.label.setPosition(x, y - 32);
    this.label.setText(INTENT_LABELS[intent]);
    this.label.setColor(isUrgent ? '#f0d080' : '#c9b896');

    if (this.calloutGfx && now > this.calloutUntil) {
      this.calloutGfx.destroy();
      this.calloutGfx = undefined;
    }
  }

  showCallout(fromX: number, fromY: number, toX: number, toY: number, durationMs: number, now: number): void {
    this.calloutGfx?.destroy();
    this.calloutGfx = this.scene.add.graphics().setDepth(11);
    this.calloutGfx.lineStyle(1, PALETTE.bondAmber, 0.6);
    this.calloutGfx.strokeCircle(toX, toY, 10);
    this.calloutUntil = now + durationMs;

    this.scene.tweens.add({
      targets: this.calloutGfx,
      alpha: 0,
      duration: durationMs,
      onComplete: () => {
        this.calloutGfx?.destroy();
        this.calloutGfx = undefined;
      },
    });

    void fromX;
    void fromY;
  }

  destroy(): void {
    this.label?.destroy();
    this.calloutGfx?.destroy();
  }
}
