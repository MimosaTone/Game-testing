/**
 * Farm definitions — passive income generators upgraded between waves.
 */
export const FARM_TYPE = {
  id: 'farm',
  name: 'Farm',
  description: 'Earns gold each wave',
  cost: 60,
  color: '#f1c40f',
  shape: 'farm',
  baseIncome: 15,
  incomePerLevel: 12,
  maxLevel: 8,
  upgradeCostBase: 40,
  upgradeCostScale: 1.45,
};

export function getFarmIncome(farmDef, level) {
  return farmDef.baseIncome + farmDef.incomePerLevel * (level - 1);
}

export function getFarmUpgradeCost(farmDef, level) {
  return Math.floor(farmDef.upgradeCostBase * Math.pow(farmDef.upgradeCostScale, level - 1));
}
