import Phaser from 'phaser';
import { GameStateData } from './GameScene';

export class UIScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private bondText!: Phaser.GameObjects.Text;
  private commanderBar!: Phaser.GameObjects.Graphics;
  private companionBar!: Phaser.GameObjects.Graphics;
  private overlayContainer!: Phaser.GameObjects.Container;
  private killText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#cccccc',
    };

    this.add.text(16, 12, 'ARMY COMMANDER — M1', {
      ...style,
      fontSize: '18px',
      color: '#ffffff',
    });

    this.add.text(16, 36, 'Commander: Elite Bond', { ...style, color: '#4a9eff' });

    this.timerText = this.add.text(16, 60, '', style);
    this.waveText = this.add.text(16, 80, '', style);
    this.killText = this.add.text(16, 100, '', style);
    this.bondText = this.add.text(16, 120, '', style);

    this.commanderBar = this.add.graphics();
    this.companionBar = this.add.graphics();

    this.add.text(16, 150, 'Commander HP', { ...style, fontSize: '11px', color: '#4a9eff' });
    this.add.text(16, 178, 'Companion HP', { ...style, fontSize: '11px', color: '#ffd166' });

    this.add.text(16, 210, 'WASD — Move  |  Stay near companion for Bond', {
      ...style,
      fontSize: '11px',
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
    this.timerText.setText(`Survive: ${seconds}s`);
    this.waveText.setText(`Wave: ${data.wave}`);
    this.killText.setText(`Kills: ${data.enemiesKilled}`);

    if (data.bondActive) {
      this.bondText.setText('Bond: ACTIVE (+15% dmg, +10% DR)').setColor('#ffd166');
    } else {
      this.bondText.setText('Bond: inactive — move closer').setColor('#666666');
    }

    this.drawHealthBar(this.commanderBar, 16, 164, 160, 8, data.commanderHealth, data.commanderMaxHealth, 0x4a9eff);
    this.drawHealthBar(this.companionBar, 16, 192, 160, 8, data.companionHealth, data.companionMaxHealth, 0xffd166);
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
    const title = this.add.text(480, 260, state === 'won' ? 'VICTORY' : 'DEFEATED', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: state === 'won' ? '#4ade80' : '#e63946',
    }).setOrigin(0.5);

    const subtitle = this.add.text(
      480,
      320,
      state === 'won'
        ? 'You survived the onslaught.\nYour companion fought well, Commander.'
        : 'Your commander has fallen.\nThe army is leaderless.',
      {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#cccccc',
        align: 'center',
      },
    ).setOrigin(0.5);

    const restart = this.add.text(480, 400, '[ R ] Restart', {
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
