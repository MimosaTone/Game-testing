import Phaser from 'phaser';
import { GameStateData } from './GameScene';
import { getWinMessage } from '../presentation/DeathAnalysis';
import { INTENT_LABELS, type CompanionIntent } from '../command/companionIntent';
import { GAME_WIDTH } from '../config';

export class UIScene extends Phaser.Scene {
  private companionStatus!: Phaser.GameObjects.Text;
  private bondStatus!: Phaser.GameObjects.Text;
  private orderStatus!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private announcementText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private commanderBar!: Phaser.GameObjects.Graphics;
  private companionBar!: Phaser.GameObjects.Graphics;
  private bossBar!: Phaser.GameObjects.Graphics;
  private overlayContainer!: Phaser.GameObjects.Container;
  private orderSlots: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'serif',
      fontSize: '11px',
      color: '#8a8278',
    };

    this.add.text(16, 12, 'ARMY COMMANDER', {
      fontFamily: 'serif',
      fontSize: '20px',
      color: '#e8dcc8',
    });

    this.add.text(16, 36, 'Elite Bond — Command Trial', {
      fontFamily: 'serif',
      fontSize: '12px',
      color: '#d4a054',
    });

    this.companionStatus = this.add.text(16, 64, '', {
      fontFamily: 'serif',
      fontSize: '14px',
      color: '#d4a054',
    });

    this.bondStatus = this.add.text(16, 86, '', {
      fontFamily: 'serif',
      fontSize: '12px',
      color: '#c9b896',
    });

    this.orderStatus = this.add.text(16, 108, '', labelStyle);
    this.timerText = this.add.text(16, 130, '', labelStyle);
    this.feedbackText = this.add.text(16, 152, '', {
      fontFamily: 'serif',
      fontSize: '11px',
      color: '#d4a054',
    });

    this.commanderBar = this.add.graphics();
    this.companionBar = this.add.graphics();
    this.bossBar = this.add.graphics();

    this.add.text(16, 178, 'Commander', labelStyle);
    this.add.text(16, 206, 'Oathbound', { ...labelStyle, color: '#d4a054' });

    const orders = ['1 Hold', '2 Attack', '3 Defend', '4 Rally', '5 Focus'];
    orders.forEach((label, i) => {
      const slot = this.add.text(GAME_WIDTH - 16, 520 + i * 22, label, {
        fontFamily: 'serif',
        fontSize: '11px',
        color: '#6b6560',
      }).setOrigin(1, 0);
      this.orderSlots.push(slot);
    });

    this.add.text(GAME_WIDTH - 16, 640 - 24, 'RMB Focus · Q War Cry · E Rally', {
      fontFamily: 'serif',
      fontSize: '9px',
      color: '#5a554d',
    }).setOrigin(1, 1);

    this.announcementText = this.add.text(GAME_WIDTH / 2, 56, '', {
      fontFamily: 'serif',
      fontSize: '18px',
      color: '#e8dcc8',
    }).setOrigin(0.5);

    this.overlayContainer = this.add.container(0, 0);
    this.overlayContainer.setVisible(false);

    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('game-state-update', (data: GameStateData) => this.updateHUD(data));
    gameScene.events.on('game-over', (payload: { state: 'won' | 'lost'; reason: string | null }) =>
      this.showOverlay(payload.state, payload.reason),
    );
  }

  private updateHUD(data: GameStateData): void {
    const remaining = Math.max(0, data.survivalGoal - data.elapsed);
    this.timerText.setText(`Pressure: ${Math.ceil(remaining / 1000)}s remaining`);

    const label = INTENT_LABELS[data.companionIntent as CompanionIntent] ?? 'With you';
    const moodColor =
      data.cohesionState === 'bonded' ? '#d4a054' :
      data.cohesionState === 'resyncing' ? '#c9b896' : '#8a8278';
    this.companionStatus.setText(`Oathbound: ${label}`).setColor(moodColor);

    const bondLabel =
      data.cohesionState === 'bonded'
        ? data.bondTension > 0.5 ? 'Bond fraying' : 'Bond held'
        : data.cohesionState === 'resyncing' ? 'Reconnecting' : 'Cannot reach you';
    this.bondStatus.setText(bondLabel).setColor(moodColor);

    const orderLabel = data.activeOrder
      ? data.activeOrder.replace('_', ' ').toUpperCase()
      : 'Following';
    const focusNote = data.focusFireActive ? ' · FOCUS FIRE' : '';
    this.orderStatus.setText(`Order: ${orderLabel}${focusNote}`);

    this.feedbackText.setText(data.abilityFeedback ?? data.orderFeedback ?? '');
    this.announcementText.setText(data.phaseAnnouncement ?? '');
    this.announcementText.setVisible(!!data.phaseAnnouncement);

    this.drawHealthBar(this.commanderBar, 16, 192, 140, 6, data.commanderHealth, data.commanderMaxHealth, 0x5a6b7a);
    this.drawHealthBar(this.companionBar, 16, 220, 140, 6, data.companionHealth, data.companionMaxHealth, 0x8b6914);

    if (data.bossActive) {
      this.drawHealthBar(this.bossBar, 16, 248, 140, 6, data.bossHealth, data.bossMaxHealth, 0x6a040f);
    } else {
      this.bossBar.clear();
    }

    const orderTypes = ['hold', 'attack', 'defend', 'rally_point', 'focus_target'];
    this.orderSlots.forEach((slot, i) => {
      slot.setColor(data.activeOrder === orderTypes[i] ? '#d4a054' : '#6b6560');
    });
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
    gfx.fillStyle(0x2a2620, 1);
    gfx.fillRect(x, y, w, h);
    const pct = Phaser.Math.Clamp(current / max, 0, 1);
    gfx.fillStyle(color, 1);
    gfx.fillRect(x, y, w * pct, h);
  }

  private showOverlay(state: 'won' | 'lost', reason: string | null): void {
    this.overlayContainer.removeAll(true);
    this.overlayContainer.setVisible(true);

    const gameData = (this.scene.get('GameScene') as Phaser.Scene & {
      getStateData: (n: number) => GameStateData;
    }).getStateData(0);

    const bg = this.add.rectangle(480, 320, 960, 640, 0x1a1814, 0.85);

    let headline: string;
    let lesson: string;
    let suggestion = '';

    if (state === 'won' && reason) {
      const win = getWinMessage(reason as 'boss_defeated' | 'survival');
      headline = win.headline;
      lesson = win.lesson;
    } else if (state === 'lost') {
      headline = gameData.deathHeadline ?? 'Command lost';
      lesson = gameData.deathLesson ?? 'Leadership failed under pressure.';
      suggestion = gameData.deathSuggestion ?? '';
    } else {
      headline = 'Command lost';
      lesson = 'Leadership failed under pressure.';
    }

    const title = this.add.text(480, 220, headline, {
      fontFamily: 'serif',
      fontSize: '36px',
      color: state === 'won' ? '#d4a054' : '#8a8278',
    }).setOrigin(0.5);

    const subtitle = this.add.text(480, 300, lesson, {
      fontFamily: 'serif',
      fontSize: '15px',
      color: '#c9b896',
      align: 'center',
    }).setOrigin(0.5);

    const suggest = suggestion
      ? this.add.text(480, 360, suggestion, {
          fontFamily: 'serif',
          fontSize: '13px',
          color: '#8a8278',
          align: 'center',
        }).setOrigin(0.5)
      : null;

    const restart = this.add.text(480, 420, '[ R ] Try Again', {
      fontFamily: 'serif',
      fontSize: '18px',
      color: '#d4a054',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restart.on('pointerdown', () => this.restart());
    this.input.keyboard?.once('keydown-R', () => this.restart());

    const items = [bg, title, subtitle, restart];
    if (suggest) items.push(suggest);
    this.overlayContainer.add(items);
  }

  private restart(): void {
    this.overlayContainer.setVisible(false);
    this.scene.get('GameScene').events.emit('restart-run');
  }
}
