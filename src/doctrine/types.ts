export type DoctrineId = 'shock_assault' | 'iron_wall';

export interface DoctrineDefinition {
  id: DoctrineId;
  name: string;
  tagline: string;
  strength: string;
  limitation: string;
  signatureOrder: string;
  isOrderAvailable(orderId: string): boolean;
}

export const DOCTRINES: DoctrineDefinition[] = [
  {
    id: 'shock_assault',
    name: 'Shock Assault',
    tagline: 'Burst elimination through focus fire',
    strength: 'Focus Fire: marked targets take +50% attack speed for 5s',
    limitation: 'Defend order effectiveness reduced 30%',
    signatureOrder: 'Focus Target',
    isOrderAvailable: (_orderId) => true,
  },
  {
    id: 'iron_wall',
    name: 'Iron Wall',
    tagline: 'Immovable defense at any cost',
    strength: 'Hold Position: DR while holding; cannot be forced to retreat',
    limitation: 'Attack order disabled; movement speed −20%',
    signatureOrder: 'Hold',
    isOrderAvailable: (orderId) => orderId !== 'attack',
  },
];

export function getDoctrine(id: DoctrineId): DoctrineDefinition {
  const doctrine = DOCTRINES.find((d) => d.id === id);
  if (!doctrine) throw new Error(`Unknown doctrine: ${id}`);
  return doctrine;
}
