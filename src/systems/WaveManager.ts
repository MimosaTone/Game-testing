import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, WAVE_CONFIG } from '../config';
import { Enemy } from '../entities/Unit';

export class WaveManager {
  private waveNumber = 0;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private waveTimer?: Phaser.Time.TimerEvent;

  constructor(
    private scene: Phaser.Scene,
    private enemies: Enemy[],
    private onWaveStart: (wave: number, count: number) => void,
  ) {}

  start(): void {
    this.scene.time.delayedCall(WAVE_CONFIG.initialDelay, () => {
      this.spawnWave();
      this.waveTimer = this.scene.time.addEvent({
        delay: WAVE_CONFIG.waveInterval,
        callback: () => this.spawnWave(),
        loop: true,
      });
    });
  }

  private spawnWave(): void {
    const aliveCount = this.enemies.filter((e) => e.isAlive).length;
    if (aliveCount >= WAVE_CONFIG.maxEnemiesAlive) return;

    this.waveNumber++;
    const count = Math.min(
      WAVE_CONFIG.baseEnemyCount + this.waveNumber * WAVE_CONFIG.enemiesPerWave,
      WAVE_CONFIG.maxEnemiesAlive - aliveCount,
    );

    this.onWaveStart(this.waveNumber, count);

    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 300, () => {
        this.spawnEnemy();
      });
    }
  }

  private spawnEnemy(): void {
    const pos = this.getSpawnPosition();
    const enemy = new Enemy(this.scene, pos.x, pos.y);
    this.enemies.push(enemy);
  }

  private getSpawnPosition(): { x: number; y: number } {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const radius = WAVE_CONFIG.spawnRadius;
    return {
      x: Phaser.Math.Clamp(centerX + Math.cos(angle) * radius, 20, GAME_WIDTH - 20),
      y: Phaser.Math.Clamp(centerY + Math.sin(angle) * radius, 20, GAME_HEIGHT - 20),
    };
  }

  get currentWave(): number {
    return this.waveNumber;
  }

  destroy(): void {
    this.spawnTimer?.destroy();
    this.waveTimer?.destroy();
  }
}
