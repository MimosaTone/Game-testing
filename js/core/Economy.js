import { Events } from './EventBus.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { FARM_CONFIG } from '../config/farmConfig.js';

/**
 * Manages gold, passive income, and transactions.
 */
export class Economy {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.gold = GAME_CONFIG.startingGold;
    this.incomePerWave = 0;
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

  /** Recalculate total farm income from all farms. */
  recalculateIncome(farms) {
    this.incomePerWave = farms.reduce((sum, farm) => sum + farm.getIncome(), 0);
    this.eventBus.emit(Events.INCOME_CHANGED, this.incomePerWave);
  }

  /** Award farm income at end of wave. */
  collectWaveIncome() {
    if (this.incomePerWave > 0) {
      this.earn(this.incomePerWave);
    }
  }

  getUpgradeCost(structure, stat) {
    if (structure.type === 'farm') {
      const level = structure.level;
      if (level >= FARM_CONFIG.maxLevel) return null;
      return FARM_CONFIG.upgradeCosts[level - 1];
    }

    const towerDef = structure.definition;
    const upgradeLevel = structure.upgrades[stat];
    if (upgradeLevel >= towerDef.maxUpgradeLevel) return null;
    return towerDef.upgradeCosts[stat][upgradeLevel];
  }
}
