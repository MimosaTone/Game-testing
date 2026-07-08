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

  constructor(
    private scene: Phaser.Scene,
    private enemies: EnemyUnit[],
    private callbacks: EncounterCallbacks,
  ) {}

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
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const radius = role === 'scout'
      ? ENCOUNTER_CONFIG.spawnRadius * 0.85
      : ENCOUNTER_CONFIG.spawnRadius;
    return {
      x: Phaser.Math.Clamp(centerX + Math.cos(angle) * radius, 30, GAME_WIDTH - 30),
      y: Phaser.Math.Clamp(centerY + Math.sin(angle) * radius, 30, GAME_HEIGHT - 30),
    };
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
