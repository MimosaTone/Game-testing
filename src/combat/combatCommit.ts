import { COMBAT } from '../config';
import type { Unit } from '../entities/Unit';
import type { EnemyUnit } from '../enemies/EnemyUnit';
import {
  distanceBetween,
  moveToward,
  paceWhileWaiting,
} from '../enemies/behaviorHelpers';

/** Begin a protected attack exchange — movement logic must not override until expiry. */
export function beginExchangeCommit(attacker: Unit, target: Unit, now: number): void {
  const duration = attacker.effectiveAttackCooldown + COMBAT.commitRecoveryMs;
  attacker.beginCombatCommit(now, target, duration);
}

export function extendExchangeCommit(attacker: Unit, now: number): void {
  attacker.extendCombatCommit(now, COMBAT.commitRecoveryMs);
}

export function isCommittedToTarget(attacker: Unit, target: Unit, now: number): boolean {
  return attacker.getCombatCommitTarget(now) === target;
}

/**
 * Protected melee/ranged-unit exchange loop.
 * Returns true when this frame was handled by combat (callers should skip positioning).
 */
export function runCommittedExchange(
  attacker: EnemyUnit,
  target: Unit,
  now: number,
  onHit?: () => void,
): boolean {
  const dist = distanceBetween(attacker.x, attacker.y, target.x, target.y);
  const inRange = dist <= attacker.attackRange;

  if (inRange) {
    if (!isCommittedToTarget(attacker, target, now)) {
      beginExchangeCommit(attacker, target, now);
    }
    attacker.faceToward(target.x, target.y);
    if (attacker.canAttack(now)) {
      attacker.stop();
      if (attacker.tryAttack(target, now)) {
        extendExchangeCommit(attacker, now);
        onHit?.();
      }
    } else {
      paceWhileWaiting(attacker, target, now, 'creep');
    }
    return true;
  }

  if (isCommittedToTarget(attacker, target, now)) {
    moveToward(attacker, target.x, target.y, COMBAT.commitApproachSpeedMult);
    return true;
  }

  return false;
}

/**
 * Ranged exchange — closes into attack range while committed, never freezes in dead zone.
 */
export function runCommittedRangedExchange(
  attacker: EnemyUnit,
  target: Unit,
  now: number,
  maxApproachRange: number,
): boolean {
  const dist = distanceBetween(attacker.x, attacker.y, target.x, target.y);
  const inAttackRange = dist <= attacker.attackRange;

  if (inAttackRange) {
    if (!isCommittedToTarget(attacker, target, now)) {
      beginExchangeCommit(attacker, target, now);
    }
    attacker.faceToward(target.x, target.y);
    if (attacker.canAttack(now)) {
      attacker.stop();
      attacker.tryAttack(target, now);
      extendExchangeCommit(attacker, now);
    } else {
      paceWhileWaiting(attacker, target, now, 'creep');
    }
    return true;
  }

  if (dist <= maxApproachRange) {
    if (!isCommittedToTarget(attacker, target, now)) {
      beginExchangeCommit(attacker, target, now);
    }
    moveToward(attacker, target.x, target.y, COMBAT.commitApproachSpeedMult);
    return true;
  }

  if (isCommittedToTarget(attacker, target, now)) {
    moveToward(attacker, target.x, target.y, COMBAT.commitApproachSpeedMult);
    return true;
  }

  return false;
}

export function runCompanionExchange(
  companion: Unit,
  target: Unit,
  now: number,
  moveTowardTarget: (x: number, y: number, speed: number) => void,
  speed: number,
): boolean {
  const dist = distanceBetween(companion.x, companion.y, target.x, target.y);
  const inRange = dist <= companion.attackRange;

  if (inRange) {
    if (!isCommittedToTarget(companion, target, now)) {
      beginExchangeCommit(companion, target, now);
    }
    if (companion.canAttack(now)) {
      companion.stop();
      if (companion.tryAttack(target, now)) {
        extendExchangeCommit(companion, now);
      }
    }
    return true;
  }

  if (isCommittedToTarget(companion, target, now)) {
    moveTowardTarget(target.x, target.y, speed * COMBAT.commitApproachSpeedMult);
    return true;
  }

  return false;
}
