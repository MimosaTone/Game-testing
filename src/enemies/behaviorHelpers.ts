import Phaser from 'phaser';
import type { Commander, Companion, Unit } from '../entities/Unit';
import { ENEMY_AI } from './definitions';
import type { EnemyUnit } from './EnemyUnit';
import { getAliveEnemies } from './EnemyUnit';

export interface FightContext {
  commander: Commander;
  companion: Companion;
  enemies: EnemyUnit[];
}

/** Centroid of the active fight — where pressure should converge. */
export function getFightCentroid(ctx: FightContext): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let count = 0;

  if (ctx.commander.isAlive) {
    x += ctx.commander.x;
    y += ctx.commander.y;
    count++;
  }
  if (ctx.companion.isAlive) {
    x += ctx.companion.x;
    y += ctx.companion.y;
    count++;
  }

  if (count > 0) {
    return { x: x / count, y: y / count };
  }

  const alive = getAliveEnemies(ctx.enemies);
  if (alive.length > 0) {
    for (const e of alive) {
      x += e.x;
      y += e.y;
    }
    return { x: x / alive.length, y: y / alive.length };
  }

  return { x: 480, y: 320 };
}

export function distanceBetween(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  return Phaser.Math.Distance.Between(ax, ay, bx, by);
}

export function moveToward(
  enemy: EnemyUnit,
  x: number,
  y: number,
  speedMult = 1,
): void {
  const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, x, y);
  const speed = enemy.effectiveSpeed * speedMult;
  enemy.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  enemy.faceToward(x, y);
}

export function fleeFrom(
  enemy: EnemyUnit,
  x: number,
  y: number,
  speedMult = 1.1,
): void {
  const angle = Phaser.Math.Angle.Between(x, y, enemy.x, enemy.y);
  const speed = enemy.effectiveSpeed * speedMult;
  enemy.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
}

/**
 * If an enemy is stranded far from the fight, advance with urgency.
 * Returns true when this frame was consumed by re-engagement.
 */
export function ensureContestPressure(
  enemy: EnemyUnit,
  ctx: FightContext,
): boolean {
  const centroid = getFightCentroid(ctx);
  const dist = distanceBetween(enemy.x, enemy.y, centroid.x, centroid.y);
  if (dist <= ENEMY_AI.maxContestDistance) return false;

  moveToward(enemy, centroid.x, centroid.y, ENEMY_AI.contestAdvanceSpeedMult);
  return true;
}

export type PaceStyle = 'strafe' | 'orbit' | 'creep';

/**
 * Secondary behavior while in range but waiting on cooldown — never stand frozen.
 */
export function paceWhileWaiting(
  enemy: EnemyUnit,
  focus: { x: number; y: number },
  now: number,
  style: PaceStyle = 'strafe',
): void {
  const seed = enemy.id.charCodeAt(enemy.id.length - 1) || 0;
  const t = now * 0.002 + seed * 0.17;
  enemy.faceToward(focus.x, focus.y);

  if (style === 'creep') {
    moveToward(enemy, focus.x, focus.y, ENEMY_AI.paceCreepSpeedMult);
    return;
  }

  if (style === 'orbit') {
    const currentAngle = Phaser.Math.Angle.Between(focus.x, focus.y, enemy.x, enemy.y);
    const orbitDist = Math.max(
      30,
      distanceBetween(enemy.x, enemy.y, focus.x, focus.y),
    );
    const nextAngle = currentAngle + 0.04 * (seed % 2 === 0 ? 1 : -1);
    const ox = focus.x + Math.cos(nextAngle) * orbitDist;
    const oy = focus.y + Math.sin(nextAngle) * orbitDist;
    moveToward(enemy, ox, oy, ENEMY_AI.paceOrbitSpeedMult);
    return;
  }

  const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, focus.x, focus.y);
  const perp = angle + (Math.PI / 2) * (Math.sin(t) > 0 ? 1 : -1);
  const speed = enemy.effectiveSpeed * ENEMY_AI.paceStrafeSpeedMult;
  enemy.body.setVelocity(Math.cos(perp) * speed, Math.sin(perp) * speed);
}

export function tryCombatWithPace(
  enemy: EnemyUnit,
  target: Unit,
  now: number,
  onHit?: () => void,
): void {
  const dist = distanceBetween(enemy.x, enemy.y, target.x, target.y);
  if (dist <= enemy.attackRange) {
    if (enemy.canAttack(now)) {
      enemy.stop();
      if (enemy.tryAttack(target, now) && onHit) onHit();
    } else {
      paceWhileWaiting(enemy, target, now, 'strafe');
    }
  } else {
    moveToward(enemy, target.x, target.y);
  }
}

export function showHealPulse(scene: Phaser.Scene, x: number, y: number): void {
  const ring = scene.add.circle(x, y, 10, 0x52b788, 0.55).setDepth(6);
  scene.tweens.add({
    targets: ring,
    scaleX: 2.2,
    scaleY: 2.2,
    alpha: 0,
    duration: 420,
    onComplete: () => ring.destroy(),
  });
}

export function showShellImpact(scene: Phaser.Scene, x: number, y: number): void {
  const blast = scene.add.circle(x, y, 8, 0xc4a574, 0.7).setDepth(2);
  const ring = scene.add.circle(x, y, ENEMY_AI.siegeShellRadius, 0x8b7355, 0.25).setDepth(2);
  ring.setStrokeStyle(2, 0xc4a574, 0.6);
  scene.tweens.add({
    targets: [blast, ring],
    alpha: 0,
    scaleX: 1.35,
    scaleY: 1.35,
    duration: 380,
    onComplete: () => {
      blast.destroy();
      ring.destroy();
    },
  });
}
