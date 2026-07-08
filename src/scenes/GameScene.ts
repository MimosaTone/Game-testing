import Phaser from 'phaser';
import { AbilitySystem } from '../command/AbilitySystem';
import { CompanionController } from '../command/CompanionController';
import { OrderSystem } from '../command/OrderSystem';
import type { OrderType } from '../command/types';
import { CohesionSystem } from '../cohesion/CohesionSystem';
import { COMMAND, COMMANDER, COMPANION, GAME_HEIGHT, GAME_WIDTH, SURVIVAL_DURATION_MS } from '../config';
import { getDoctrine } from '../doctrine/types';
import {
  clampToArena,
  Commander,
  Companion,
  Enemy,
  Unit,
  getEnemyAtPoint,
  getNearestEnemy,
} from '../entities/Unit';
import type { RunConfig } from '../types/RunConfig';
import { WaveManager } from '../systems/WaveManager';

export type GameState = 'playing' | 'won' | 'lost';

export interface GameStateData {
  state: GameState;
  elapsed: number;
  survivalGoal: number;
  wave: number;
  enemiesKilled: number;
  cohesionState: string;
  bondActive: boolean;
  commanderHealth: number;
  commanderMaxHealth: number;
  companionHealth: number;
  companionMaxHealth: number;
  doctrineName: string;
  objectiveName: string;
  activeOrder: string | null;
  commandPoints: number;
  maxCommandPoints: number;
  cpRegenProgress: number;
  warCryActive: boolean;
  tacticalRallyActive: boolean;
  orderFeedback: string | null;
  abilityFeedback: string | null;
  focusFireActive: boolean;
}

export class GameScene extends Phaser.Scene {
  private runConfig!: RunConfig;
  private commander!: Commander;
  private companion!: Companion;
  private enemies: Enemy[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private cohesion!: CohesionSystem;
  private orderSystem!: OrderSystem;
  private abilitySystem!: AbilitySystem;
  private companionController!: CompanionController;
  private waveManager!: WaveManager;
  private gameState: GameState = 'playing';
  private elapsed = 0;
  private enemiesKilled = 0;
  private cohesionState = 'bonded';
  private bondActive = false;
  private rallyPlacementMode = false;
  private pendingRallyPoint: { x: number; y: number } | null = null;
  private focusFireEndsAt = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(config: RunConfig): void {
    this.runConfig = config;
  }

  create(): void {
    this.drawArena();
    this.resetRun();
    this.setupInput();

    this.events.on('restart-run', () => {
      this.cleanup();
      this.scene.sleep('UIScene');
      this.scene.start('SetupScene');
    });
  }

  private drawArena(): void {
    const gfx = this.add.graphics();
    gfx.lineStyle(2, 0x2a2a3a, 1);
    gfx.strokeRect(1, 1, GAME_WIDTH - 2, GAME_HEIGHT - 2);

    gfx.fillStyle(0x1e1e2a, 0.5);
    for (let i = 0; i < 8; i++) {
      gfx.fillRect(
        Phaser.Math.Between(50, GAME_WIDTH - 50),
        Phaser.Math.Between(50, GAME_HEIGHT - 50),
        Phaser.Math.Between(30, 80),
        Phaser.Math.Between(30, 80),
      );
    }
    gfx.setDepth(-3);
  }

  private resetRun(): void {
    this.gameState = 'playing';
    this.elapsed = 0;
    this.enemiesKilled = 0;
    this.enemies = [];
    this.rallyPlacementMode = false;
    this.pendingRallyPoint = null;
    this.focusFireEndsAt = 0;

    const startX = GAME_WIDTH / 2;
    const startY = GAME_HEIGHT / 2;

    this.commander = new Commander(this, startX, startY);
    this.companion = new Companion(this, startX + 50, startY);
    this.cohesion = new CohesionSystem(this);
    this.orderSystem = new OrderSystem();
    this.abilitySystem = new AbilitySystem(this.time.now);
    this.companionController = new CompanionController(this, this.runConfig.doctrineId);

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

    const orderBindings: Array<{ key: string; order: OrderType }> = [
      { key: 'ONE', order: 'hold' },
      { key: 'TWO', order: 'attack' },
      { key: 'THREE', order: 'defend' },
      { key: 'FOUR', order: 'rally_point' },
      { key: 'FIVE', order: 'focus_target' },
    ];

    for (const { key, order } of orderBindings) {
      this.input.keyboard.on(`keydown-${key}`, () => this.issueOrder(order));
    }

    this.input.keyboard.on('keydown-Q', () => this.useAbility('war_cry'));
    this.input.keyboard.on('keydown-E', () => this.useAbility('tactical_rally'));

    this.input.mouse?.disableContextMenu();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameState !== 'playing') return;
      if (pointer.button === 2) {
        const enemy = getEnemyAtPoint(this.enemies, pointer.worldX, pointer.worldY);
        if (enemy) {
          this.issueOrder('focus_target', { focusEnemyId: enemy.id });
          this.companionController.setFocusMarker(enemy);
        }
        return;
      }

      if (this.rallyPlacementMode) {
        this.pendingRallyPoint = { x: pointer.worldX, y: pointer.worldY };
        this.issueOrder('rally_point', { rallyPoint: this.pendingRallyPoint });
        this.rallyPlacementMode = false;
      }
    });
  }

  private issueOrder(
    type: OrderType,
    options?: { rallyPoint?: { x: number; y: number }; focusEnemyId?: string },
  ): void {
    if (this.gameState !== 'playing') return;

    const now = this.time.now;
    const doctrine = getDoctrine(this.runConfig.doctrineId);
    if (!doctrine.isOrderAvailable(type)) {
      this.orderSystem.setFeedback('Order unavailable for this doctrine', now);
      return;
    }

    if (type === 'rally_point' && !options?.rallyPoint) {
      this.rallyPlacementMode = true;
      this.orderSystem.setFeedback('Click map to place rally point', now);
      return;
    }

    if (type === 'focus_target' && !options?.focusEnemyId) {
      const nearest = getNearestEnemy(this.enemies, this.companion);
      if (!nearest) {
        this.orderSystem.setFeedback('No target in range', now);
        return;
      }
      options = { focusEnemyId: nearest.id };
      this.companionController.setFocusMarker(nearest);
    }

    if (type === 'rally_point' && options?.rallyPoint) {
      this.companionController.setRallyPoint(options.rallyPoint.x, options.rallyPoint.y);
    }

    const issued = this.orderSystem.issue(type, now, options);
    if (issued && type === 'focus_target') {
      this.companionController.onFocusTargetIssued(now);
      if (this.runConfig.doctrineId === 'shock_assault') {
        this.focusFireEndsAt = now + COMMAND.shockAssault.focusFireDurationMs;
      }
    }
  }

  private useAbility(type: 'war_cry' | 'tactical_rally'): void {
    if (this.gameState !== 'playing') return;
    const now = this.time.now;
    if (this.abilitySystem.useAbility(type, now)) {
      if (type === 'tactical_rally') {
        this.orderSystem.issue('defend', now);
      }
    }
  }

  update(_time: number, delta: number): void {
    if (this.gameState !== 'playing') return;

    const now = this.time.now;
    this.elapsed += delta;
    this.abilitySystem.update(now);

    if (this.elapsed >= SURVIVAL_DURATION_MS) {
      this.endGame('won');
      return;
    }

    if (!this.commander.isAlive) {
      this.endGame('lost');
      return;
    }

    this.handleMovement();

    const cohesionData = this.cohesion.update(this.commander, this.companion, now);
    this.cohesionState = cohesionData.state;
    this.bondActive = cohesionData.bondActive;
    this.companion.updateBondRing();

    this.orderSystem.getActiveOrder();
    this.companionController.syncOrder(
      this.orderSystem.getActiveOrder(),
      now,
      cohesionData.state as 'bonded' | 'desynced' | 'resyncing',
      cohesionData.obedienceDelayMs,
    );

    this.companionController.update(
      this.companion,
      this.commander,
      this.enemies,
      this.abilitySystem,
      now,
      cohesionData.state as 'bonded' | 'desynced' | 'resyncing',
    );

    this.processCommanderCombat(now);
    this.processEnemyCombat(now);
    this.cleanupDeadEnemies();

    clampToArena(this.commander);

    this.events.emit('game-state-update', this.getStateData(now));
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

  private processCommanderCombat(now: number): void {
    this.commander.abilityDamageMultiplier = this.abilitySystem.getDamageMultiplier(now);
    const target = getNearestEnemy(this.enemies, this.commander);
    if (target) {
      this.commander.tryAttack(target, now);
    }
  }

  private processEnemyCombat(now: number): void {
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
  }

  private endGame(state: 'won' | 'lost'): void {
    this.gameState = state;
    this.commander.stop();
    this.events.emit('game-state-update', this.getStateData(this.time.now));
    this.events.emit('game-over', state);
  }

  getStateData(now: number): GameStateData {
    const orderState = this.orderSystem.getState(now);
    const abilityState = this.abilitySystem.getState(now);
    const doctrine = getDoctrine(this.runConfig.doctrineId);

    return {
      state: this.gameState,
      elapsed: this.elapsed,
      survivalGoal: SURVIVAL_DURATION_MS,
      wave: this.waveManager?.currentWave ?? 0,
      enemiesKilled: this.enemiesKilled,
      cohesionState: this.cohesionState,
      bondActive: this.bondActive,
      commanderHealth: Math.max(0, this.commander?.health ?? 0),
      commanderMaxHealth: COMMANDER.maxHealth,
      companionHealth: Math.max(0, this.companion?.health ?? 0),
      companionMaxHealth: COMPANION.maxHealth,
      doctrineName: doctrine.name,
      objectiveName: 'Survival',
      activeOrder: orderState.activeOrder?.type ?? null,
      commandPoints: abilityState.commandPoints,
      maxCommandPoints: abilityState.maxCommandPoints,
      cpRegenProgress: abilityState.cpRegenProgress,
      warCryActive: this.abilitySystem.hasBuff('war_cry', now),
      tacticalRallyActive: this.abilitySystem.hasBuff('tactical_rally', now),
      orderFeedback: orderState.lastFeedback,
      abilityFeedback: abilityState.lastFeedback,
      focusFireActive: this.focusFireEndsAt > now,
    };
  }

  private cleanup(): void {
    this.waveManager?.destroy();
    this.cohesion?.destroy();
    this.companionController?.destroy();
    this.commander?.destroy();
    this.companion?.destroy();
    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies = [];
  }
}
