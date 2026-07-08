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
  assassinState: 'stalking' | 'telegraphing' | 'dashing' | 'escaping' = 'stalking';
  assassinEscapeUntil = 0;
  assassinTelegraphUntil = 0;
  private labelText?: Phaser.GameObjects.Text;
  private telegraphGfx?: Phaser.GameObjects.Graphics;
  private roleMarkGfx?: Phaser.GameObjects.Graphics;

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
    if (role === 'assassin') {
      this.sprite.setStrokeStyle(2, 0x5c3a6e, 0.9);
    }

    this.roleMarkGfx = scene.add.graphics().setDepth(5);
    this.drawRoleMark();

    if (role === 'assassin') {
      this.showAssassinEntrance();
    }

    this.labelText = scene.add.text(x, y - def.radius - 10, def.label, {
      fontFamily: 'serif',
      fontSize: role === 'boss' ? '10px' : '7px',
      color: role === 'assassin' ? '#9d7bb8' : '#8a8278',
    }).setOrigin(0.5).setDepth(10).setAlpha(0.85);
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

  protected redrawSigil(): void {
    // Enemy identity uses roleMarkGfx in updateLabelPosition
  }

  updateLabelPosition(): void {
    if (this.labelText && this.isAlive) {
      this.labelText.setPosition(this.x, this.y - this.sprite.radius - 10);
    }
    this.drawRoleMark();
    this.updateTelegraph();
  }

  setTelegraphTarget(x: number, y: number, active: boolean): void {
    if (!this.telegraphGfx) {
      this.telegraphGfx = this.sprite.scene.add.graphics().setDepth(3);
    }
    this.telegraphGfx.clear();
    if (!active || !this.isAlive) return;
    this.telegraphGfx.lineStyle(2, 0x9d4edd, 0.7);
    this.telegraphGfx.beginPath();
    this.telegraphGfx.moveTo(this.x, this.y);
    this.telegraphGfx.lineTo(x, y);
    this.telegraphGfx.strokePath();
    this.telegraphGfx.fillStyle(0x9d4edd, 0.25);
    this.telegraphGfx.fillCircle(x, y, 14);
  }

  private updateTelegraph(): void {
    if (this.telegraphGfx) {
      this.telegraphGfx.setPosition(0, 0);
    }
  }

  private drawRoleMark(): void {
    if (!this.roleMarkGfx) return;
    this.roleMarkGfx.clear();
    this.roleMarkGfx.setPosition(this.x, this.y);
    // Broken circle faction mark
    this.roleMarkGfx.lineStyle(1, 0x6b6560, 0.6);
    this.roleMarkGfx.beginPath();
    this.roleMarkGfx.arc(0, -this.sprite.radius * 0.5, 4, 0.3, 5.5);
    this.roleMarkGfx.strokePath();
    if (this.role === 'assassin') {
      this.roleMarkGfx.lineStyle(1, 0x5c3a6e, 0.9);
      this.roleMarkGfx.beginPath();
      this.roleMarkGfx.moveTo(-3, 2);
      this.roleMarkGfx.lineTo(3, -2);
      this.roleMarkGfx.strokePath();
    }
  }

  private showAssassinEntrance(): void {
    const scene = this.sprite.scene;
    const sweep = scene.add.graphics().setDepth(1);
    sweep.lineStyle(3, 0x5c3a6e, 0.5);
    sweep.strokeCircle(this.x, this.y, 60);
    scene.tweens.add({
      targets: sweep,
      alpha: 0,
      duration: 800,
      onComplete: () => sweep.destroy(),
    });
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
    this.telegraphGfx?.destroy();
    this.roleMarkGfx?.destroy();
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
