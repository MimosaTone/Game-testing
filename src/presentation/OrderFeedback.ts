import Phaser from 'phaser';
import type { OrderType } from '../command/types';
import { ORDER_COLORS, PALETTE } from './palette';

const ORDER_GLYPH: Record<OrderType, string> = {
  hold: '■',
  attack: '▶',
  defend: '◆',
  rally_point: '◎',
  focus_target: '✦',
};

export class OrderFeedback {
  constructor(private scene: Phaser.Scene) {}

  showCommandIssued(
    orderType: OrderType,
    commanderX: number,
    commanderY: number,
    companionX: number,
    companionY: number,
    cohesionState: string,
  ): void {
    const color = ORDER_COLORS[orderType] ?? PALETTE.sealBronze;
    const glyph = ORDER_GLYPH[orderType];

    const cmdText = this.scene.add.text(commanderX, commanderY - 28, glyph, {
      fontFamily: 'serif',
      fontSize: '18px',
      color: `#${color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setDepth(20);

    this.scene.tweens.add({
      targets: cmdText,
      y: commanderY - 40,
      alpha: 0,
      duration: 500,
      onComplete: () => cmdText.destroy(),
    });

    const impulse = this.scene.add.graphics().setDepth(3);
    impulse.lineStyle(3, color, 0.85);
    impulse.beginPath();
    impulse.moveTo(commanderX, commanderY);
    impulse.lineTo(companionX, companionY);
    impulse.strokePath();

    if (cohesionState === 'desynced') {
      const midX = (commanderX + companionX) / 2;
      const midY = (commanderY + companionY) / 2;
      impulse.lineStyle(2, PALETTE.bondBroken, 0.6);
      impulse.strokeCircle(midX, midY, 8);
    }

    this.scene.tweens.add({
      targets: impulse,
      alpha: 0,
      duration: cohesionState === 'desynced' ? 200 : 350,
      onComplete: () => impulse.destroy(),
    });
  }

  showCompanionAck(companionX: number, companionY: number, orderType: OrderType): void {
    const color = ORDER_COLORS[orderType] ?? PALETTE.bondAmber;
    const ring = this.scene.add.circle(companionX, companionY, 22, color, 0);
    ring.setStrokeStyle(2, color, 0.9).setDepth(8);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 280,
      onComplete: () => ring.destroy(),
    });
  }
}
