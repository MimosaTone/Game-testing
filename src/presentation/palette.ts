/** Ink March palette — leadership, connection, pressure */
export const PALETTE = {
  parchment: 0xe8dcc8,
  marchDust: 0x3d3830,
  scoredInk: 0x2a2620,
  duskBlue: 0x4a5a6b,

  bondAmber: 0xd4a054,
  sealBronze: 0x8b6914,
  bondFray: 0xc9b896,
  bondBroken: 0x6b6560,

  commanderFill: 0x5a6b7a,
  commanderCrest: 0x8b6914,
  oathboundFill: 0x8b6914,
  oathboundCrest: 0xd4a054,

  orderHold: 0x5a6b7a,
  orderAttack: 0xc45c3e,
  orderDefend: 0x4a5a6b,
  orderRally: 0xd4a054,
  orderFocus: 0xd4a054,

  assassinViolet: 0x5c3a6e,
  focusGold: 0xf0d080,
  healWrong: 0x4a6b5a,
  pressureRing: 0x4a5a6b,
} as const;

export const ORDER_COLORS: Record<string, number> = {
  hold: PALETTE.orderHold,
  attack: PALETTE.orderAttack,
  defend: PALETTE.orderDefend,
  rally_point: PALETTE.orderRally,
  focus_target: PALETTE.orderFocus,
};
