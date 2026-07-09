/**
 * Economy balance — tune progression feel here.
 * Generous early game, strong farm ROI, late-game snowball from smart investment.
 */
export const ECONOMY_CONFIG = {
  startingGold: 180,
  startingLives: 25,

  /** Bonus gold awarded when a wave is cleared. */
  waveClearBonus(waveNumber) {
    return 25 + waveNumber * 12;
  },

  /**
   * Each additional Sunpatch boosts total farm income.
   * Encourages long-term economic growth over all-in on towers.
   */
  farmNetworkBonus: 0.12,

  /**
   * Farm income scales with waves survived — rewards players who invest early
   * and creates a satisfying late-game snowball.
   */
  incomeWaveScaling: 0.035,

  /** Rounds displayed payback estimate up to this many waves. */
  maxPaybackDisplay: 99,
};

/** Calculate total farm income with network and wave scaling bonuses. */
export function calculateFarmIncome(farms, waveNumber, prestigeMods = null) {
  if (farms.length === 0) return 0;

  const base = farms.reduce((sum, farm) => sum + farm.getBaseIncome(), 0);
  const networkMult = 1 + ECONOMY_CONFIG.farmNetworkBonus * (farms.length - 1);
  const waveMult = 1 + waveNumber * ECONOMY_CONFIG.incomeWaveScaling;
  const prestigeMult = prestigeMods?.farmIncomeMult ?? 1;

  return Math.round(base * networkMult * waveMult * prestigeMult);
}

/** Estimate how many waves until an investment pays for itself. */
export function estimatePaybackWaves(cost, incomePerWave) {
  if (incomePerWave <= 0) return null;
  const waves = Math.ceil(cost / incomePerWave);
  return Math.min(waves, ECONOMY_CONFIG.maxPaybackDisplay);
}
