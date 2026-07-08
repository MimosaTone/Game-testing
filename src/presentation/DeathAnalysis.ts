import type { CohesionState } from '../cohesion/CohesionSystem';
import type { OrderType } from '../command/types';
import type { EnemyRole } from '../enemies/types';

export interface LeadershipContext {
  cohesionState: CohesionState;
  activeOrder: OrderType | null;
  bondActive: boolean;
  assassinActive: boolean;
  assassinDashing: boolean;
  supportAlive: boolean;
  desyncDurationMs: number;
}

export interface DeathMessage {
  headline: string;
  lesson: string;
  suggestion: string;
}

export function analyzeDeath(ctx: LeadershipContext): DeathMessage {
  if (ctx.assassinDashing || (ctx.assassinActive && !ctx.bondActive)) {
    return {
      headline: 'Command lost',
      lesson: 'The Assassin waits for separation.',
      suggestion: 'Try Defend when the Assassin commits.',
    };
  }

  if (ctx.assassinActive && ctx.activeOrder === 'attack') {
    return {
      headline: 'Command lost',
      lesson: 'Attack pulled your Oathbound away when you needed defense.',
      suggestion: 'Issue Defend when threats circle the Commander.',
    };
  }

  if (!ctx.bondActive && ctx.desyncDurationMs > 1500) {
    return {
      headline: 'You were apart when it mattered',
      lesson: 'Orders cannot reach your Oathbound across the bond.',
      suggestion: 'Stay within bond range to lead effectively.',
    };
  }

  if (ctx.supportAlive && ctx.activeOrder !== 'focus_target') {
    return {
      headline: 'Command lost',
      lesson: 'Some enemies make every other enemy stronger.',
      suggestion: 'Focus the Support before the frontline.',
    };
  }

  if (ctx.activeOrder === 'hold' && !ctx.bondActive) {
    return {
      headline: 'The line broke',
      lesson: 'You held ground but lost the bond.',
      suggestion: 'Reposition to your Oathbound before issuing Hold.',
    };
  }

  return {
    headline: 'Command lost',
    lesson: 'Leadership failed under pressure.',
    suggestion: 'Stay bonded. Mark priorities. Defend when flanked.',
  };
}

export function getWinMessage(reason: 'boss_defeated' | 'survival'): { headline: string; lesson: string } {
  if (reason === 'boss_defeated') {
    return {
      headline: 'Decisive command',
      lesson: 'You identified the Field Captain as the fight.\nYour Oathbound executed your judgment.',
    };
  }
  return {
    headline: 'Contained',
    lesson: 'You held authority under pressure until relief arrived.\nThe binding held.',
  };
}

/** Track context helpers */
export function enemyRoleIsAssassin(role: EnemyRole): boolean {
  return role === 'assassin';
}
