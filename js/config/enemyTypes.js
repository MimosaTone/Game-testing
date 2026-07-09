/** Invader definitions — meadow-themed original enemy roster. */
export const ENEMY_TYPES = {
  mote: {
    id: 'mote',
    name: 'Mote',
    color: '#7e57c2',
    baseHealth: 26,
    speed: 1.7,
    goldReward: 12,
    size: 13,
  },

  drift: {
    id: 'drift',
    name: 'Drift',
    color: '#26a69a',
    baseHealth: 16,
    speed: 3.0,
    goldReward: 15,
    size: 11,
  },

  husk: {
    id: 'husk',
    name: 'Husk',
    color: '#6d4c41',
    baseHealth: 72,
    speed: 1.0,
    goldReward: 28,
    size: 17,
  },

  titan: {
    id: 'titan',
    name: 'Titan',
    color: '#ad1457',
    baseHealth: 185,
    speed: 0.65,
    goldReward: 70,
    size: 21,
  },

  /** Late-game armored invader — rewards armor-piercing upgrades. */
  ward: {
    id: 'ward',
    name: 'Ward',
    color: '#546e7a',
    baseHealth: 55,
    speed: 1.4,
    goldReward: 35,
    size: 15,
    innateArmor: 0.2,
  },

  /** Late-game regenerator — rewards burst damage and focus fire. */
  rime: {
    id: 'rime',
    name: 'Rime',
    color: '#4fc3f7',
    baseHealth: 120,
    speed: 0.85,
    goldReward: 45,
    size: 16,
    innateRegen: 3,
  },
};
