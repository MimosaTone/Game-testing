import Phaser from 'phaser';
import type { Commander, Companion } from '../entities/Unit';
import type { EnemyUnit } from '../enemies/EnemyUnit';
import { getEnemiesByRole } from '../enemies/EnemyUnit';

export type CompanionIntent =
  | 'guarding'
  | 'screening'
  | 'intercepting'
  | 'pursuing'
  | 'holding'
  | 'rallying'
  | 'focusing'
  | 'returning'
  | 'fighting_alone';

export const INTENT_LABELS: Record<CompanionIntent, string> = {
  guarding: 'Watching your back',
  screening: 'Screening threats',
  intercepting: 'Moving to intercept',
  pursuing: 'Pressuring the line',
  holding: 'Holding ground',
  rallying: 'Regrouping',
  focusing: 'On your mark',
  returning: 'Coming back to you',
  fighting_alone: 'Fighting without orders',
};

export interface ThreatAssessment {
  /** Primary threat to Commander */
  commanderThreat: EnemyUnit | null;
  /** Assassin actively telegraphing or dashing */
  assassinUrgent: EnemyUnit | null;
  /** Scout or flanker pressuring Commander */
  flankThreat: EnemyUnit | null;
  /** Support healing — worth calling out */
  supportActive: EnemyUnit | null;
}

export function assessThreats(
  commander: Commander,
  companion: Companion,
  enemies: EnemyUnit[],
): ThreatAssessment {
  let commanderThreat: EnemyUnit | null = null;
  let minThreatDist = Infinity;

  let assassinUrgent: EnemyUnit | null = null;
  let flankThreat: EnemyUnit | null = null;

  for (const enemy of enemies) {
    if (!enemy.isAlive) continue;

    const toCommander = Phaser.Math.Distance.Between(
      enemy.x, enemy.y, commander.x, commander.y,
    );

    if (toCommander < minThreatDist) {
      minThreatDist = toCommander;
      commanderThreat = enemy;
    }

    if (enemy.role === 'assassin') {
      if (
        enemy.assassinState === 'telegraphing' ||
        enemy.assassinState === 'dashing'
      ) {
        assassinUrgent = enemy;
      }
    }

    if (enemy.role === 'scout' && toCommander < 140) {
      const companionDist = Phaser.Math.Distance.Between(
        companion.x, companion.y, enemy.x, enemy.y,
      );
      if (companionDist > 80) {
        flankThreat = enemy;
      }
    }
  }

  const supports = getEnemiesByRole(enemies, 'support');
  const supportActive = supports.find((s) => s.isAlive) ?? null;

  return { commanderThreat, assassinUrgent, flankThreat, supportActive };
}

/** Ideal position: between Commander and primary threat */
export function computeScreenPosition(
  commander: Commander,
  threat: EnemyUnit | null,
  screenOffset: number,
): { x: number; y: number } {
  if (!threat) {
    return { x: commander.x, y: commander.y + screenOffset * 0.5 };
  }

  const angle = Phaser.Math.Angle.Between(threat.x, threat.y, commander.x, commander.y);
  return {
    x: commander.x + Math.cos(angle) * screenOffset,
    y: commander.y + Math.sin(angle) * screenOffset,
  };
}
