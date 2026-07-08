import Phaser from 'phaser';
import { ORDERS, ABILITIES } from '../command/types';
import { GameStateData } from './GameScene';

export class UIScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private bondText!: Phaser.GameObjects.Text;
  private commanderBar!: Phaser.GameObjects.Graphics;
  private companionBar!: Phaser.GameObjects.Graphics;
  private overlayContainer!: Phaser.GameObjects.Container;
  private killText!: Phaser.GameObjects.Text;
  private doctrineText!: Phaser.GameObjects.Text;
  private orderText!: Phaser.GameObjects.Text;
  private cpText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#cccccc',
    };

    this.add.text(16, 12, 'ARMY COMMANDER — M2', {
      ...style,
      fontSize: '18px',
      color: '#ffffff',
    });

    this.doctrineText = this.add.text(16, 36, '', { ...style, color: '#4a9eff' });
    this.timerText = this.add.text(16, 58, '', style);
    this.waveText = this.add.text(16, 76, '', style);
    this.killText = this.add.text(16, 94, '', style);
    this.bondText = this.add.text(16, 112, '', style);
    this.orderText = this.add.text(16, 130, '', style);
    this.cpText = this.add.text(16, 148, '', style);
    this.feedbackText = this.add.text(16, 166, '', { ...style, fontSize: '11px', color: '#ffd166' });

    this.commanderBar = this.add.graphics();
    this.companionBar = this.add.graphics();

    this.add.text(16, 188, 'Commander HP', { ...style, fontSize: '11px', color: '#4a9eff' });
    this.add.text(16, 216, 'Companion HP', { ...style, fontSize: '11px', color: '#ffd166' });

    const orderLine = ORDERS.map((o) => `${o.hotkey}:${o.label[0]}`).join(' ');
    const abilityLine = ABILITIES.map((a) => `${a.hotkey}:${a.label.split(' ')[0]}`).join(' ');
    this.add.text(16, 244, `Orders ${orderLine} | ${abilityLine} | RMB:Focus`, {
      ...style,
      fontSize: '10px',
      color: '#666666',
    });

    this.overlayContainer = this.add.container(0, 0);
    this.overlayContainer.setVisible(false);

    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('game-state-update', (data: GameStateData) => this.updateHUD(data));
    gameScene.events.on('game-over', (state: 'won' | 'lost') => this.showOverlay(state));
  }

  private updateHUD(data: GameStateData): void {
    const remaining = Math.max(0, data.survivalGoal - data.elapsed);
    const seconds = Math.ceil(remaining / 1000);
    this.doctrineText.setText(`${data.doctrineName} — ${data.objectiveName}`);
    this.timerText.setText(`Survive: ${seconds}s`);
    this.waveText.setText(`Wave: ${data.wave}`);
    this.killText.setText(`Kills: ${data.enemiesKilled}`);

    const cohesionLabel =
      data.cohesionState === 'bonded' ? 'BONDED' :
      data.cohesionState === 'resyncing' ? 'RESYNCING...' : 'DESYNCED';
    const cohesionColor =
      data.cohesionState === 'bonded' ? '#ffd166' :
      data.cohesionState === 'resyncing' ? '#88ff88' : '#ff6666';
    const bonus = data.bondActive ? ' (+15% dmg, +10% DR)' : ' — orders delayed';
    this.bondText.setText(`Cohesion: ${cohesionLabel}${bonus}`).setColor(cohesionColor);

    const orderLabel = data.activeOrder ? data.activeOrder.replace('_', ' ').toUpperCase() : 'FOLLOW';
    const focusNote = data.focusFireActive ? ' [FOCUS FIRE]' : '';
    this.orderText.setText(`Order: ${orderLabel}${focusNote}`).setColor('#ffffff');

    const cpDots = '●'.repeat(data.commandPoints) + '○'.repeat(data.maxCommandPoints - data.commandPoints);
    const buffs = [
      data.warCryActive ? 'WAR CRY' : '',
      data.tacticalRallyActive ? 'RALLY' : '',
    ].filter(Boolean).join(' + ');
    this.cpText.setText(`CP: ${cpDots}${buffs ? ` | ${buffs}` : ''}`);

    const feedback = data.abilityFeedback ?? data.orderFeedback;
    this.feedbackText.setText(feedback ?? '');

    this.drawHealthBar(this.commanderBar, 16, 202, 160, 8, data.commanderHealth, data.commanderMaxHealth, 0x4a9eff);
    this.drawHealthBar(this.companionBar, 16, 230, 160, 8, data.companionHealth, data.companionMaxHealth, 0xffd166);
  }

  private drawHealthBar(
    gfx: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    current: number,
    max: number,
    color: number,
  ): void {
    gfx.clear();
    gfx.fillStyle(0x333344, 1);
    gfx.fillRect(x, y, w, h);
    const pct = Phaser.Math.Clamp(current / max, 0, 1);
    gfx.fillStyle(color, 1);
    gfx.fillRect(x, y, w * pct, h);
  }

  private showOverlay(state: 'won' | 'lost'): void {
    this.overlayContainer.removeAll(true);
    this.overlayContainer.setVisible(true);

    const bg = this.add.rectangle(480, 320, 960, 640, 0x000000, 0.7);
    const title = this.add.text(480, 250, state === 'won' ? 'VICTORY' : 'DEFEATED', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: state === 'won' ? '#4ade80' : '#e63946',
    }).setOrigin(0.5);

    const subtitle = this.add.text(
      480,
      310,
      state === 'won'
        ? 'You held the line, Commander.\nYour orders shaped the battle.'
        : 'Your commander has fallen.\nThe army is leaderless.',
      {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#cccccc',
        align: 'center',
      },
    ).setOrigin(0.5);

    const restart = this.add.text(480, 390, '[ R ] Return to Setup', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restart.on('pointerdown', () => this.restart());
    this.input.keyboard?.once('keydown-R', () => this.restart());

    this.overlayContainer.add([bg, title, subtitle, restart]);
  }

  private restart(): void {
    this.overlayContainer.setVisible(false);
    this.scene.get('GameScene').events.emit('restart-run');
  }
}
