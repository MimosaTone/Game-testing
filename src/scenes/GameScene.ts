import Phaser from 'phaser';
import { AbilitySystem } from '../command/AbilitySystem';
import { CompanionController } from '../command/CompanionController';
import { OrderSystem } from '../command/OrderSystem';
import type { OrderType } from '../command/types';
import { CohesionSystem } from '../cohesion/CohesionSystem';
import { updateEnemyAI } from '../enemies/EnemyAI';
import { EncounterManager } from '../enemies/EncounterManager';
import {
  EnemyUnit,
  getEnemyAtPoint,
  getNearestEnemy,
} from '../enemies/EnemyUnit';
import { COMMAND, COMMANDER, COMPANION, GAME_HEIGHT, GAME_WIDTH, SURVIVAL_DURATION_MS } from '../config';
import { getDoctrine } from '../doctrine/types';
import { clampToArena, Commander, Companion } from '../entities/Unit';
import type { RunConfig } from '../types/RunConfig';
import { Battlefield } from '../presentation/Battlefield';
import { analyzeDeath, type LeadershipContext } from '../presentation/DeathAnalysis';
import { FocusVisuals } from '../presentation/FocusVisuals';
import { OrderFeedback } from '../presentation/OrderFeedback';

export type GameState = 'playing' | 'won' | 'lost';
export type WinReason = 'survival' | 'boss_defeated';

export interface GameStateData {
  state: GameState;
  winReason: WinReason | null;
  elapsed: number;
  survivalGoal: number;
  phase: number;
  phaseAnnouncement: string | null;
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
  bossActive: boolean;
  bossHealth: number;
  bossMaxHealth: number;
  bondTension: number;
  deathHeadline: string | null;
  deathLesson: string | null;
  deathSuggestion: string | null;
}

export class GameScene extends Phaser.Scene {
  private runConfig!: RunConfig;
  private commander!: Commander;
  private companion!: Companion;
  private enemies: EnemyUnit[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private cohesion!: CohesionSystem;
  private orderSystem!: OrderSystem;
  private abilitySystem!: AbilitySystem;
  private companionController!: CompanionController;
  private encounterManager!: EncounterManager;
  private gameState: GameState = 'playing';
  private winReason: WinReason | null = null;
  private elapsed = 0;
  private enemiesKilled = 0;
  private cohesionState = 'bonded';
  private bondActive = false;
  private rallyPlacementMode = false;
  private pendingRallyPoint: { x: number; y: number } | null = null;
  private focusFireEndsAt = 0;
  private phaseAnnouncement: string | null = null;
  private announcementUntil = 0;
  private battlefield!: Battlefield;
  private orderFeedback!: OrderFeedback;
  private focusVisuals!: FocusVisuals;
  private desyncSince = 0;
  private deathHeadline: string | null = null;
  private deathLesson: string | null = null;
  private deathSuggestion: string | null = null;
  private bondTension = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(config: RunConfig): void {
    this.runConfig = config;
  }

  create(): void {
    this.battlefield = new Battlefield(this);
    this.orderFeedback = new OrderFeedback(this);
    this.focusVisuals = new FocusVisuals();
    this.resetRun();
    this.setupInput();

    this.events.on('restart-run', () => {
      this.cleanup();
      this.scene.sleep('UIScene');
      this.scene.start('SetupScene');
    });
  }

  private resetRun(): void {
    this.gameState = 'playing';
    this.winReason = null;
    this.elapsed = 0;
    this.enemiesKilled = 0;
    this.enemies = [];
    this.rallyPlacementMode = false;
    this.pendingRallyPoint = null;
    this.deathHeadline = null;
    this.deathLesson = null;
    this.deathSuggestion = null;
    this.desyncSince = 0;
    this.focusFireEndsAt = 0;
    this.phaseAnnouncement = null;
    this.focusVisuals?.clearAll();

    const startX = GAME_WIDTH / 2;
    const startY = GAME_HEIGHT / 2;

    this.commander = new Commander(this, startX, startY);
    this.companion = new Companion(this, startX + 50, startY);
    this.cohesion = new CohesionSystem(this);
    this.orderSystem = new OrderSystem();
    this.abilitySystem = new AbilitySystem(this.time.now);
    this.companionController = new CompanionController(this, this.runConfig.doctrineId);

    this.encounterManager = new EncounterManager(this, this.enemies, {
      onPhaseStart: (phaseId, announcement) => {
        this.phaseAnnouncement = announcement ?? `Phase: ${phaseId}`;
        this.announcementUntil = this.time.now + 4000;
        this.events.emit('phase-start', phaseId);
      },
      onBossSpawned: () => {
        this.phaseAnnouncement = 'Field Captain — eliminate or endure';
        this.announcementUntil = this.time.now + 5000;
      },
      onBossDefeated: () => {
        this.endGame('won', 'boss_defeated');
      },
    });
    this.encounterManager.start();
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
          this.focusVisuals.setMark(enemy);
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
      this.focusVisuals.setMark(nearest);
    }

    const issued = this.orderSystem.issue(type, now, options);
    if (!issued) return;

    this.orderFeedback.showCommandIssued(
      type,
      this.commander.x,
      this.commander.y,
      this.companion.x,
      this.companion.y,
      this.cohesionState,
    );

    const ackDelay =
      this.cohesionState === 'bonded' ? 180 :
      this.cohesionState === 'resyncing' ? 500 : 1750;
    this.time.delayedCall(ackDelay, () => {
      if (this.companion.isAlive) {
        this.orderFeedback.showCompanionAck(this.companion.x, this.companion.y, type);
      }
    });

    if (type === 'rally_point' && options?.rallyPoint) {
      this.companionController.setRallyPoint(options.rallyPoint.x, options.rallyPoint.y);
    }

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

  private getFocusEnemyId(): string | null {
    const order = this.orderSystem.getActiveOrder();
    return order?.type === 'focus_target' ? order.focusEnemyId ?? null : null;
  }

  update(_time: number, delta: number): void {
    if (this.gameState !== 'playing') return;

    const now = this.time.now;
    this.elapsed += delta;
    this.abilitySystem.update(now);

    if (this.elapsed >= SURVIVAL_DURATION_MS) {
      this.endGame('won', 'survival');
      return;
    }

    if (!this.commander.isAlive) {
      this.recordDeath();
      this.endGame('lost', null);
      return;
    }

    this.battlefield.update(delta);
    this.handleMovement();

    const cohesionData = this.cohesion.update(this.commander, this.companion, now, delta);
    this.cohesionState = cohesionData.state;
    this.bondActive = cohesionData.bondActive;
    this.bondTension = cohesionData.bondTension;

    if (cohesionData.state === 'desynced') {
      if (this.desyncSince === 0) this.desyncSince = now;
    } else {
      this.desyncSince = 0;
    }

    this.companion.updateBondRing();

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

    this.processEnemyAI(now);
    this.focusVisuals.update(this.enemies);
    this.cleanupDeadEnemies();

    for (const enemy of this.enemies) {
      if (enemy.isAlive) clampToArena(enemy);
    }
    clampToArena(this.commander);

    if (this.time.now > this.announcementUntil) {
      this.phaseAnnouncement = null;
    }

    this.events.emit('game-state-update', this.getStateData(now));
  }

  private processEnemyAI(now: number): void {
    const focusEnemyId = this.getFocusEnemyId();
    const ctx = {
      commander: this.commander,
      companion: this.companion,
      enemies: this.enemies,
      focusEnemyId,
      controlPoints: this.companionController.getBattlefieldControlPoints(),
      now,
      onBossSummon: (role: 'assassin' | 'scout', count: number) => {
        for (let i = 0; i < count; i++) {
          this.time.delayedCall(i * 400, () => {
            this.encounterManager.spawnEnemy(role);
          });
        }
      },
    };

    for (const enemy of this.enemies) {
      if (!enemy.isAlive) continue;
      updateEnemyAI(enemy, ctx);
    }
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

  private recordDeath(): void {
    const assassin = this.enemies.find((e) => e.role === 'assassin' && e.isAlive);
    const ctx: LeadershipContext = {
      cohesionState: this.cohesionState as LeadershipContext['cohesionState'],
      activeOrder: (this.orderSystem.getActiveOrder()?.type as LeadershipContext['activeOrder']) ?? null,
      bondActive: this.bondActive,
      assassinActive: !!assassin,
      assassinDashing: assassin?.assassinState === 'dashing' || assassin?.assassinState === 'telegraphing',
      supportAlive: this.enemies.some((e) => e.role === 'support' && e.isAlive),
      desyncDurationMs: this.desyncSince > 0 ? this.time.now - this.desyncSince : 0,
    };
    const msg = analyzeDeath(ctx);
    this.deathHeadline = msg.headline;
    this.deathLesson = msg.lesson;
    this.deathSuggestion = msg.suggestion;
  }

  private cleanupDeadEnemies(): void {
    const focusId = this.getFocusEnemyId();
    this.enemies = this.enemies.filter((e) => {
      if (!e.isAlive) {
        this.enemiesKilled++;
        if (focusId && e.id === focusId) {
          this.focusVisuals.showKillConfirm(e.x, e.y, this);
        }
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

  private endGame(state: 'won' | 'lost', reason: WinReason | null): void {
    this.gameState = state;
    this.winReason = reason;
    this.commander.stop();
    this.events.emit('game-state-update', this.getStateData(this.time.now));
    this.events.emit('game-over', { state, reason });
  }

  getStateData(now: number): GameStateData {
    const orderState = this.orderSystem.getState(now);
    const abilityState = this.abilitySystem.getState(now);
    const doctrine = getDoctrine(this.runConfig.doctrineId);
    const boss = this.enemies.find((e) => e.isBoss && e.isAlive);

    return {
      state: this.gameState,
      winReason: this.winReason,
      elapsed: this.elapsed,
      survivalGoal: SURVIVAL_DURATION_MS,
      phase: this.encounterManager?.currentPhase ?? 0,
      phaseAnnouncement: this.phaseAnnouncement,
      enemiesKilled: this.enemiesKilled,
      cohesionState: this.cohesionState,
      bondActive: this.bondActive,
      commanderHealth: Math.max(0, this.commander?.health ?? 0),
      commanderMaxHealth: COMMANDER.maxHealth,
      companionHealth: Math.max(0, this.companion?.health ?? 0),
      companionMaxHealth: COMPANION.maxHealth,
      doctrineName: doctrine.name,
      objectiveName: 'Command Trial',
      activeOrder: orderState.activeOrder?.type ?? null,
      commandPoints: abilityState.commandPoints,
      maxCommandPoints: abilityState.maxCommandPoints,
      cpRegenProgress: abilityState.cpRegenProgress,
      warCryActive: this.abilitySystem.hasBuff('war_cry', now),
      tacticalRallyActive: this.abilitySystem.hasBuff('tactical_rally', now),
      orderFeedback: orderState.lastFeedback,
      abilityFeedback: abilityState.lastFeedback,
      focusFireActive: this.focusFireEndsAt > now,
      bossActive: !!boss,
      bossHealth: boss?.health ?? 0,
      bossMaxHealth: boss?.maxHealth ?? 0,
      bondTension: this.bondTension,
      deathHeadline: this.deathHeadline,
      deathLesson: this.deathLesson,
      deathSuggestion: this.deathSuggestion,
    };
  }

  private cleanup(): void {
    this.battlefield?.destroy();
    this.encounterManager?.destroy();
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
