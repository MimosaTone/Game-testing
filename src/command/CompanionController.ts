import Phaser from 'phaser';
import { COMMAND, COMPANION, COHESION, SYNERGY } from '../config';
import type { ActiveOrder } from './OrderSystem';
import type { AbilitySystem } from './AbilitySystem';
import type { CohesionState } from '../cohesion/CohesionSystem';
import type { DoctrineId } from '../doctrine/types';
import { Commander, Companion, clampToArena } from '../entities/Unit';
import {
  EnemyUnit,
  getNearestEnemy,
  getNearestEnemyToPoint,
} from '../enemies/EnemyUnit';

interface PendingOrder {
  order: ActiveOrder;
  executeAt: number;
}

export class CompanionController {
  private pendingOrder: PendingOrder | null = null;
  private holdPosition: { x: number; y: number } | null = null;
  private ironWallHolding = false;
  private focusFireEndsAt = 0;
  private focusFireCooldownUntil = 0;
  private rallyMarker?: Phaser.GameObjects.Arc;
  private focusMarker?: Phaser.GameObjects.Graphics;

  constructor(
    private scene: Phaser.Scene,
    private doctrineId: DoctrineId,
  ) {}

  syncOrder(
    activeOrder: ActiveOrder | null,
    now: number,
    cohesionState: CohesionState,
    obedienceDelayMs: number,
  ): void {
    if (!activeOrder) return;

    const delay =
      cohesionState === 'bonded' ? 0 :
      cohesionState === 'resyncing' ? COHESION.resyncDurationMs :
      obedienceDelayMs;

    const isNew =
      !this.pendingOrder ||
      this.pendingOrder.order.type !== activeOrder.type ||
      this.pendingOrder.order.issuedAt !== activeOrder.issuedAt;

    if (isNew) {
      this.pendingOrder = { order: { ...activeOrder }, executeAt: now + delay };
      if (activeOrder.type === 'hold') {
        this.holdPosition = null;
      }
    }
  }

  update(
    companion: Companion,
    commander: Commander,
    enemies: EnemyUnit[],
    abilities: AbilitySystem,
    now: number,
    cohesionState: CohesionState,
  ): void {
    if (!companion.isAlive) return;

    if (companion.isResyncing) {
      companion.updateResync(commander);
      clampToArena(companion);
      return;
    }

    const order = this.getExecutableOrder(now);
    this.applyDoctrinePassives(companion, order, now);
    this.applyAbilityBuffs(companion, abilities, now);

    if (!order) {
      if (cohesionState === 'desynced') {
        this.executeDesyncedIdle(companion, commander, enemies, now);
      } else {
        this.followCommander(companion, commander);
        this.autoAttackNearest(companion, enemies, now, cohesionState, false);
      }
      clampToArena(companion);
      return;
    }

    switch (order.type) {
      case 'hold':
        this.executeHold(companion, commander, enemies, now, cohesionState);
        break;
      case 'attack':
        this.executeAttack(companion, enemies, now, cohesionState);
        break;
      case 'defend':
        this.executeDefend(companion, commander, enemies, now, cohesionState);
        break;
      case 'rally_point':
        this.executeRally(companion, order, enemies, now, cohesionState);
        break;
      case 'focus_target':
        this.executeFocus(companion, order, enemies, now, cohesionState);
        break;
    }

    clampToArena(companion);
  }

  private getExecutableOrder(now: number): ActiveOrder | null {
    if (!this.pendingOrder || now < this.pendingOrder.executeAt) return null;
    return this.pendingOrder.order;
  }

  private applyDoctrinePassives(
    companion: Companion,
    order: ActiveOrder | null,
    now: number,
  ): void {
    if (this.doctrineId === 'iron_wall') {
      companion.speedMultiplier = COMMAND.ironWall.movementSpeedMultiplier;
      this.ironWallHolding = order?.type === 'hold';
      companion.ironWallHolding = this.ironWallHolding;
    } else {
      companion.speedMultiplier = 1;
      companion.ironWallHolding = false;
      this.ironWallHolding = false;
    }

    if (this.doctrineId === 'shock_assault' && this.focusFireEndsAt > now) {
      companion.attackCooldownMultiplier = 1 / (1 + COMMAND.shockAssault.focusFireSpeedBonus);
    } else {
      companion.attackCooldownMultiplier = 1;
    }
  }

  private applyAbilityBuffs(companion: Companion, abilities: AbilitySystem, now: number): void {
    const warCry = abilities.getDamageMultiplier(now);
    const rallyDr = abilities.getDamageReduction(now);
    companion.abilityDamageMultiplier = warCry;
    companion.abilityDamageReduction = rallyDr;
    companion.tacticalRallyActive = abilities.hasBuff('tactical_rally', now);
  }

  onFocusTargetIssued(now: number): void {
    if (this.doctrineId !== 'shock_assault') return;
    if (now < this.focusFireCooldownUntil) return;
    this.focusFireEndsAt = now + COMMAND.shockAssault.focusFireDurationMs;
    this.focusFireCooldownUntil = now + COMMAND.shockAssault.focusFireCooldownMs;
  }

  setRallyPoint(x: number, y: number): void {
    this.showRallyMarker(x, y);
  }

  setFocusMarker(enemy: EnemyUnit): void {
    this.focusMarker?.destroy();
    this.focusMarker = this.scene.add.graphics();
    this.focusMarker.lineStyle(2, 0xff4444, 0.9);
    this.focusMarker.strokeCircle(enemy.x, enemy.y, enemy.sprite.radius + 6);
    this.focusMarker.setDepth(5);
  }

  clearMarkers(): void {
    this.rallyMarker?.destroy();
    this.focusMarker?.destroy();
    this.rallyMarker = undefined;
    this.focusMarker = undefined;
  }

  getBattlefieldControlPoints(): { x: number; y: number; kind: 'rally' | 'hold' }[] {
    const points: { x: number; y: number; kind: 'rally' | 'hold' }[] = [];
    if (this.holdPosition) {
      points.push({ ...this.holdPosition, kind: 'hold' });
    }
    if (this.rallyMarker?.active) {
      points.push({ x: this.rallyMarker.x, y: this.rallyMarker.y, kind: 'rally' });
    }
    return points;
  }

  destroy(): void {
    this.clearMarkers();
  }

  private executeDesyncedIdle(
    companion: Companion,
    commander: Commander,
    enemies: EnemyUnit[],
    now: number,
  ): void {
    const distToCommander = Phaser.Math.Distance.Between(
      companion.x, companion.y, commander.x, commander.y,
    );

    this.autoAttackNearest(companion, enemies, now, 'desynced', true);

    if (distToCommander > SYNERGY.bondRadius * 1.25) {
      this.moveToward(companion, commander.x, commander.y, companion.effectiveSpeed * 0.35);
    } else {
      companion.stop();
    }
  }

  private followCommander(companion: Companion, commander: Commander): void {
    const dist = Phaser.Math.Distance.Between(companion.x, companion.y, commander.x, commander.y);
    const followDistance = COMPANION.followDistance;
    if (dist > followDistance) {
      this.moveToward(companion, commander.x, commander.y, companion.effectiveSpeed);
    } else {
      companion.stop();
    }
  }

  private executeHold(
    companion: Companion,
    _commander: Commander,
    enemies: EnemyUnit[],
    now: number,
    cohesionState: CohesionState,
  ): void {
    if (!this.holdPosition) {
      this.holdPosition = { x: companion.x, y: companion.y };
      this.showRallyMarker(this.holdPosition.x, this.holdPosition.y);
    }

    const holdRadius = this.ironWallHolding ? 20 : 35;
    const dist = Phaser.Math.Distance.Between(
      companion.x, companion.y, this.holdPosition.x, this.holdPosition.y,
    );

    if (dist > holdRadius) {
      this.moveToward(companion, this.holdPosition.x, this.holdPosition.y, companion.effectiveSpeed * 0.8);
    } else {
      companion.stop();
    }

    if (this.ironWallHolding) {
      companion.bonusDamageReduction = COMMAND.ironWall.holdDamageReduction;
    } else {
      companion.bonusDamageReduction = 0;
    }

    this.autoAttackNearest(companion, enemies, now, cohesionState, true);
  }

  private executeAttack(
    companion: Companion,
    enemies: EnemyUnit[],
    now: number,
    cohesionState: CohesionState,
  ): void {
    const target = getNearestEnemy(enemies, companion);
    if (!target) {
      companion.stop();
      return;
    }

    const cautious = cohesionState === 'desynced';
    const maxPursuit = companion.attackRange * (cautious ? COHESION.desyncedPursuitRangeMultiplier : 4);

    this.pursueAndAttack(companion, target, enemies, now, maxPursuit);
  }

  private executeDefend(
    companion: Companion,
    commander: Commander,
    enemies: EnemyUnit[],
    now: number,
    cohesionState: CohesionState,
  ): void {
    const defendRadius = this.doctrineId === 'shock_assault'
      ? 90 * COMMAND.shockAssault.defendEffectiveness
      : 110;

    const distToCommander = Phaser.Math.Distance.Between(
      companion.x, companion.y, commander.x, commander.y,
    );

    if (distToCommander > defendRadius) {
      this.moveToward(companion, commander.x, commander.y, companion.effectiveSpeed);
    } else {
      companion.stop();
    }

    const threat = getNearestEnemyToPoint(enemies, commander.x, commander.y);
    if (threat) {
      const threatDist = Phaser.Math.Distance.Between(companion.x, companion.y, threat.x, threat.y);
      if (threatDist <= companion.attackRange) {
        companion.tryAttack(threat, now);
      } else if (!cohesionState || cohesionState === 'bonded') {
        this.moveToward(companion, threat.x, threat.y, companion.effectiveSpeed * 0.7);
      }
    }
  }

  private executeRally(
    companion: Companion,
    order: ActiveOrder,
    enemies: EnemyUnit[],
    now: number,
    cohesionState: CohesionState,
  ): void {
    if (!order.rallyPoint) return;

    const dist = Phaser.Math.Distance.Between(
      companion.x, companion.y, order.rallyPoint.x, order.rallyPoint.y,
    );

    if (dist > 25) {
      const speedMult = cohesionState === 'desynced' ? 0.6 : 1;
      this.moveToward(
        companion,
        order.rallyPoint.x,
        order.rallyPoint.y,
        companion.effectiveSpeed * speedMult,
      );

      if (cohesionState === 'desynced') {
        const nearby = getNearestEnemy(enemies, companion);
        if (nearby) {
          const nearbyDist = Phaser.Math.Distance.Between(companion.x, companion.y, nearby.x, nearby.y);
          if (nearbyDist < companion.attackRange * 1.2) {
            companion.stop();
            companion.tryAttack(nearby, now);
            return;
          }
        }
      }
    } else {
      companion.stop();
      this.autoAttackNearest(companion, enemies, now, cohesionState, true);
    }
  }

  private executeFocus(
    companion: Companion,
    order: ActiveOrder,
    enemies: EnemyUnit[],
    now: number,
    cohesionState: CohesionState,
  ): void {
    let target: EnemyUnit | null = null;
    if (order.focusEnemyId) {
      target = enemies.find((e) => e.id === order.focusEnemyId && e.isAlive) ?? null;
    }
    if (!target) {
      target = getNearestEnemy(enemies, companion);
    }

    if (!target) {
      companion.stop();
      return;
    }

    if (cohesionState === 'desynced') {
      const closer = getNearestEnemy(enemies, companion);
      if (closer && closer.id !== target.id) {
        const closerDist = Phaser.Math.Distance.Between(companion.x, companion.y, closer.x, closer.y);
        const targetDist = Phaser.Math.Distance.Between(companion.x, companion.y, target.x, target.y);
        if (closerDist < targetDist * 0.6) {
          target = closer;
        }
      }
    }

    this.setFocusMarker(target);
    const maxPursuit = cohesionState === 'desynced'
      ? companion.attackRange * COHESION.desyncedPursuitRangeMultiplier
      : companion.attackRange * 5;
    this.pursueAndAttack(companion, target, enemies, now, maxPursuit);
  }

  private pursueAndAttack(
    companion: Companion,
    target: EnemyUnit,
    enemies: EnemyUnit[],
    now: number,
    maxPursuit: number,
  ): void {
    const dist = Phaser.Math.Distance.Between(companion.x, companion.y, target.x, target.y);
    if (dist > companion.attackRange) {
      if (dist <= maxPursuit) {
        this.moveToward(companion, target.x, target.y, companion.effectiveSpeed);
      } else {
        companion.stop();
        this.autoAttackNearest(companion, enemies, now, 'desynced', false);
      }
    } else {
      companion.stop();
      companion.tryAttack(target, now);
    }
  }

  private autoAttackNearest(
    companion: Companion,
    enemies: EnemyUnit[],
    now: number,
    cohesionState: CohesionState,
    inPlaceOnly: boolean,
  ): void {
    const target = getNearestEnemy(enemies, companion);
    if (!target) return;
    const dist = Phaser.Math.Distance.Between(companion.x, companion.y, target.x, target.y);
    if (dist <= companion.attackRange) {
      companion.tryAttack(target, now);
    } else if (!inPlaceOnly && cohesionState === 'bonded') {
      this.moveToward(companion, target.x, target.y, companion.effectiveSpeed * 0.5);
    }
  }

  private moveToward(companion: Companion, x: number, y: number, speed: number): void {
    const angle = Phaser.Math.Angle.Between(companion.x, companion.y, x, y);
    companion.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  private showRallyMarker(x: number, y: number): void {
    this.rallyMarker?.destroy();
    this.rallyMarker = this.scene.add.circle(x, y, 12, 0x44ff88, 0.15);
    this.rallyMarker.setStrokeStyle(2, 0x44ff88, 0.6);
    this.rallyMarker.setDepth(1);
  }
}
