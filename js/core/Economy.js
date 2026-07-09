import { Events } from './EventBus.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { FARM_CONFIG } from '../config/farmConfig.js';
import {
  ECONOMY_CONFIG,
  calculateFarmIncome,
  estimatePaybackWaves,
} from '../config/economyConfig.js';

/**
 * Manages gold, passive income, and transactions.
 */
export class Economy {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.gold = GAME_CONFIG.startingGold;
    this.incomePerWave = 0;
    this.waveNumber = 0;
    this.lastWaveKillGold = 0;
  }

  setWaveNumber(waveNumber) {
    this.waveNumber = waveNumber;
  }

  canAfford(cost) {
    return this.gold >= cost;
  }

  spend(cost) {
    if (!this.canAfford(cost)) return false;
    this.gold -= cost;
    this.eventBus.emit(Events.GOLD_CHANGED, this.gold);
    return true;
  }

  earn(amount) {
    this.gold += amount;
    this.eventBus.emit(Events.GOLD_CHANGED, this.gold);
  }

  /** Recalculate total farm income including network and wave scaling bonuses. */
  recalculateIncome(farms) {
    this.incomePerWave = calculateFarmIncome(farms, this.waveNumber);
    this.eventBus.emit(Events.INCOME_CHANGED, {
      total: this.incomePerWave,
      farmCount: farms.length,
      waveBonus: this.waveNumber > 0 ? Math.round(this.waveNumber * ECONOMY_CONFIG.incomeWaveScaling * 100) : 0,
    });
  }

  /** Award farm income and wave-clear bonus at end of wave. */
  collectWaveIncome() {
    const farmIncome = this.incomePerWave;
    const waveBonus = ECONOMY_CONFIG.waveClearBonus(this.waveNumber);

    if (farmIncome > 0) this.earn(farmIncome);
    this.earn(waveBonus);

    return { farmIncome, waveBonus, killGold: this.lastWaveKillGold };
  }

  trackKillGold(amount) {
    this.lastWaveKillGold += amount;
  }

  resetWaveKillGold() {
    this.lastWaveKillGold = 0;
  }

  getUpgradeCost(structure, stat) {
    if (structure.type === 'farm') {
      const level = structure.level;
      if (level >= FARM_CONFIG.maxLevel) return null;
      return FARM_CONFIG.upgradeCosts[level - 1];
    }

    if (structure.type === 'tower') {
      const next = structure.getNextUpgrade();
      return next ? next.cost : null;
    }

    return null;
  }

  getSunpatchPayback(cost, projectedIncome) {
    return estimatePaybackWaves(cost, projectedIncome || this.incomePerWave);
  }
}
