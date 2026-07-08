export type OrderType = 'hold' | 'attack' | 'defend' | 'rally_point' | 'focus_target';

export type AbilityType = 'war_cry' | 'tactical_rally';

export interface OrderDefinition {
  id: OrderType;
  label: string;
  hotkey: string;
  cooldownMs: number;
  description: string;
}

export interface AbilityDefinition {
  id: AbilityType;
  label: string;
  hotkey: string;
  cpCost: number;
  cooldownMs: number;
  description: string;
}

export const ORDERS: OrderDefinition[] = [
  { id: 'hold', label: 'Hold', hotkey: '1', cooldownMs: 1500, description: 'Hold position; attack in range only' },
  { id: 'attack', label: 'Attack', hotkey: '2', cooldownMs: 1500, description: 'Pursue and engage enemies' },
  { id: 'defend', label: 'Defend', hotkey: '3', cooldownMs: 2000, description: 'Protect the commander' },
  { id: 'rally_point', label: 'Rally', hotkey: '4', cooldownMs: 2000, description: 'Move to rally point and hold' },
  { id: 'focus_target', label: 'Focus', hotkey: '5', cooldownMs: 2000, description: 'Prioritize marked enemy' },
];

export const ABILITIES: AbilityDefinition[] = [
  {
    id: 'war_cry',
    label: 'War Cry',
    hotkey: 'Q',
    cpCost: 2,
    cooldownMs: 0,
    description: '+25% army damage for 6s',
  },
  {
    id: 'tactical_rally',
    label: 'Tactical Rally',
    hotkey: 'E',
    cpCost: 1,
    cooldownMs: 20_000,
    description: 'Regroup at commander with damage reduction',
  },
];

export function getOrder(id: OrderType): OrderDefinition {
  const order = ORDERS.find((o) => o.id === id);
  if (!order) throw new Error(`Unknown order: ${id}`);
  return order;
}

export function getAbility(id: AbilityType): AbilityDefinition {
  const ability = ABILITIES.find((a) => a.id === id);
  if (!ability) throw new Error(`Unknown ability: ${id}`);
  return ability;
}
