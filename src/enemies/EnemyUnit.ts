import Phaser from 'phaser';
import { ENEMY_ROLES } from './definitions';
import type { EnemyRole } from './types';
import { Unit } from '../entities/Unit';

let nextEnemyId = 0;

export function resetEnemyIdCounter(): void {
  nextEnemyId = 0;
}

export class EnemyUnit extends Unit {
  readonly id: string;
  readonly role: EnemyRole;
  readonly roleLabel: string;
  readonly baseSpeed: number;
  speedMultiplier = 1;
  isBoss = false;
  /** Boss phase state */
  bossPhase: 1 | 2 | 3 = 1;
  lastSupportActionAt = 0;
  lastBossSummonAt = 0;
  lastBossChargeAt = 0;
  /** Assassin state machine */
  assassinState: 'stalking' | 'dashing' | 'escaping' = 'stalking';
  assassinEscapeUntil = 0;
  private labelText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, role: EnemyRole) {
    const def = ENEMY_ROLES[role];
    super(scene, x, y, def.radius, def.color, def);
    this.id = `enemy-${nextEnemyId++}`;
    this.role = role;
    this.roleLabel = def.label;
    this.baseSpeed = def.speed;
    this.isBoss = role === 'boss';

    if (role === 'boss') {
      this.sprite.setStrokeStyle(3, 0xffffff, 0.8);
    }

    this.labelText = scene.add.text(x, y - def.radius - 10, def.label, {
      fontFamily: 'monospace',
      fontSize: role === 'boss' ? '11px' : '8px',
      color: '#cccccc',
    }).setOrigin(0.5).setDepth(10);
  }

  get effectiveSpeed(): number {
    return this.baseSpeed * this.speedMultiplier;
  }

  get forcesDecision(): string {
    return ENEMY_ROLES[this.role].forcesDecision;
  }

  protected getColor(): number {
    return ENEMY_ROLES[this.role].color;
  }

  updateLabelPosition(): void {
    if (this.labelText && this.isAlive) {
      this.labelText.setPosition(this.x, this.y - this.sprite.radius - 10);
    }
  }

  applyKnockback(fromX: number, fromY: number, force: number): void {
    const angle = Phaser.Math.Angle.Between(fromX, fromY, this.x, this.y);
    this.body.setVelocity(Math.cos(angle) * force, Math.sin(angle) * force);
  }

  updateBossPhase(): void {
    if (!this.isBoss) return;
    const pct = this.health / this.maxHealth;
    if (pct <= 0.4) this.bossPhase = 3;
    else if (pct <= 0.7) this.bossPhase = 2;
    else this.bossPhase = 1;
  }

  destroy(): void {
    this.labelText?.destroy();
    super.destroy();
  }
}

export function getAliveEnemies(enemies: EnemyUnit[]): EnemyUnit[] {
  return enemies.filter((e) => e.isAlive);
}

export function getEnemiesByRole(enemies: EnemyUnit[], role: EnemyRole): EnemyUnit[] {
  return enemies.filter((e) => e.isAlive && e.role === role);
}

export function getFrontlineAnchor(enemies: EnemyUnit[]): { x: number; y: number } | null {
  const tanks = getEnemiesByRole(enemies, 'bruiser');
  if (tanks.length === 0) {
    const ranged = [
      ...getEnemiesByRole(enemies, 'archer'),
      ...getEnemiesByRole(enemies, 'support'),
      ...getEnemiesByRole(enemies, 'siege'),
    ];
    if (ranged.length === 0) return null;
    let x = 0;
    let y = 0;
    for (const e of ranged) {
      x += e.x;
      y += e.y;
    }
    return { x: x / ranged.length, y: y / ranged.length };
  }
  let x = 0;
  let y = 0;
  for (const e of tanks) {
    x += e.x;
    y += e.y;
  }
  return { x: x / tanks.length, y: y / tanks.length };
}

export function countAlliesNear(
  enemy: EnemyUnit,
  enemies: EnemyUnit[],
  radius: number,
): number {
  let count = 0;
  for (const ally of getAliveEnemies(enemies)) {
    if (ally.id === enemy.id) continue;
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, ally.x, ally.y);
    if (dist <= radius) count++;
  }
  return count;
}

export function getNearestEnemy(enemies: EnemyUnit[], from: Unit): EnemyUnit | null {
  let nearest: EnemyUnit | null = null;
  let minDist = Infinity;
  for (const enemy of enemies) {
    if (!enemy.isAlive) continue;
    const dist = Phaser.Math.Distance.Between(from.x, from.y, enemy.x, enemy.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }
  return nearest;
}

export function getNearestEnemyToPoint(
  enemies: EnemyUnit[],
  x: number,
  y: number,
): EnemyUnit | null {
  let nearest: EnemyUnit | null = null;
  let minDist = Infinity;
  for (const enemy of enemies) {
    if (!enemy.isAlive) continue;
    const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }
  return nearest;
}

export function getEnemyAtPoint(
  enemies: EnemyUnit[],
  x: number,
  y: number,
  maxDist = 24,
): EnemyUnit | null {
  let nearest: EnemyUnit | null = null;
  let minDist = maxDist;
  for (const enemy of enemies) {
    if (!enemy.isAlive) continue;
    const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }
  return nearest;
}
