/** Tower type definitions — add new towers here without touching core logic. */
export const TOWER_TYPES = {
  needle: {
    id: 'needle',
    name: 'Needle Post',
    description: 'Rapid shots — reliable early defense.',
    cost: 40,
    color: '#3d9970',
    icon: '△',
    baseStats: {
      damage: 9,
      range: 3.6,
      attackSpeed: 1.3,
    },
    projectileColor: '#2ecc71',
    projectileSpeed: 13,
  },

  boulder: {
    id: 'boulder',
    name: 'Boulder Pit',
    description: 'Slow, heavy shots that splash nearby foes.',
    cost: 70,
    color: '#c0392b',
    icon: '◆',
    baseStats: {
      damage: 28,
      range: 2.9,
      attackSpeed: 0.45,
      splashRadius: 1.3,
    },
    projectileColor: '#922b21',
    projectileSpeed: 9,
  },

  prism: {
    id: 'prism',
    name: 'Prism Spire',
    description: 'Long reach and steady arcane damage.',
    cost: 55,
    color: '#6c5ce7',
    icon: '◇',
    baseStats: {
      damage: 15,
      range: 4.8,
      attackSpeed: 0.85,
    },
    projectileColor: '#a29bfe',
    projectileSpeed: 11,
  },

  gust: {
    id: 'gust',
    name: 'Gust Totem',
    description: 'Slows foes in range; upgrades add knockback.',
    cost: 58,
    unlockWave: 15,
    color: '#4db6ac',
    icon: '◎',
    baseStats: {
      damage: 6,
      range: 3.4,
      attackSpeed: 0.55,
      auraSlow: 0.22,
    },
    projectileColor: '#80cbc4',
    projectileSpeed: 10,
    isAuraTower: true,
  },

  ember: {
    id: 'ember',
    name: 'Ember Hearth',
    description: 'Burns enemies over time — strong vs armored foes.',
    cost: 62,
    unlockWave: 25,
    color: '#e65100',
    icon: '✧',
    baseStats: {
      damage: 11,
      range: 3.1,
      attackSpeed: 0.75,
      burnDPS: 5,
      burnDuration: 3,
    },
    projectileColor: '#ff7043',
    projectileSpeed: 10,
  },
};
