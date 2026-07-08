import Phaser from 'phaser';
import { DOCTRINES, type DoctrineId } from '../doctrine/types';
import { OBJECTIVES } from '../objectives/types';
import type { RunConfig } from '../types/RunConfig';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export class SetupScene extends Phaser.Scene {
  private selectedDoctrine: DoctrineId = 'shock_assault';
  private doctrineCards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'SetupScene' });
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x12121a);

    this.add.text(GAME_WIDTH / 2, 48, 'ARMY COMMANDER', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 80, 'Standard Mode — Configure Your Run', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 120, 'Commander: Elite Bond', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#4a9eff',
    }).setOrigin(0.5);

    this.add.text(120, 155, 'Choose Doctrine', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#cccccc',
    });

    DOCTRINES.forEach((doctrine, index) => {
      const card = this.createDoctrineCard(doctrine, 120 + index * 380, 180);
      this.doctrineCards.push(card);
    });

    const survival = OBJECTIVES[0];
    this.add.rectangle(GAME_WIDTH / 2, 430, 520, 90, 0x1e1e2a).setStrokeStyle(2, 0x4a9eff, 0.5);
    this.add.text(GAME_WIDTH / 2, 405, `Objective: ${survival.name}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 435, survival.tagline, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 458, 'Survive 90s — defeat the Field Captain to win early', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#666666',
    }).setOrigin(0.5);

    const startBtn = this.add.text(GAME_WIDTH / 2, 530, '[ ENTER ] Begin Battle', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#4ade80',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setColor('#86efac'));
    startBtn.on('pointerout', () => startBtn.setColor('#4ade80'));
    startBtn.on('pointerdown', () => this.startBattle());

    this.input.keyboard?.once('keydown-ENTER', () => this.startBattle());
    this.refreshDoctrineCards();
  }

  private createDoctrineCard(
    doctrine: (typeof DOCTRINES)[number],
    x: number,
    y: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 340, 200, 0x1e1e2a);
    bg.setStrokeStyle(2, 0x444444, 1);
    bg.setInteractive({ useHandCursor: true });

    const title = this.add.text(0, -70, doctrine.name, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const tagline = this.add.text(0, -42, doctrine.tagline, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#888888',
    }).setOrigin(0.5);

    const strength = this.add.text(-150, -10, `+ ${doctrine.strength}`, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#4ade80',
      wordWrap: { width: 300 },
    });

    const limitation = this.add.text(-150, 40, `− ${doctrine.limitation}`, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#f87171',
      wordWrap: { width: 300 },
    });

    bg.on('pointerdown', () => {
      this.selectedDoctrine = doctrine.id;
      this.refreshDoctrineCards();
    });

    container.add([bg, title, tagline, strength, limitation]);
    container.setData('doctrineId', doctrine.id);
    container.setData('bg', bg);
    return container;
  }

  private refreshDoctrineCards(): void {
    for (const card of this.doctrineCards) {
      const id = card.getData('doctrineId') as DoctrineId;
      const bg = card.getData('bg') as Phaser.GameObjects.Rectangle;
      const selected = id === this.selectedDoctrine;
      bg.setStrokeStyle(2, selected ? 0x4a9eff : 0x444444, selected ? 1 : 0.6);
      bg.setFillStyle(selected ? 0x252538 : 0x1e1e2a);
    }
  }

  private startBattle(): void {
    const config: RunConfig = {
      commanderId: 'elite_bond',
      doctrineId: this.selectedDoctrine,
      objectiveId: 'survival',
      gameMode: 'standard',
    };

    this.scene.start('GameScene', config);
    this.scene.wake('UIScene');
  }
}
