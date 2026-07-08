import Phaser from 'phaser';
import { COMMAND, COHESION, PARTNER, SYNERGY } from '../config';
import type { ActiveOrder } from './OrderSystem';
import type { AbilitySystem } from './AbilitySystem';
import type { CohesionState } from '../cohesion/CohesionSystem';
import type { DoctrineId } from '../doctrine/types';
import { Commander, Companion, clampToArena } from '../entities/Unit';
import {
  EnemyUnit,
  getNearestEnemy,
} from '../enemies/EnemyUnit';
import {
  assessThreats,
  computeScreenPosition,
  type CompanionIntent,
  type ThreatAssessment,
} from './companionIntent';

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
  private lastInitiativeAt = 0;
  private lastSupportCalloutAt = 0;
  private intent: CompanionIntent = 'guarding';
  private proactiveInterceptTarget: EnemyUnit | null = null;

  constructor(
    private scene: Phaser.Scene,
    private doctrineId: DoctrineId,
  ) {}

  getIntent(): CompanionIntent {
    return this.intent;
  }

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
      this.proactiveInterceptTarget = null;
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

    const threats = assessThreats(commander, companion, enemies);

    if (companion.isResyncing) {
      this.intent = 'returning';
      companion.updateResync(commander);
      clampToArena(companion);
      return;
    }

    const order = this.getExecutableOrder(now);
    this.applyDoctrinePassives(companion, order, now);
    this.applyAbilityBuffs(companion, abilities, now);

    if (!order) {
      if (cohesionState === 'desynced') {
        this.executeDesyncedIdle(companion, commander, enemies, now, threats);
      } else {
        this.executePartnerIdle(companion, commander, enemies, now, threats);
      }
      clampToArena(companion);
      return;
    }

    switch (order.type) {
      case 'hold':
        this.intent = 'holding';
        this.executeHold(companion, commander, enemies, now, cohesionState);
        break;
      case 'attack':
        this.intent = 'pursuing';
        this.executeAttack(companion, enemies, now, cohesionState);
        break;
      case 'defend':
        this.intent = threats.assassinUrgent ? 'intercepting' : 'screening';
        this.executeDefend(companion, commander, enemies, now, cohesionState, threats);
        break;
      case 'rally_point':
        this.intent = 'rallying';
        this.executeRally(companion, order, enemies, now, cohesionState);
        break;
      case 'focus_target':
        this.intent = 'focusing';
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
    companion.abilityDamageMultiplier = abilities.getDamageMultiplier(now);
    companion.abilityDamageReduction = abilities.getDamageReduction(now);
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

  clearMarkers(): void {
    this.rallyMarker?.destroy();
    this.rallyMarker = undefined;
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

  /**
   * Bonded idle: partner screens Commander — does NOT chase nearest enemy.
   * May take limited initiative against urgent threats.
   */
  private executePartnerIdle(
    companion: Companion,
    commander: Commander,
    enemies: EnemyUnit[],
    now: number,
    threats: ThreatAssessment,
  ): void {
    if (this.tryProactiveIntercept(companion, commander, enemies, now, threats)) {
      return;
    }

    this.maybeCalloutSupport(companion, now, threats);

    const screenThreat = threats.commanderThreat;
    const screenPos = computeScreenPosition(
      commander,
      screenThreat,
      PARTNER.screenOffset,
    );

    this.intent = screenThreat ? 'screening' : 'guarding';
    this.moveToPosition(companion, screenPos.x, screenPos.y, companion.effectiveSpeed * 0.75);
    this.faceToward(companion, screenThreat?.x ?? commander.x, screenThreat?.y ?? commander.y);

    // Attack only what enters range — never chase
    this.attackInRangeOnly(companion, enemies, now);
  }

  /** Proactive intercept: Oathbound moves to cut off Assassin without player order */
  private tryProactiveIntercept(
    companion: Companion,
    commander: Commander,
    _enemies: EnemyUnit[],
    now: number,
    threats: ThreatAssessment,
  ): boolean {
    const assassin = threats.assassinUrgent;
    if (!assassin) {
      this.proactiveInterceptTarget = null;
      return false;
    }

    const dist = Phaser.Math.Distance.Between(companion.x, companion.y, assassin.x, assassin.y);
    if (dist > PARTNER.initiativeAssassinRange) return false;
    if (now - this.lastInitiativeAt < PARTNER.initiativeCooldownMs && !this.proactiveInterceptTarget) {
      return false;
    }

    if (!this.proactiveInterceptTarget) {
      this.lastInitiativeAt = now;
      this.proactiveInterceptTarget = assassin;
    }

    this.intent = 'intercepting';
    const interceptX = (assassin.x + commander.x) / 2;
    const interceptY = (assassin.y + commander.y) / 2;
    this.moveToPosition(
      companion,
      interceptX,
      interceptY,
      companion.effectiveSpeed * PARTNER.interceptSpeedMultiplier,
    );
    this.faceToward(companion, assassin.x, assassin.y);

    if (Phaser.Math.Distance.Between(companion.x, companion.y, assassin.x, assassin.y) <= companion.attackRange) {
      companion.tryAttack(assassin, now);
    }
    return true;
  }

  /** Brief callout toward Support — communicates "this one matters" without UI lecture */
  private maybeCalloutSupport(
    companion: Companion,
    now: number,
    threats: ThreatAssessment,
  ): void {
    if (!threats.supportActive) return;
    if (now - this.lastSupportCalloutAt < 12_000) return;

    const dist = Phaser.Math.Distance.Between(
      companion.x, companion.y,
      threats.supportActive.x, threats.supportActive.y,
    );
    if (dist > companion.attackRange * 2.5) return;

    this.lastSupportCalloutAt = now;
    this.faceToward(companion, threats.supportActive.x, threats.supportActive.y);
    companion.sprite.scene.events.emit('companion-callout', {
      fromX: companion.x,
      fromY: companion.y,
      toX: threats.supportActive.x,
      toY: threats.supportActive.y,
    });
  }

  private executeDesyncedIdle(
    companion: Companion,
    commander: Commander,
    enemies: EnemyUnit[],
    now: number,
    threats: ThreatAssessment,
  ): void {
    this.intent = 'fighting_alone';
    this.attackInRangeOnly(companion, enemies, now);

    const distToCommander = Phaser.Math.Distance.Between(
      companion.x, companion.y, commander.x, commander.y,
    );

    if (distToCommander > SYNERGY.bondRadius * 1.25) {
      this.intent = 'returning';
      this.moveToPosition(companion, commander.x, commander.y, companion.effectiveSpeed * 0.4);
    } else if (threats.commanderThreat) {
      this.faceToward(companion, threats.commanderThreat.x, threats.commanderThreat.y);
      companion.stop();
    }
  }

  private executeHold(
    companion: Companion,
    _commander: Commander,
    enemies: EnemyUnit[],
    now: number,
    _cohesionState: CohesionState,
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
      this.moveToPosition(companion, this.holdPosition.x, this.holdPosition.y, companion.effectiveSpeed * 0.8);
    } else {
      companion.stop();
    }

    companion.bonusDamageReduction = this.ironWallHolding ? COMMAND.ironWall.holdDamageReduction : 0;
    this.attackInRangeOnly(companion, enemies, now);
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
    this.pursueAndAttack(companion, target, now, maxPursuit);
  }

  private executeDefend(
    companion: Companion,
    commander: Commander,
    enemies: EnemyUnit[],
    now: number,
    cohesionState: CohesionState,
    threats: ThreatAssessment,
  ): void {
    const urgent = threats.assassinUrgent ?? threats.flankThreat ?? threats.commanderThreat;
    const speedMult = threats.assassinUrgent
      ? PARTNER.defendSpeedMultiplier
      : 1;

    if (urgent) {
      const interceptX = (urgent.x + commander.x) / 2;
      const interceptY = (urgent.y + commander.y) / 2;
      const dist = Phaser.Math.Distance.Between(companion.x, companion.y, interceptX, interceptY);

      if (dist > 15) {
        this.moveToPosition(companion, interceptX, interceptY, companion.effectiveSpeed * speedMult);
      } else {
        companion.stop();
      }

      if (Phaser.Math.Distance.Between(companion.x, companion.y, urgent.x, urgent.y) <= companion.attackRange) {
        companion.tryAttack(urgent, now);
      }
      this.faceToward(companion, urgent.x, urgent.y);
      return;
    }

    const screenPos = computeScreenPosition(commander, threats.commanderThreat, PARTNER.screenOffset);
    this.moveToPosition(companion, screenPos.x, screenPos.y, companion.effectiveSpeed * 0.85);
    this.attackInRangeOnly(companion, enemies, now);

    if (cohesionState === 'bonded') {
      this.faceToward(companion, commander.x, commander.y);
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
      this.moveToPosition(
        companion,
        order.rallyPoint.x,
        order.rallyPoint.y,
        companion.effectiveSpeed * speedMult,
      );
    } else {
      companion.stop();
      this.attackInRangeOnly(companion, enemies, now);
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

    this.faceToward(companion, target.x, target.y);
    const maxPursuit = cohesionState === 'desynced'
      ? companion.attackRange * COHESION.desyncedPursuitRangeMultiplier
      : companion.attackRange * 5;
    this.pursueAndAttack(companion, target, now, maxPursuit);
  }

  private pursueAndAttack(
    companion: Companion,
    target: EnemyUnit,
    now: number,
    maxPursuit: number,
  ): void {
    const dist = Phaser.Math.Distance.Between(companion.x, companion.y, target.x, target.y);
    if (dist > companion.attackRange) {
      if (dist <= maxPursuit) {
        this.moveToPosition(companion, target.x, target.y, companion.effectiveSpeed);
      } else {
        companion.stop();
      }
    } else {
      companion.stop();
      companion.tryAttack(target, now);
    }
    this.faceToward(companion, target.x, target.y);
  }

  /** Partner rule: never chase during guard/screen — only strike in range */
  private attackInRangeOnly(companion: Companion, enemies: EnemyUnit[], now: number): void {
    const target = getNearestEnemy(enemies, companion);
    if (!target) return;
    const dist = Phaser.Math.Distance.Between(companion.x, companion.y, target.x, target.y);
    if (dist <= companion.attackRange) {
      companion.tryAttack(target, now);
    }
  }

  private moveToPosition(companion: Companion, x: number, y: number, speed: number): void {
    const angle = Phaser.Math.Angle.Between(companion.x, companion.y, x, y);
    companion.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  private faceToward(companion: Companion, x: number, y: number): void {
    const angle = Phaser.Math.Angle.Between(companion.x, companion.y, x, y);
    companion.sprite.setRotation(angle);
  }

  private showRallyMarker(x: number, y: number): void {
    this.rallyMarker?.destroy();
    this.rallyMarker = this.scene.add.circle(x, y, 14, 0xd4a054, 0.12);
    this.rallyMarker.setStrokeStyle(2, 0xd4a054, 0.55);
    this.rallyMarker.setDepth(1);
  }
}
