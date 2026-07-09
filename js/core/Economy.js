import { Events } from './EventBus.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { FARM_CONFIG } from '../config/farmConfig.js';
import { SUPPORT_TYPES } from '../config/supportConfig.js';
import {
  ECONOMY_CONFIG,
  calculateFarmIncome,
  estimatePaybackWaves,
} from '../config/economyConfig.js';

/**
 * Manages gold, crystals, passive income, and transactions.
 */
export class Economy {
  constructor(eventBus, prestigeManager) {
    this.eventBus = eventBus;
    this.prestigeManager = prestigeManager;
    this.supportEffects = null;
    this.gold = GAME_CONFIG.startingGold;
    this.crystals = 0;
    this.incomePerWave = 0;
    this.waveNumber = 0;
    this.lastWaveKillGold = 0;
    this._farmSupportMult = 1;
  }

  setSupportEffects(manager) {
    this.supportEffects = manager;
  }

  setWaveNumber(waveNumber) {
    this.waveNumber = waveNumber;
  }

  getGoldMultiplier() {
    return this.supportEffects?.global.goldEarnedMult ?? 1;
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

  earn(amount, options = {}) {
    let final = amount;
    if (!options.skipMultiplier) {
      final = Math.round(amount * this.getGoldMultiplier());
      if (options.isBoss) {
        const bossMult = this.supportEffects?.global.bossRewardMult ?? 1;
        const challengeBoss = this._challengeFx?.bossGoldMult ?? 1;
        final = Math.round(final * bossMult * challengeBoss);
      }
      if (options.rewardMult) {
        final = Math.round(final * options.rewardMult);
      }
    }
    this.gold += final;
    this.eventBus.emit(Events.GOLD_CHANGED, this.gold);
    return final;
  }

  addCrystals(amount) {
    if (amount <= 0) return;
    this.crystals += amount;
    this.eventBus.emit(Events.CRYSTALS_CHANGED, this.crystals);
  }

  spendCrystals(amount) {
    if (this.crystals < amount) return false;
    this.crystals -= amount;
    this.eventBus.emit(Events.CRYSTALS_CHANGED, this.crystals);
    return true;
  }

  getAdjustedBuildCost(baseCost) {
    const mult = this.supportEffects?.global.buildCostMult ?? 1;
    return Math.max(1, Math.round(baseCost * mult));
  }

  /** Recalculate total farm income including support and research bonuses. */
  recalculateIncome(farms, supportModsFn = null) {
    const mods = this.prestigeManager.getModifiers();
    let total = 0;

    if (supportModsFn) {
      for (const farm of farms) {
        const farmMult = supportModsFn(farm.gridX, farm.gridY);
        const singleIncome = calculateFarmIncome([farm], this.waveNumber, mods);
        total += Math.round(singleIncome * farmMult);
      }
      this._farmSupportMult = farms.length > 0 ? total / Math.max(1, calculateFarmIncome(farms, this.waveNumber, mods)) : 1;
    } else {
      total = calculateFarmIncome(farms, this.waveNumber, mods);
      this._farmSupportMult = 1;
    }

    this.incomePerWave = total;
    this.eventBus.emit(Events.INCOME_CHANGED, {
      total: this.incomePerWave,
      farmCount: farms.length,
      waveBonus: this.waveNumber > 0 ? Math.round(this.waveNumber * ECONOMY_CONFIG.incomeWaveScaling * 100) : 0,
    });
  }

  collectWaveIncome() {
    const farmIncome = this.incomePerWave;
    const mods = this.prestigeManager.getModifiers();
    let waveBonus = Math.round(ECONOMY_CONFIG.waveClearBonus(this.waveNumber) * mods.waveBonusMult);
    waveBonus = Math.round(waveBonus * (this._challengeRewardMult ?? 1));

    let bankInterest = 0;
    if (this.supportEffects) {
      for (const s of this._supports || []) {
        if (s.typeId !== 'bank' || s.storedGold <= 0) continue;
        const { interestRate } = this.supportEffects.getBankStats(s);
        const interest = Math.round(s.storedGold * interestRate);
        s.storedGold += interest;
        bankInterest += interest;
      }
    }

    if (farmIncome > 0) this.earn(farmIncome);
    const earnedBonus = this.earn(waveBonus);

    return { farmIncome, waveBonus: earnedBonus, killGold: this.lastWaveKillGold, bankInterest };
  }

  setSupportsForBank(supports) {
    this._supports = supports;
  }

  setChallengeEffects(fx, rewardMult = 1) {
    this._challengeFx = fx;
    this._challengeRewardMult = rewardMult;
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
      const base = FARM_CONFIG.upgradeCosts[level - 1];
      return this._adjustUpgradeCost(base, structure.gridX, structure.gridY);
    }

    if (structure.type === 'tower') {
      const next = structure.getNextUpgrade();
      if (!next) return null;
      return this._adjustUpgradeCost(next.cost, structure.gridX, structure.gridY);
    }

    if (structure.type === 'support') {
      const base = structure.getUpgradeCost();
      if (base === null) return null;
      return Math.max(1, Math.round(base * (this.supportEffects?.global.upgradeCostMult ?? 1)));
    }

    return null;
  }

  _adjustUpgradeCost(base, gridX, gridY) {
    let mult = 1;
    if (this.supportEffects) {
      const towerMods = this.supportEffects.getTowerMods(this._supports || [], gridX, gridY);
      mult = towerMods.upgradeCostMult;
    }
    return Math.max(1, Math.round(base * mult));
  }

  getSunpatchPayback(cost, projectedIncome) {
    return estimatePaybackWaves(cost, projectedIncome || this.incomePerWave);
  }
}
