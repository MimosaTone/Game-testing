/** Farm economy configuration. */
export const FARM_CONFIG = {
  id: 'farm',
  name: 'Farm',
  description: 'Generates passive gold each wave.',
  cost: 60,
  color: '#f1c40f',
  icon: '☘',

  /** Income per wave at each upgrade level (index 0 = level 1). */
  incomePerLevel: [15, 25, 40, 60, 90, 130],
  maxLevel: 6,

  /** Gold cost to upgrade to the next level. */
  upgradeCosts: [40, 70, 110, 160, 230],
};
