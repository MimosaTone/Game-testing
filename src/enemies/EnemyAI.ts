import Phaser from 'phaser';
import type { Commander, Companion, Unit } from '../entities/Unit';
import { COMBAT } from '../config';
import {
  beginExchangeCommit,
  extendExchangeCommit,
  isCommittedToTarget,
  runCommittedExchange,
  runCommittedRangedExchange,
} from '../combat/combatCommit';
import { ENEMY_AI } from './definitions';
import type { EnemyUnit } from './EnemyUnit';
import {
  countAlliesNear,
  getAliveEnemies,
  getEnemiesByRole,
  getFrontlineAnchor,
} from './EnemyUnit';
import type { BattlefieldControlPoint } from './types';
import {
  ensureContestPressure,
  fleeFrom,
  getFightCentroid,
  moveToward,
  paceWhileWaiting,
  showHealPulse,
  showShellImpact,
} from './behaviorHelpers';

export interface EnemyAIContext {
  commander: Commander;
  companion: Companion;
  enemies: EnemyUnit[];
  focusEnemyId: string | null;
  controlPoints: BattlefieldControlPoint[];
  now: number;
  onBossSummon: (role: 'assassin' | 'scout', count: number) => void;
}

export function updateEnemyAI(enemy: EnemyUnit, ctx: EnemyAIContext): void {
  if (!enemy.isAlive) return;

  applySupportBuffs(ctx);
  if (enemy.isBoss) enemy.updateBossPhase();

  switch (enemy.role) {
    case 'scout':
      updateScout(enemy, ctx);
      break;
    case 'archer':
      updateArcher(enemy, ctx);
      break;
    case 'bruiser':
      updateBruiser(enemy, ctx);
      break;
    case 'support':
      updateSupport(enemy, ctx);
      break;
    case 'assassin':
      updateAssassin(enemy, ctx);
      break;
    case 'siege':
      updateSiege(enemy, ctx);
      break;
    case 'boss':
      updateBoss(enemy, ctx);
      break;
  }

  enemy.updateLabelPosition();
}

function applySupportBuffs(ctx: EnemyAIContext): void {
  const supports = getEnemiesByRole(ctx.enemies, 'support');
  for (const enemy of getAliveEnemies(ctx.enemies)) {
    enemy.speedMultiplier = 1;
  }
  for (const support of supports) {
    for (const ally of getAliveEnemies(ctx.enemies)) {
      if (ally.id === support.id) continue;
      const dist = Phaser.Math.Distance.Between(support.x, support.y, ally.x, ally.y);
      if (dist <= ENEMY_AI.supportBuffRadius) {
        ally.speedMultiplier = Math.max(ally.speedMultiplier, ENEMY_AI.supportBuffSpeedMultiplier);
      }
    }
  }
}

function pickTarget(enemy: EnemyUnit, ctx: EnemyAIContext): Unit | null {
  const { commander, companion, focusEnemyId } = ctx;

  if (enemy.id === focusEnemyId && companion.isAlive) {
    return companion;
  }

  const targets: Unit[] = [];
  if (commander.isAlive) targets.push(commander);
  if (companion.isAlive) targets.push(companion);
  if (targets.length === 0) return null;

  let nearest = targets[0];
  let minDist = Infinity;
  for (const t of targets) {
    const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, t.x, t.y);
    if (d < minDist) {
      minDist = d;
      nearest = t;
    }
  }
  return nearest;
}

function applyKnockback(target: Unit, fromX: number, fromY: number, force: number): void {
  const angle = Phaser.Math.Angle.Between(fromX, fromY, target.x, target.y);
  target.body.setVelocity(Math.cos(angle) * force, Math.sin(angle) * force);
}

function updateScout(enemy: EnemyUnit, ctx: EnemyAIContext): void {
  const { commander, companion, enemies, now } = ctx;
  if (!commander.isAlive) return;

  if (isCommittedToTarget(enemy, commander, now)) {
    runCommittedExchange(enemy, commander, now);
    return;
  }

  if (ensureContestPressure(enemy, ctx, now)) return;

  const alliesNearby = countAlliesNear(enemy, enemies, ENEMY_AI.scoutIsolationRadius);
  if (alliesNearby < ENEMY_AI.scoutAllyCountToHold) {
    const anchor = getFrontlineAnchor(enemies);
    const fallback = getFightCentroid(ctx);
    const rally = anchor ?? fallback;
    const distToRally = Phaser.Math.Distance.Between(enemy.x, enemy.y, rally.x, rally.y);
    if (distToRally > 50) {
      moveToward(enemy, rally.x, rally.y, 0.95);
    } else {
      paceWhileWaiting(enemy, commander, now, 'creep');
    }
    return;
  }

  const distToCommander = Phaser.Math.Distance.Between(enemy.x, enemy.y, commander.x, commander.y);
  const inAttackRange = distToCommander <= enemy.attackRange;

  if (companion.isAlive && !inAttackRange) {
    const companionDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, companion.x, companion.y);
    if (companionDist < ENEMY_AI.scoutEvasiveRange) {
      fleeFrom(enemy, companion.x, companion.y, 1.2);
      return;
    }
  }

  if (inAttackRange || distToCommander <= enemy.attackRange * 2.5) {
    runCommittedExchange(enemy, commander, now);
    return;
  }

  const flankPoint = getFlankPoint(commander, companion);
  moveToward(enemy, flankPoint.x, flankPoint.y, 1.05);
}

function getFlankPoint(commander: Commander, companion: Companion): { x: number; y: number } {
  const angle = Phaser.Math.Angle.Between(companion.x, companion.y, commander.x, commander.y);
  const perp = angle + Math.PI / 2;
  return {
    x: commander.x + Math.cos(perp) * ENEMY_AI.scoutFlankOffset,
    y: commander.y + Math.sin(perp) * ENEMY_AI.scoutFlankOffset,
  };
}

function updateArcher(enemy: EnemyUnit, ctx: EnemyAIContext): void {
  const cluster = pickClusterTarget(ctx);
  if (!cluster) return;

  if (runCommittedRangedExchange(enemy, cluster, ctx.now, ENEMY_AI.archerPreferredMaxRange)) {
    return;
  }

  if (ensureContestPressure(enemy, ctx, ctx.now)) return;

  const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, cluster.x, cluster.y);
  const nearestThreat = getNearestPlayerUnit(enemy, ctx);
  const threatDist = nearestThreat
    ? Phaser.Math.Distance.Between(enemy.x, enemy.y, nearestThreat.x, nearestThreat.y)
    : Infinity;

  if (threatDist < ENEMY_AI.archerFleeRange && nearestThreat) {
    fleeFrom(enemy, nearestThreat.x, nearestThreat.y);
    return;
  }

  if (dist < ENEMY_AI.archerPreferredMinRange) {
    fleeFrom(enemy, cluster.x, cluster.y);
    return;
  }

  if (dist > ENEMY_AI.archerPreferredMaxRange) {
    const anchor = getFrontlineAnchor(ctx.enemies);
    if (anchor) moveToward(enemy, anchor.x, anchor.y, 0.7);
    else moveToward(enemy, cluster.x, cluster.y, 0.65);
    return;
  }

  beginExchangeCommit(enemy, cluster, ctx.now);
  moveToward(enemy, cluster.x, cluster.y, COMBAT.commitApproachSpeedMult);
}

function updateBruiser(enemy: EnemyUnit, ctx: EnemyAIContext): void {
  const target = pickTarget(enemy, ctx);
  const onHit = target
    ? () => applyKnockback(target, enemy.x, enemy.y, ENEMY_AI.bruiserKnockbackForce)
    : undefined;

  if (target && isCommittedToTarget(enemy, target, ctx.now)) {
    runCommittedExchange(enemy, target, ctx.now, onHit);
    return;
  }

  if (ensureContestPressure(enemy, ctx, ctx.now)) return;

  const guardPoint = getBruiserGuardPoint(enemy, ctx);
  if (guardPoint) {
    const distToGuard = Phaser.Math.Distance.Between(enemy.x, enemy.y, guardPoint.x, guardPoint.y);
    const threat = getNearestPlayerUnit(enemy, ctx);
    if (threat && distToGuard > 35) {
      const midX = (threat.x + guardPoint.x) / 2;
      const midY = (threat.y + guardPoint.y) / 2;
      moveToward(enemy, midX, midY, 0.9);
    } else if (threat) {
      paceWhileWaiting(enemy, threat, ctx.now, 'creep');
    }
  }

  if (!target) return;
  runCommittedExchange(enemy, target, ctx.now, onHit);
}

function getBruiserGuardPoint(
  enemy: EnemyUnit,
  ctx: EnemyAIContext,
): { x: number; y: number } | null {
  const rangedAllies = [
    ...getEnemiesByRole(ctx.enemies, 'archer'),
    ...getEnemiesByRole(ctx.enemies, 'support'),
    ...getEnemiesByRole(ctx.enemies, 'siege'),
  ].filter((a) => a.id !== enemy.id);

  if (rangedAllies.length === 0) return null;

  let nearestRanged = rangedAllies[0];
  let minDist = Infinity;
  for (const ally of rangedAllies) {
    const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, ally.x, ally.y);
    if (d < minDist) {
      minDist = d;
      nearestRanged = ally;
    }
  }

  if (minDist > ENEMY_AI.bruiserGuardRadius) return null;

  const threat = getNearestPlayerUnit(enemy, ctx);
  if (!threat) return { x: nearestRanged.x, y: nearestRanged.y };

  const angle = Phaser.Math.Angle.Between(threat.x, threat.y, nearestRanged.x, nearestRanged.y);
  return {
    x: nearestRanged.x + Math.cos(angle) * 40,
    y: nearestRanged.y + Math.sin(angle) * 40,
  };
}

function updateSupport(enemy: EnemyUnit, ctx: EnemyAIContext): void {
  if (ensureContestPressure(enemy, ctx, ctx.now)) return;

  const threat = getNearestPlayerUnit(enemy, ctx);
  if (threat) {
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, threat.x, threat.y);
    if (dist < ENEMY_AI.supportFleeRange) {
      fleeFrom(enemy, threat.x, threat.y);
      return;
    }
  }

  const anchor = getFrontlineAnchor(ctx.enemies) ?? getFightCentroid(ctx);
  const behind = getBehindPoint(anchor, ctx.commander.x, ctx.commander.y, 70);
  const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, behind.x, behind.y);

  if (dist > 25) {
    moveToward(enemy, behind.x, behind.y, 0.75);
  } else {
    paceWhileWaiting(enemy, anchor, ctx.now, 'orbit');
  }

  if (ctx.now - enemy.lastSupportActionAt >= ENEMY_AI.supportHealIntervalMs) {
    const wounded = findWoundedAlly(enemy, ctx);
    if (wounded) {
      wounded.heal(ENEMY_AI.supportHealAmount);
      enemy.lastSupportActionAt = ctx.now;
      showHealPulse(enemy.sprite.scene, wounded.x, wounded.y);
    }
  }
}

function findWoundedAlly(enemy: EnemyUnit, ctx: EnemyAIContext): EnemyUnit | null {
  let mostWounded: EnemyUnit | null = null;
  let lowestPct = 0.95;

  for (const ally of getAliveEnemies(ctx.enemies)) {
    if (ally.id === enemy.id || ally.role === 'support') continue;
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, ally.x, ally.y);
    if (dist > ENEMY_AI.supportHealRadius) continue;
    const pct = ally.health / ally.maxHealth;
    if (pct < lowestPct) {
      lowestPct = pct;
      mostWounded = ally;
    }
  }
  return mostWounded;
}

function getBehindPoint(
  front: { x: number; y: number },
  towardX: number,
  towardY: number,
  offset: number,
): { x: number; y: number } {
  const angle = Phaser.Math.Angle.Between(towardX, towardY, front.x, front.y);
  return {
    x: front.x + Math.cos(angle) * offset,
    y: front.y + Math.sin(angle) * offset,
  };
}

function updateAssassin(enemy: EnemyUnit, ctx: EnemyAIContext): void {
  const { commander, companion, now } = ctx;
  if (!commander.isAlive) return;

  if (enemy.id === ctx.focusEnemyId && companion.isAlive) {
    runCommittedExchange(enemy, companion, now);
    return;
  }

  if (isCommittedToTarget(enemy, commander, now)) {
    if (enemy.assassinState === 'telegraphing' || enemy.assassinState === 'dashing') {
      updateAssassinStrike(enemy, commander, now);
      return;
    }
  }

  if (enemy.assassinState === 'escaping') {
    if (now < enemy.assassinEscapeUntil) {
      fleeFrom(enemy, commander.x, commander.y, ENEMY_AI.assassinEscapeSpeedMultiplier);
      return;
    }
    enemy.assassinState = 'stalking';
  }

  if (enemy.assassinState === 'stalking') {
    const distToCommander = Phaser.Math.Distance.Between(enemy.x, enemy.y, commander.x, commander.y);
    if (distToCommander <= ENEMY_AI.assassinStalkRange) {
      enemy.assassinState = 'telegraphing';
      enemy.assassinTelegraphUntil = now + ENEMY_AI.assassinTelegraphMs;
      beginExchangeCommit(enemy, commander, now);
    } else {
      const orbitAngle = Phaser.Math.Angle.Between(commander.x, commander.y, enemy.x, enemy.y);
      const orbitX = commander.x + Math.cos(orbitAngle) * ENEMY_AI.assassinStalkRange;
      const orbitY = commander.y + Math.sin(orbitAngle) * ENEMY_AI.assassinStalkRange;
      moveToward(enemy, orbitX, orbitY, 0.8);
      enemy.setTelegraphTarget(commander.x, commander.y, false);
      return;
    }
  }

  updateAssassinStrike(enemy, commander, now);
}

function updateAssassinStrike(enemy: EnemyUnit, commander: Commander, now: number): void {
  if (enemy.assassinState === 'telegraphing') {
    paceWhileWaiting(enemy, commander, now, 'creep');
    enemy.setTelegraphTarget(commander.x, commander.y, true);
    if (now >= enemy.assassinTelegraphUntil) {
      enemy.assassinState = 'dashing';
      enemy.setTelegraphTarget(commander.x, commander.y, false);
    }
    return;
  }

  if (enemy.assassinState === 'dashing') {
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, commander.x, commander.y);
    if (dist <= enemy.attackRange) {
      if (enemy.canAttack(now)) {
        enemy.stop();
        if (enemy.tryAttack(commander, now)) {
          extendExchangeCommit(enemy, now);
          enemy.assassinState = 'escaping';
          enemy.assassinEscapeUntil = now + ENEMY_AI.assassinEscapeDurationMs;
        }
      } else {
        paceWhileWaiting(enemy, commander, now, 'creep');
      }
      return;
    }
    moveToward(enemy, commander.x, commander.y, ENEMY_AI.assassinDashSpeedMultiplier);
  }
}

function updateSiege(enemy: EnemyUnit, ctx: EnemyAIContext): void {
  const targetPoint = pickSiegeTarget(ctx);

  if (enemy.isShellCommitted(ctx.now) && enemy.shellCommitPoint) {
    runSiegeShellExchange(enemy, enemy.shellCommitPoint, ctx);
    return;
  }

  if (ensureContestPressure(enemy, ctx, ctx.now)) return;

  const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, targetPoint.x, targetPoint.y);
  const nearestThreat = getNearestPlayerUnit(enemy, ctx);

  if (nearestThreat && !enemy.isShellCommitted(ctx.now)) {
    const threatDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, nearestThreat.x, nearestThreat.y);
    if (threatDist < 80) {
      fleeFrom(enemy, nearestThreat.x, nearestThreat.y, 0.75);
      return;
    }
  }

  if (dist > ENEMY_AI.siegePreferredRange) {
    const anchor = getFrontlineAnchor(ctx.enemies);
    if (anchor) moveToward(enemy, anchor.x, anchor.y, 0.6);
    else moveToward(enemy, targetPoint.x, targetPoint.y, 0.55);
    return;
  }

  if (dist < ENEMY_AI.siegePreferredRange - 40) {
    fleeFrom(enemy, targetPoint.x, targetPoint.y, 0.65);
    return;
  }

  enemy.beginShellCommit(ctx.now, targetPoint, COMBAT.shellCommitMs);
  runSiegeShellExchange(enemy, targetPoint, ctx);
}

function runSiegeShellExchange(
  enemy: EnemyUnit,
  targetPoint: { x: number; y: number },
  ctx: EnemyAIContext,
): void {
  enemy.faceToward(targetPoint.x, targetPoint.y);
  if (enemy.canAttack(ctx.now)) {
    enemy.stop();
    enemy.lastAttackTime = ctx.now;
    shellTargetPoint(enemy, targetPoint, ctx);
    showShellImpact(enemy.sprite.scene, targetPoint.x, targetPoint.y);
    enemy.beginShellCommit(ctx.now, targetPoint, COMBAT.shellCommitMs);
  } else {
    paceWhileWaiting(enemy, targetPoint, ctx.now, 'orbit');
  }
}

function pickSiegeTarget(ctx: EnemyAIContext): { x: number; y: number } {
  if (ctx.controlPoints.length > 0) {
    return ctx.controlPoints[0];
  }

  const { companion } = ctx;
  if (companion.isAlive && companion.ironWallHolding) {
    return { x: companion.x, y: companion.y };
  }

  return getFightCentroid(ctx);
}

function shellTargetPoint(
  enemy: EnemyUnit,
  point: { x: number; y: number },
  ctx: EnemyAIContext,
): void {
  const units: Unit[] = [];
  if (ctx.commander.isAlive) units.push(ctx.commander);
  if (ctx.companion.isAlive) units.push(ctx.companion);

  for (const unit of units) {
    const dist = Phaser.Math.Distance.Between(point.x, point.y, unit.x, unit.y);
    if (dist <= ENEMY_AI.siegeShellRadius) {
      unit.takeDamage(enemy.attackDamage);
    }
  }
}

function updateBoss(enemy: EnemyUnit, ctx: EnemyAIContext): void {
  const { now, onBossSummon } = ctx;

  if (now - enemy.lastBossSummonAt >= ENEMY_AI.bossSummonCooldownMs) {
    enemy.lastBossSummonAt = now;
    const count = enemy.bossPhase === 3 ? 2 : 1;
    onBossSummon(enemy.bossPhase >= 2 ? 'scout' : 'assassin', count);
  }

  const target = pickTarget(enemy, ctx);
  if (target && isCommittedToTarget(enemy, target, now)) {
    runCommittedExchange(enemy, target, now);
    return;
  }

  if (enemy.bossPhase >= 3 && now - enemy.lastBossChargeAt >= ENEMY_AI.bossChargeCooldownMs) {
    enemy.lastBossChargeAt = now;
    if (ctx.commander.isAlive) {
      beginExchangeCommit(enemy, ctx.commander, now);
      moveToward(enemy, ctx.commander.x, ctx.commander.y, 2.2);
      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, ctx.commander.x, ctx.commander.y);
      if (dist <= enemy.attackRange) {
        runCommittedExchange(enemy, ctx.commander, now);
      }
      return;
    }
  }

  if (enemy.bossPhase === 2) {
    const anchor = getFrontlineAnchor(ctx.enemies) ?? getFightCentroid(ctx);
    const behind = getBehindPoint(anchor, ctx.commander.x, ctx.commander.y, 50);
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, behind.x, behind.y);
    if (dist > 40) {
      moveToward(enemy, behind.x, behind.y, 0.55);
      return;
    }
    paceWhileWaiting(enemy, anchor, now, 'orbit');
    return;
  }

  if (!target) return;
  runCommittedExchange(enemy, target, now);
}

function pickClusterTarget(ctx: EnemyAIContext): Unit | null {
  const { commander, companion } = ctx;
  if (!commander.isAlive && !companion.isAlive) return null;
  if (commander.isAlive && companion.isAlive) {
    const dist = Phaser.Math.Distance.Between(commander.x, commander.y, companion.x, companion.y);
    if (dist < 100) return commander;
  }
  return commander.isAlive ? commander : companion;
}

function getNearestPlayerUnit(enemy: EnemyUnit, ctx: EnemyAIContext): Unit | null {
  const units: Unit[] = [];
  if (ctx.commander.isAlive) units.push(ctx.commander);
  if (ctx.companion.isAlive) units.push(ctx.companion);
  let nearest: Unit | null = null;
  let min = Infinity;
  for (const u of units) {
    const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, u.x, u.y);
    if (d < min) {
      min = d;
      nearest = u;
    }
  }
  return nearest;
}
