export type EnemyRole =
  | 'scout'
  | 'archer'
  | 'bruiser'
  | 'support'
  | 'assassin'
  | 'siege'
  | 'boss';

export interface EnemyRoleDefinition {
  role: EnemyRole;
  label: string;
  color: number;
  radius: number;
  maxHealth: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  speed: number;
  /** What decision this role forces — shown in design doc / debug */
  forcesDecision: string;
}

export interface SquadSpawn {
  role: EnemyRole;
  count: number;
}

export interface EncounterPhase {
  id: string;
  delayMs: number;
  squads: SquadSpawn[];
  spawnBoss?: boolean;
  announcement?: string;
}

export interface BattlefieldControlPoint {
  x: number;
  y: number;
  kind: 'rally' | 'hold';
}
