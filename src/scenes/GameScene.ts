import Phaser from 'phaser';
import { COMMANDER, COMPANION, GAME_HEIGHT, GAME_WIDTH, SURVIVAL_DURATION_MS } from '../config';
import {
  clampToArena,
  Commander,
  Companion,
  Enemy,
  getNearestEnemy,
  Unit,
} from '../entities/Unit';
import { SynergySystem } from '../systems/SynergySystem';
import { WaveManager } from '../systems/WaveManager';

export type GameState = 'playing' | 'won' | 'lost';

export interface GameStateData {
  state: GameState;
  elapsed: number;
  survivalGoal: number;
  wave: number;
  enemiesKilled: number;
  bondActive: boolean;
  commanderHealth: number;
  commanderMaxHealth: number;
  companionHealth: number;
  companionMaxHealth: number;
}

export class GameScene extends Phaser.Scene {
  private commander!: Commander;
  private companion!: Companion;
  private enemies: Enemy[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private synergy!: SynergySystem;
  private waveManager!: WaveManager;
  private gameState: GameState = 'playing';
  private elapsed = 0;
  private enemiesKilled = 0;
  private bondActive = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.drawArena();
    this.resetRun();
    this.setupInput();

    this.events.on('restart-run', () => {
      this.cleanup();
      this.resetRun();
    });
  }

  private drawArena(): void {
    const gfx = this.add.graphics();
    gfx.lineStyle(2, 0x2a2a3a, 1);
    gfx.strokeRect(1, 1, GAME_WIDTH - 2, GAME_HEIGHT - 2);

    gfx.fillStyle(0x1e1e2a, 0.5);
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = Phaser.Math.Between(50, GAME_HEIGHT - 50);
      const w = Phaser.Math.Between(30, 80);
      const h = Phaser.Math.Between(30, 80);
      gfx.fillRect(x, y, w, h);
    }
    gfx.setDepth(-3);
  }

  private resetRun(): void {
    this.gameState = 'playing';
    this.elapsed = 0;
    this.enemiesKilled = 0;
    this.bondActive = false;
    this.enemies = [];

    const startX = GAME_WIDTH / 2;
    const startY = GAME_HEIGHT / 2;

    this.commander = new Commander(this, startX, startY);
    this.companion = new Companion(this, startX + 50, startY);
    this.synergy = new SynergySystem(this);

    this.waveManager = new WaveManager(this, this.enemies, (wave) => {
      this.events.emit('wave-start', wave);
    });
    this.waveManager.start();
  }

  private setupInput(): void {
    if (!this.input.keyboard) return;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    this.input.keyboard.on('keydown-R', () => {
      if (this.gameState !== 'playing') {
        this.cleanup();
        this.resetRun();
      }
    });
  }

  update(_time: number, delta: number): void {
    if (this.gameState !== 'playing') return;

    this.elapsed += delta;
    if (this.elapsed >= SURVIVAL_DURATION_MS) {
      this.endGame('won');
      return;
    }

    if (!this.commander.isAlive) {
      this.endGame('lost');
      return;
    }

    this.handleMovement();
    this.bondActive = this.synergy.update(this.commander, this.companion);
    this.companion.updateFollow(this.commander, delta);
    this.processCombat();
    this.cleanupDeadEnemies();

    clampToArena(this.commander);
    clampToArena(this.companion);

    this.events.emit('game-state-update', this.getStateData());
  }

  private handleMovement(): void {
    const velocity = new Phaser.Math.Vector2(0, 0);
    if (this.cursors.left.isDown || this.wasd.A.isDown) velocity.x -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) velocity.x += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) velocity.y -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) velocity.y += 1;

    if (velocity.length() > 0) {
      this.commander.move(velocity);
    } else {
      this.commander.stop();
    }
  }

  private processCombat(): void {
    const now = this.time.now;

    const companionTarget = getNearestEnemy(this.enemies, this.companion);
    if (companionTarget) {
      this.companion.tryAttack(companionTarget, now);
    }

    const commanderTarget = getNearestEnemy(this.enemies, this.commander);
    if (commanderTarget) {
      this.commander.tryAttack(commanderTarget, now);
    }

    for (const enemy of this.enemies) {
      if (!enemy.isAlive) continue;

      const target = this.pickEnemyTarget(enemy);
      if (!target) continue;

      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
      if (dist <= enemy.attackRange) {
        enemy.stop();
        enemy.tryAttack(target, now);
      } else {
        enemy.chaseTarget(target);
      }
    }
  }

  private pickEnemyTarget(enemy: Enemy): Unit | null {
    const targets: Unit[] = [];
    if (this.commander.isAlive) targets.push(this.commander);
    if (this.companion.isAlive) targets.push(this.companion);
    if (targets.length === 0) return null;

    let nearest: Unit = targets[0];
    let minDist = Infinity;
    for (const target of targets) {
      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = target;
      }
    }
    return nearest;
  }

  private cleanupDeadEnemies(): void {
    const before = this.enemies.length;
    this.enemies = this.enemies.filter((e) => {
      if (!e.isAlive) {
        this.enemiesKilled++;
        this.tweens.add({
          targets: e.sprite,
          alpha: 0,
          scale: 0.5,
          duration: 300,
          onComplete: () => e.destroy(),
        });
        return false;
      }
      return true;
    });
    void before;
  }

  private endGame(state: 'won' | 'lost'): void {
    this.gameState = state;
    this.commander.stop();
    this.events.emit('game-state-update', this.getStateData());
    this.events.emit('game-over', state);
  }

  getStateData(): GameStateData {
    return {
      state: this.gameState,
      elapsed: this.elapsed,
      survivalGoal: SURVIVAL_DURATION_MS,
      wave: this.waveManager?.currentWave ?? 0,
      enemiesKilled: this.enemiesKilled,
      bondActive: this.bondActive,
      commanderHealth: Math.max(0, this.commander?.health ?? 0),
      commanderMaxHealth: COMMANDER.maxHealth,
      companionHealth: Math.max(0, this.companion?.health ?? 0),
      companionMaxHealth: COMPANION.maxHealth,
    };
  }

  private cleanup(): void {
    this.waveManager?.destroy();
    this.synergy?.destroy();
    this.commander?.destroy();
    this.companion?.destroy();
    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies = [];
  }
}
