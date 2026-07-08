import Phaser from 'phaser';
import type { Commander, Companion, Unit } from '../entities/Unit';
import { ENEMY_AI } from './definitions';
import type { EnemyUnit } from './EnemyUnit';
import { getAliveEnemies, getEnemiesByRole, getFrontlineAnchor } from './EnemyUnit';

export interface EnemyAIContext {
  commander: Commander;
  companion: Companion;
  enemies: EnemyUnit[];
  focusEnemyId: string | null;
  now: number;
  onBossSummon: (role: 'grunt' | 'scout', count: number) => void;
}

export function updateEnemyAI(enemy: EnemyUnit, ctx: EnemyAIContext): void {
  if (!enemy.isAlive) return;

  applySupportBuffs(ctx);
  if (enemy.isBoss) enemy.updateBossPhase();

  switch (enemy.role) {
    case 'grunt':
      updateGrunt(enemy, ctx);
      break;
    case 'archer':
      updateArcher(enemy, ctx);
      break;
    case 'bruiser':
      updateBruiser(enemy, ctx);
      break;
    case 'scout':
      updateScout(enemy, ctx);
      break;
    case 'support':
      updateSupport(enemy, ctx);
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

function pickTarget(
  enemy: EnemyUnit,
  ctx: EnemyAIContext,
  preferCommander = false,
): Unit | null {
  const { commander, companion, focusEnemyId } = ctx;

  if (enemy.id === focusEnemyId && companion.isAlive) {
    return companion;
  }

  if (preferCommander && commander.isAlive) {
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, commander.x, commander.y);
    if (dist <= ENEMY_AI.gruntCommanderPriorityRange) return commander;
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

function moveToward(enemy: EnemyUnit, x: number, y: number, speedMult = 1): void {
  const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, x, y);
  const speed = enemy.effectiveSpeed * speedMult;
  enemy.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
}

function fleeFrom(enemy: EnemyUnit, x: number, y: number): void {
  const angle = Phaser.Math.Angle.Between(x, y, enemy.x, enemy.y);
  const speed = enemy.effectiveSpeed * 1.1;
  enemy.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
}

function tryCombat(
  enemy: EnemyUnit,
  target: Unit,
  now: number,
  onHit?: () => void,
): void {
  const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
  if (dist <= enemy.attackRange) {
    enemy.stop();
    if (enemy.tryAttack(target, now) && onHit) onHit();
  } else {
    moveToward(enemy, target.x, target.y);
  }
}

function applyKnockback(target: Unit, fromX: number, fromY: number, force: number): void {
  const angle = Phaser.Math.Angle.Between(fromX, fromY, target.x, target.y);
  target.body.setVelocity(Math.cos(angle) * force, Math.sin(angle) * force);
}

function updateGrunt(enemy: EnemyUnit, ctx: EnemyAIContext): void {
  const target = pickTarget(enemy, ctx, true);
  if (!target) return;
  tryCombat(enemy, target, ctx.now);
}

function updateArcher(enemy: EnemyUnit, ctx: EnemyAIContext): void {
  const cluster = pickClusterTarget(ctx);
  if (!cluster) return;

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
    if (anchor) moveToward(enemy, anchor.x, anchor.y, 0.6);
    else moveToward(enemy, cluster.x, cluster.y, 0.5);
    return;
  }

  enemy.stop();
  enemy.tryAttack(cluster, ctx.now);
}

function updateBruiser(enemy: EnemyUnit, ctx: EnemyAIContext): void {
  const target = pickTarget(enemy, ctx);
  if (!target) return;
  tryCombat(enemy, target, ctx.now, () => {
    applyKnockback(target, enemy.x, enemy.y, ENEMY_AI.bruiserKnockbackForce);
  });
}

function updateScout(enemy: EnemyUnit, ctx: EnemyAIContext): void {
  const { commander, companion } = ctx;
  if (!commander.isAlive) return;

  const flankPoint = getFlankPoint(commander, companion);
  const distToCommander = Phaser.Math.Distance.Between(enemy.x, enemy.y, commander.x, commander.y);

  if (distToCommander <= enemy.attackRange) {
    enemy.stop();
    enemy.tryAttack(commander, ctx.now);
    return;
  }

  moveToward(enemy, flankPoint.x, flankPoint.y);
}

function getFlankPoint(commander: Commander, companion: Companion): { x: number; y: number } {
  const angle = Phaser.Math.Angle.Between(companion.x, companion.y, commander.x, commander.y);
  const perp = angle + Math.PI / 2;
  return {
    x: commander.x + Math.cos(perp) * ENEMY_AI.scoutFlankOffset,
    y: commander.y + Math.sin(perp) * ENEMY_AI.scoutFlankOffset,
  };
}

function updateSupport(enemy: EnemyUnit, ctx: EnemyAIContext): void {
  const threat = getNearestPlayerUnit(enemy, ctx);
  if (threat) {
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, threat.x, threat.y);
    if (dist < ENEMY_AI.supportFleeRange) {
      fleeFrom(enemy, threat.x, threat.y);
      return;
    }
  }

  const anchor = getFrontlineAnchor(ctx.enemies);
  if (anchor) {
    const behind = getBehindPoint(anchor, ctx.commander.x, ctx.commander.y, 70);
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, behind.x, behind.y);
    if (dist > 25) {
      moveToward(enemy, behind.x, behind.y, 0.7);
    } else {
      enemy.stop();
    }
  }

  if (ctx.now - enemy.lastSupportBuffAt >= ENEMY_AI.supportBuffIntervalMs) {
    enemy.lastSupportBuffAt = ctx.now;
  }
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

function updateBoss(enemy: EnemyUnit, ctx: EnemyAIContext): void {
  const { now, onBossSummon } = ctx;

  if (now - enemy.lastBossSummonAt >= ENEMY_AI.bossSummonCooldownMs) {
    enemy.lastBossSummonAt = now;
    const count = enemy.bossPhase === 3 ? 2 : 1;
    onBossSummon(enemy.bossPhase >= 2 ? 'scout' : 'grunt', count);
  }

  if (enemy.bossPhase >= 3 && now - enemy.lastBossChargeAt >= ENEMY_AI.bossChargeCooldownMs) {
    enemy.lastBossChargeAt = now;
    if (ctx.commander.isAlive) {
      moveToward(enemy, ctx.commander.x, ctx.commander.y, 2.2);
      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, ctx.commander.x, ctx.commander.y);
      if (dist <= enemy.attackRange) {
        enemy.stop();
        enemy.tryAttack(ctx.commander, now);
      }
      return;
    }
  }

  if (enemy.bossPhase === 2) {
    const anchor = getFrontlineAnchor(ctx.enemies);
    if (anchor) {
      const behind = getBehindPoint(anchor, ctx.commander.x, ctx.commander.y, 50);
      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, behind.x, behind.y);
      if (dist > 40) {
        moveToward(enemy, behind.x, behind.y, 0.5);
        return;
      }
      enemy.stop();
      return;
    }
  }

  const target = pickTarget(enemy, ctx, enemy.bossPhase === 1);
  if (!target) return;
  tryCombat(enemy, target, now);
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
