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

  /** Boss — armored colossus that spawns minions as health drops. */
  boss_briar: {
    id: 'boss_briar',
    name: 'Briar Colossus',
    color: '#2e7d32',
    baseHealth: 900,
    speed: 0.45,
    goldReward: 220,
    size: 30,
    isBoss: true,
    innateArmor: 0.2,
    bossAbility: 'spawn_minions',
  },

  /** Boss — swift sovereign with periodic speed surges. */
  boss_gale: {
    id: 'boss_gale',
    name: 'Gale Sovereign',
    color: '#00838f',
    baseHealth: 650,
    speed: 0.9,
    goldReward: 260,
    size: 28,
    isBoss: true,
    bossAbility: 'speed_surge',
  },

  /** Boss — ancient mire with powerful regeneration and shields. */
  boss_mire: {
    id: 'boss_mire',
    name: 'Mire Ancient',
    color: '#4e342e',
    baseHealth: 1100,
    speed: 0.4,
    goldReward: 320,
    size: 32,
    isBoss: true,
    innateRegen: 6,
    bossAbility: 'damage_shield',
  },
};

/** Boss types cycle every 15 waves. */
export const BOSS_ROTATION = ['boss_briar', 'boss_gale', 'boss_mire'];
