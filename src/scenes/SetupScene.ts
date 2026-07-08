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
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2a2620);

    this.add.text(GAME_WIDTH / 2, 44, 'ARMY COMMANDER', {
      fontFamily: 'serif',
      fontSize: '32px',
      color: '#e8dcc8',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 78, 'First Playable — Version 1', {
      fontFamily: 'serif',
      fontSize: '13px',
      color: '#8a8278',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 118, 'Commander: Elite Bond', {
      fontFamily: 'serif',
      fontSize: '16px',
      color: '#d4a054',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 140, 'Companion: The Oathbound', {
      fontFamily: 'serif',
      fontSize: '12px',
      color: '#8a8278',
    }).setOrigin(0.5);

    this.add.text(120, 168, 'Choose Doctrine', {
      fontFamily: 'serif',
      fontSize: '14px',
      color: '#c9b896',
    });

    DOCTRINES.forEach((doctrine, index) => {
      const card = this.createDoctrineCard(doctrine, 120 + index * 380, 195);
      this.doctrineCards.push(card);
    });

    const objective = OBJECTIVES[0];
    this.add.rectangle(GAME_WIDTH / 2, 430, 520, 80, 0x3d3830).setStrokeStyle(1, 0x8b6914, 0.6);
    this.add.text(GAME_WIDTH / 2, 408, `Objective: ${objective.name}`, {
      fontFamily: 'serif',
      fontSize: '16px',
      color: '#e8dcc8',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 438, objective.tagline, {
      fontFamily: 'serif',
      fontSize: '12px',
      color: '#8a8278',
    }).setOrigin(0.5);

    const startBtn = this.add.text(GAME_WIDTH / 2, 520, '[ ENTER ] Begin Command Trial', {
      fontFamily: 'serif',
      fontSize: '20px',
      color: '#d4a054',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setColor('#f0d080'));
    startBtn.on('pointerout', () => startBtn.setColor('#d4a054'));
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
    const bg = this.add.rectangle(0, 0, 340, 190, 0x3d3830);
    bg.setStrokeStyle(1, 0x6b6560, 1);
    bg.setInteractive({ useHandCursor: true });

    const title = this.add.text(0, -65, doctrine.name, {
      fontFamily: 'serif',
      fontSize: '18px',
      color: '#e8dcc8',
    }).setOrigin(0.5);

    const tagline = this.add.text(0, -38, doctrine.tagline, {
      fontFamily: 'serif',
      fontSize: '11px',
      color: '#8a8278',
    }).setOrigin(0.5);

    const strength = this.add.text(-150, -5, `+ ${doctrine.strength}`, {
      fontFamily: 'serif',
      fontSize: '10px',
      color: '#d4a054',
      wordWrap: { width: 300 },
    });

    const limitation = this.add.text(-150, 45, `− ${doctrine.limitation}`, {
      fontFamily: 'serif',
      fontSize: '10px',
      color: '#8a8278',
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
      bg.setStrokeStyle(1, selected ? 0xd4a054 : 0x6b6560, selected ? 1 : 0.6);
      bg.setFillStyle(selected ? 0x4a4540 : 0x3d3830);
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
