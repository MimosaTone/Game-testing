/** Legendary tower upgrades — expensive wave-gated capstones that change behavior. */
export const LEGENDARY_UNLOCK_WAVE = 20;

export const LEGENDARY_UPGRADES = {
  needle: {
    id: 'needle_legendary',
    towerType: 'needle',
    name: 'Arrow Storm',
    description: 'Fires 3 arrows; each ricochets to 2 nearby foes.',
    cost: 1200,
    effects: { projectileCount: 3, chainCount: 2, damageMult: 1.15 },
  },
  boulder: {
    id: 'boulder_legendary',
    towerType: 'boulder',
    name: 'Inferno Cannon',
    description: 'Massive explosions leave burning ground for 4s.',
    cost: 1400,
    effects: {
      damageMult: 1.5,
      splashRadiusMult: 1.8,
      burnDPS: 12,
      burnDuration: 4,
      groundBurn: true,
    },
  },
  prism: {
    id: 'prism_legendary',
    towerType: 'prism',
    name: 'Chain Lightning',
    description: 'Arcane bolts chain through 5 enemies.',
    cost: 1300,
    effects: { chainCount: 5, damageMult: 1.25, projectileSpeedMult: 1.3 },
  },
  gust: {
    id: 'gust_legendary',
    towerType: 'gust',
    name: 'Blizzard Aura',
    description: 'Freezes foes (70% slow) in range; aura radius +40%.',
    cost: 1250,
    effects: { auraSlow: 0.7, rangeMult: 1.4, damageMult: 1.2 },
  },
  ember: {
    id: 'ember_legendary',
    towerType: 'ember',
    name: 'Meteor Hearth',
    description: 'Burns ignore armor and spread to all nearby foes.',
    cost: 1350,
    effects: {
      burnDPS: 10,
      burnDuration: 5,
      burnIgnoresArmor: 1,
      burnSpread: 1,
      burnSpreadCount: 6,
      damageMult: 1.3,
    },
  },
};
