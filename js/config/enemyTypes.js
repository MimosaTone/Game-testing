/** Enemy type definitions — register new types here for wave scaling. */
export const ENEMY_TYPES = {
  grunt: {
    id: 'grunt',
    name: 'Grunt',
    color: '#e67e22',
    baseHealth: 30,
    speed: 1.8,
    goldReward: 8,
    size: 14,
  },

  runner: {
    id: 'runner',
    name: 'Runner',
    color: '#f39c12',
    baseHealth: 18,
    speed: 3.2,
    goldReward: 10,
    size: 12,
  },

  tank: {
    id: 'tank',
    name: 'Tank',
    color: '#d35400',
    baseHealth: 80,
    speed: 1.0,
    goldReward: 20,
    size: 18,
  },

  boss: {
    id: 'boss',
    name: 'Boss',
    color: '#c0392b',
    baseHealth: 200,
    speed: 0.7,
    goldReward: 50,
    size: 22,
  },
};
