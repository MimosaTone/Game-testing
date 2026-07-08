import Phaser from 'phaser';
import { COMMANDER, COMPANION, ENEMY, GAME_HEIGHT, GAME_WIDTH } from '../config';

export interface CombatEntity {
  sprite: Phaser.GameObjects.Arc;
  body: Phaser.Physics.Arcade.Body;
  maxHealth: number;
  health: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
  isAlive: boolean;
}

export abstract class Unit {
  readonly sprite: Phaser.GameObjects.Arc;
  readonly body: Phaser.Physics.Arcade.Body;
  maxHealth: number;
  health: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime = 0;
  isAlive = true;
  damageMultiplier = 1;
  damageReduction = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    color: number,
    stats: {
      maxHealth: number;
      attackDamage: number;
      attackRange: number;
      attackCooldown: number;
    },
  ) {
    this.sprite = scene.add.circle(x, y, radius, color);
    this.sprite.setStrokeStyle(2, 0xffffff, 0.3);
    scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setCircle(radius);
    this.maxHealth = stats.maxHealth;
    this.health = stats.maxHealth;
    this.attackDamage = stats.attackDamage;
    this.attackRange = stats.attackRange;
    this.attackCooldown = stats.attackCooldown;
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  get effectiveDamage(): number {
    return this.attackDamage * this.damageMultiplier;
  }

  takeDamage(amount: number): void {
    if (!this.isAlive) return;
    const reduced = amount * (1 - this.damageReduction);
    this.health -= reduced;
    this.flashDamage();
    if (this.health <= 0) {
      this.die();
    }
  }

  protected flashDamage(): void {
    this.sprite.setFillStyle(0xffffff);
    this.sprite.scene.time.delayedCall(80, () => {
      if (this.isAlive) {
        this.sprite.setFillStyle(this.getColor());
      }
    });
  }

  protected abstract getColor(): number;

  protected die(): void {
    this.isAlive = false;
    this.body.setVelocity(0, 0);
    this.sprite.setAlpha(0.3);
    this.sprite.setStrokeStyle(2, 0x666666, 0.5);
  }

  canAttack(now: number): boolean {
    return now - this.lastAttackTime >= this.attackCooldown;
  }

  tryAttack(target: Unit, now: number): boolean {
    if (!this.isAlive || !target.isAlive) return false;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    if (dist > this.attackRange) return false;
    if (!this.canAttack(now)) return false;
    this.lastAttackTime = now;
    target.takeDamage(this.effectiveDamage);
    return true;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

export class Commander extends Unit {
  private readonly speed: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, COMMANDER.radius, COMMANDER.color, COMMANDER);
    this.speed = COMMANDER.speed;
  }

  protected getColor(): number {
    return COMMANDER.color;
  }

  move(velocity: Phaser.Math.Vector2): void {
    if (!this.isAlive) return;
    velocity.normalize().scale(this.speed);
    this.body.setVelocity(velocity.x, velocity.y);
  }

  stop(): void {
    this.body.setVelocity(0, 0);
  }
}

export class Companion extends Unit {
  private readonly speed: number;
  private readonly followDistance: number;
  bondActive = false;
  private bondRing?: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, COMPANION.radius, COMPANION.color, COMPANION);
    this.speed = COMPANION.speed;
    this.followDistance = COMPANION.followDistance;
    this.bondRing = scene.add.circle(x, y, 8, 0xffd166, 0);
    this.bondRing.setStrokeStyle(2, 0xffd166, 0);
    this.bondRing.setDepth(-1);
  }

  protected getColor(): number {
    return COMPANION.color;
  }

  updateFollow(commander: Commander, delta: number): void {
    if (!this.isAlive) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, commander.x, commander.y);
    if (dist > this.followDistance) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, commander.x, commander.y);
      const speed = Math.min(this.speed, (dist - this.followDistance) * 3);
      this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    } else if (dist < this.followDistance * 0.5) {
      this.body.setVelocity(0, 0);
    } else {
      this.body.setVelocity(this.body.velocity.x * 0.9, this.body.velocity.y * 0.9);
    }

    if (this.bondRing) {
      this.bondRing.setPosition(this.x, this.y);
      const alpha = this.bondActive ? 0.35 : 0;
      this.bondRing.setStrokeStyle(2, 0xffd166, alpha);
    }

    void delta;
  }

  destroy(): void {
    this.bondRing?.destroy();
    super.destroy();
  }
}

export class Enemy extends Unit {
  private readonly speed: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ENEMY.radius, ENEMY.color, ENEMY);
    this.speed = ENEMY.speed;
  }

  protected getColor(): number {
    return ENEMY.color;
  }

  chaseTarget(target: Unit): void {
    if (!this.isAlive || !target.isAlive) return;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    this.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
  }

  stop(): void {
    this.body.setVelocity(0, 0);
  }
}

export function clampToArena(unit: Unit): void {
  unit.sprite.x = Phaser.Math.Clamp(unit.sprite.x, unit.sprite.radius, GAME_WIDTH - unit.sprite.radius);
  unit.sprite.y = Phaser.Math.Clamp(unit.sprite.y, unit.sprite.radius, GAME_HEIGHT - unit.sprite.radius);
}

export function getNearestEnemy(enemies: Enemy[], from: Unit): Enemy | null {
  let nearest: Enemy | null = null;
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
