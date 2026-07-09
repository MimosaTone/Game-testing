/**
 * Enemy type definitions — extend this registry for new enemy varieties.
 */
export const ENEMY_TYPES = {
  grunt: {
    id: 'grunt',
    name: 'Grunt',
    color: '#e74c3c',
    shape: 'circle',
    baseHp: 40,
    speed: 55,
    goldReward: 6,
    size: 14,
  },

  runner: {
    id: 'runner',
    name: 'Runner',
    color: '#f39c12',
    shape: 'diamond',
    baseHp: 25,
    speed: 90,
    goldReward: 8,
    size: 12,
  },

  tank: {
    id: 'tank',
    name: 'Tank',
    color: '#8e44ad',
    shape: 'square',
    baseHp: 120,
    speed: 35,
    goldReward: 15,
    size: 18,
  },
};

export function getEnemyStats(typeDef, wave) {
  const waveScale = 1 + (wave - 1) * 0.12;
  return {
    maxHp: Math.floor(typeDef.baseHp * waveScale),
    speed: typeDef.speed,
    goldReward: Math.floor(typeDef.goldReward * (1 + (wave - 1) * 0.05)),
    size: typeDef.size,
  };
}
