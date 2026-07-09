/** Sunpatch — passive income structure with strong return on investment. */
export const FARM_CONFIG = {
  id: 'sunpatch',
  name: 'Sunpatch',
  description: 'Harvests gold each wave. Great long-term investment.',
  cost: 50,
  color: '#ffc857',
  icon: '✿',

  /** Base income per wave at each level (index 0 = level 1). */
  incomePerLevel: [35, 58, 95, 150, 230, 350],
  maxLevel: 6,

  /** Gold cost to upgrade to the next level. */
  upgradeCosts: [30, 55, 90, 140, 200],
};
