import type { DoctrineId } from '../doctrine/types';
import type { ObjectiveId } from '../objectives/types';

export interface RunConfig {
  commanderId: 'elite_bond';
  doctrineId: DoctrineId;
  objectiveId: ObjectiveId;
  gameMode: 'standard';
}

export const DEFAULT_RUN_CONFIG: RunConfig = {
  commanderId: 'elite_bond',
  doctrineId: 'shock_assault',
  objectiveId: 'survival',
  gameMode: 'standard',
};
