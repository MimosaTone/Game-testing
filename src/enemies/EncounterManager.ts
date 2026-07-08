import Phaser from 'phaser';
import { ENCOUNTER_CONFIG, ENCOUNTER_PHASES } from './definitions';
import { EnemyUnit, resetEnemyIdCounter } from './EnemyUnit';
import type { EnemyRole } from './types';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export interface EncounterCallbacks {
  onPhaseStart: (phaseId: string, announcement?: string) => void;
  onBossSpawned: () => void;
  onBossDefeated: () => void;
}

export class EncounterManager {
  private phaseIndex = 0;
  private timers: Phaser.Time.TimerEvent[] = [];
  private bossSpawned = false;
  private bossDefeated = false;
  private contestX = GAME_WIDTH / 2;
  private contestY = GAME_HEIGHT / 2;

  constructor(
    private scene: Phaser.Scene,
    private enemies: EnemyUnit[],
    private callbacks: EncounterCallbacks,
  ) {}

  /** Keep spawns oriented toward the live fight, not static arena center. */
  setContestPoint(x: number, y: number): void {
    this.contestX = x;
    this.contestY = y;
  }

  start(): void {
    resetEnemyIdCounter();
    for (const phase of ENCOUNTER_PHASES) {
      const timer = this.scene.time.delayedCall(phase.delayMs, () => {
        this.spawnPhase(phase.id, phase.squads, phase.spawnBoss, phase.announcement);
      });
      this.timers.push(timer);
    }
  }

  private spawnPhase(
    phaseId: string,
    squads: { role: EnemyRole; count: number }[],
    spawnBoss?: boolean,
    announcement?: string,
  ): void {
    this.phaseIndex++;
    this.callbacks.onPhaseStart(phaseId, announcement);

    let delay = 0;
    for (const squad of squads) {
      for (let i = 0; i < squad.count; i++) {
        this.scene.time.delayedCall(delay, () => {
          this.spawnEnemy(squad.role);
        });
        delay += ENCOUNTER_CONFIG.staggerSpawnMs;
      }
    }

    if (spawnBoss && !this.bossSpawned) {
      this.scene.time.delayedCall(delay + 500, () => {
        this.spawnEnemy('boss');
        this.bossSpawned = true;
        this.callbacks.onBossSpawned();
      });
    }
  }

  spawnEnemy(role: EnemyRole): EnemyUnit | null {
    const alive = this.enemies.filter((e) => e.isAlive).length;
    if (alive >= ENCOUNTER_CONFIG.maxAlive) return null;

    const pos = this.getSpawnPosition(role);
    const enemy = new EnemyUnit(this.scene, pos.x, pos.y, role);
    this.enemies.push(enemy);
    return enemy;
  }

  checkBossDefeated(): void {
    if (!this.bossSpawned || this.bossDefeated) return;
    const bossAlive = this.enemies.some((e) => e.isBoss && e.isAlive);
    if (!bossAlive) {
      this.bossDefeated = true;
      this.callbacks.onBossDefeated();
    }
  }

  private getSpawnPosition(role: EnemyRole): { x: number; y: number } {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const radius = Phaser.Math.FloatBetween(
      ENCOUNTER_CONFIG.spawnRadiusMin,
      ENCOUNTER_CONFIG.spawnRadiusMax,
    ) + (role === 'scout' ? ENCOUNTER_CONFIG.scoutSpawnRadiusBonus : 0);

    const margin = 36;
    let x = this.contestX + Math.cos(angle) * radius;
    let y = this.contestY + Math.sin(angle) * radius;

    // Nudge inward if clamping would strand units on the arena lip.
    x = Phaser.Math.Clamp(x, margin, GAME_WIDTH - margin);
    y = Phaser.Math.Clamp(y, margin, GAME_HEIGHT - margin);

    const distFromContest = Phaser.Math.Distance.Between(x, y, this.contestX, this.contestY);
    if (distFromContest > ENCOUNTER_CONFIG.spawnRadiusMax + 40) {
      const pull = Phaser.Math.Angle.Between(x, y, this.contestX, this.contestY);
      x += Math.cos(pull) * 30;
      y += Math.sin(pull) * 30;
    }

    return { x, y };
  }

  get currentPhase(): number {
    return this.phaseIndex;
  }

  get isBossActive(): boolean {
    return this.bossSpawned && !this.bossDefeated;
  }

  get bossDefeatedFlag(): boolean {
    return this.bossDefeated;
  }

  destroy(): void {
    for (const t of this.timers) t.destroy();
    this.timers = [];
  }
}
