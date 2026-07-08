import Phaser from 'phaser';
import { COMMANDER, COMPANION, GAME_HEIGHT, GAME_WIDTH, PARTNER } from '../config';
import type { CohesionState } from '../cohesion/CohesionSystem';
import { PALETTE } from '../presentation/palette';

export abstract class Unit {
  readonly sprite: Phaser.GameObjects.Arc;
  readonly body: Phaser.Physics.Arcade.Body;
  protected sigilGfx: Phaser.GameObjects.Graphics;
  maxHealth: number;
  health: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime = 0;
  isAlive = true;
  synergyDamageBonus = 0;
  synergyDamageReduction = 0;
  abilityDamageMultiplier = 1;
  abilityDamageReduction = 0;
  bonusDamageReduction = 0;
  attackCooldownMultiplier = 1;

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
    this.sprite.setStrokeStyle(2, 0xffffff, 0.25);
    scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setCircle(radius);
    this.sigilGfx = scene.add.graphics().setDepth(4);
    this.redrawSigil();
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
    return this.attackDamage * (1 + this.synergyDamageBonus) * this.abilityDamageMultiplier;
  }

  get damageReduction(): number {
    return Math.min(0.75, this.synergyDamageReduction + this.abilityDamageReduction + this.bonusDamageReduction);
  }

  set damageReduction(_value: number) {
    // Use bonusDamageReduction for temporary hold bonuses.
  }

  get effectiveAttackCooldown(): number {
    return this.attackCooldown * this.attackCooldownMultiplier;
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

  heal(amount: number): void {
    if (!this.isAlive) return;
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.flashHeal();
  }

  protected flashHeal(): void {
    this.sprite.setFillStyle(0x88ffaa);
    this.sprite.scene.time.delayedCall(80, () => {
      if (this.isAlive) {
        this.sprite.setFillStyle(this.getColor());
      }
    });
  }

  protected flashDamage(): void {
    this.sprite.setFillStyle(0xffffff);
    this.sprite.setScale(1.12);
    this.sprite.scene.time.delayedCall(90, () => {
      if (this.isAlive) {
        this.sprite.setFillStyle(this.getColor());
        this.sprite.setScale(1);
      }
    });
  }

  applyHitImpact(fromX: number, fromY: number, knockback = 50): void {
    if (!this.isAlive) return;
    const angle = Phaser.Math.Angle.Between(fromX, fromY, this.x, this.y);
    this.body.setVelocity(Math.cos(angle) * knockback, Math.sin(angle) * knockback);
    this.sprite.scene.time.delayedCall(110, () => {
      if (this.isAlive) this.body.setVelocity(0, 0);
    });
  }

  protected abstract getColor(): number;

  protected abstract redrawSigil(): void;

  setBondVisual(_bonded: boolean, state: CohesionState, _tension: number): void {
    if (!this.isAlive) return;
    const alpha = state === 'desynced' ? 0.45 : 1;
    this.sprite.setAlpha(alpha);
    if (state === 'desynced') {
      this.sprite.setStrokeStyle(2, PALETTE.bondBroken, 0.4);
    } else if (state === 'resyncing') {
      this.sprite.setStrokeStyle(2, PALETTE.bondAmber, 0.8);
    } else {
      this.sprite.setStrokeStyle(2, PALETTE.bondAmber, 0.35);
    }
    this.redrawSigil();
  }

  protected syncSigilPosition(): void {
    this.sigilGfx.setPosition(this.x, this.y);
  }

  protected die(): void {
    this.isAlive = false;
    this.body.setVelocity(0, 0);
    this.sprite.setAlpha(0.3);
    this.sprite.setStrokeStyle(2, 0x666666, 0.5);
  }

  canAttack(now: number): boolean {
    return now - this.lastAttackTime >= this.effectiveAttackCooldown;
  }

  tryAttack(target: Unit, now: number): boolean {
    if (!this.isAlive || !target.isAlive) return false;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    if (dist > this.attackRange) return false;
    if (!this.canAttack(now)) return false;
    this.lastAttackTime = now;
    this.performAttackLunge(target);
    target.takeDamage(this.effectiveDamage);
    return true;
  }

  protected performAttackLunge(target: Unit): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    const lungeForce = this.attackRange > 100 ? 70 : 130;
    this.body.setVelocity(Math.cos(angle) * lungeForce, Math.sin(angle) * lungeForce);
    this.sprite.scene.time.delayedCall(70, () => {
      if (this.isAlive) this.stop();
    });
    target.applyHitImpact(this.x, this.y, lungeForce > 100 ? 55 : 35);
  }

  stop(): void {
    this.body.setVelocity(0, 0);
  }

  destroy(): void {
    this.sigilGfx.destroy();
    this.sprite.destroy();
  }
}

export class Commander extends Unit {
  private readonly baseSpeed: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, COMMANDER.radius, COMMANDER.color, COMMANDER);
    this.baseSpeed = COMMANDER.speed;
  }

  protected getColor(): number {
    return COMMANDER.color;
  }

  protected redrawSigil(): void {
    this.syncSigilPosition();
    this.sigilGfx.clear();
    // The Needle — split-circle crest
    this.sigilGfx.lineStyle(2, PALETTE.commanderCrest, 0.9);
    this.sigilGfx.strokeCircle(0, -2, 5);
    this.sigilGfx.fillStyle(PALETTE.commanderCrest, 0.5);
    this.sigilGfx.fillCircle(-2, -2, 2);
  }

  move(velocity: Phaser.Math.Vector2): void {
    if (!this.isAlive) return;
    velocity.normalize().scale(this.baseSpeed);
    this.body.setVelocity(velocity.x, velocity.y);
    this.redrawSigil();
  }
}

export class Companion extends Unit {
  private readonly baseSpeed: number;
  bondActive = false;
  cohesionState: CohesionState = 'bonded';
  speedMultiplier = 1;
  ironWallHolding = false;
  tacticalRallyActive = false;
  isResyncing = false;
  private bondRing?: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, COMPANION.radius, COMPANION.color, COMPANION);
    this.baseSpeed = COMPANION.speed;
    this.bondRing = scene.add.circle(x, y, 8, 0xd4a054, 0);
    this.bondRing.setStrokeStyle(2, 0xd4a054, 0);
    this.bondRing.setDepth(-1);
  }

  get effectiveSpeed(): number {
    let speed = this.baseSpeed * this.speedMultiplier;
    if (this.tacticalRallyActive) speed *= 1.35;
    return speed;
  }

  protected getColor(): number {
    return COMPANION.color;
  }

  protected redrawSigil(): void {
    this.syncSigilPosition();
    this.sigilGfx.clear();
    // The Anvil — filled half of binding seal
    this.sigilGfx.lineStyle(2, PALETTE.oathboundCrest, 0.9);
    this.sigilGfx.strokeCircle(0, 0, 7);
    this.sigilGfx.fillStyle(PALETTE.oathboundCrest, 0.6);
    this.sigilGfx.fillCircle(2, 0, 3);
  }

  beginResync(commander: Commander): void {
    this.isResyncing = true;
    this.stop();
    void commander;
  }

  updateResync(commander: Commander): void {
    if (!this.isResyncing) return;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, commander.x, commander.y);
    const angle = Phaser.Math.Angle.Between(this.x, this.y, commander.x, commander.y);
    this.sprite.setRotation(angle);

    if (dist > COMPANION.followDistance * 0.6) {
      const speed = this.effectiveSpeed * PARTNER.resyncMoveSpeed;
      this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    } else {
      this.stop();
    }
    this.updateBondRing();
  }

  finishResync(): void {
    this.isResyncing = false;
    this.sprite.setRotation(0);
  }

  updateBondRing(): void {
    if (!this.bondRing) return;
    this.bondRing.setPosition(this.x, this.y);
    this.redrawSigil();
    const alpha =
      this.cohesionState === 'bonded' ? 0.35 :
      this.cohesionState === 'resyncing' ? 0.5 : 0.1;
    const color =
      this.cohesionState === 'bonded' ? PALETTE.bondAmber :
      this.cohesionState === 'resyncing' ? PALETTE.bondAmber : PALETTE.bondBroken;
    this.bondRing.setStrokeStyle(2, color, alpha);
  }

  destroy(): void {
    this.bondRing?.destroy();
    super.destroy();
  }
}

export function clampToArena(unit: Unit): void {
  const radius = (unit.sprite as Phaser.GameObjects.Arc).radius;
  unit.sprite.x = Phaser.Math.Clamp(unit.sprite.x, radius, GAME_WIDTH - radius);
  unit.sprite.y = Phaser.Math.Clamp(unit.sprite.y, radius, GAME_HEIGHT - radius);
}
