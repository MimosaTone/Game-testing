export type ObjectiveId = 'survival';

export interface ObjectiveDefinition {
  id: ObjectiveId;
  name: string;
  tagline: string;
  durationMs?: number;
}

export const OBJECTIVES: ObjectiveDefinition[] = [
  {
    id: 'survival',
    name: 'Command Trial',
    tagline: 'Lead your Oathbound under pressure',
    durationMs: 90_000,
  },
];

export function getObjective(id: ObjectiveId): ObjectiveDefinition {
  const objective = OBJECTIVES.find((o) => o.id === id);
  if (!objective) throw new Error(`Unknown objective: ${id}`);
  return objective;
}
