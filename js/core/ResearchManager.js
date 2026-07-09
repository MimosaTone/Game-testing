import { RESEARCH_UPGRADES } from '../config/researchConfig.js';
import { Events } from './EventBus.js';

/**
 * Run-wide research points and purchased upgrades.
 */
export class ResearchManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.points = 0;
    this.levels = {};
  }

  loadFromRun(data) {
    this.points = data?.points ?? 0;
    this.levels = { ...(data?.levels ?? {}) };
  }

  toRunData() {
    return { points: this.points, levels: { ...this.levels } };
  }

  reset() {
    this.points = 0;
    this.levels = {};
    this.eventBus.emit(Events.RESEARCH_CHANGED, this.getState());
  }

  getState() {
    return { points: this.points, levels: { ...this.levels } };
  }

  addPoints(amount) {
    if (amount <= 0) return;
    this.points += amount;
    this.eventBus.emit(Events.RESEARCH_CHANGED, this.getState());
  }

  getUpgradeLevel(id) {
    return this.levels[id] || 0;
  }

  canPurchase(id) {
    const def = RESEARCH_UPGRADES[id];
    if (!def) return false;
    const level = this.getUpgradeLevel(id);
    if (level >= def.maxLevel) return false;
    return this.points >= def.cost;
  }

  purchase(id) {
    if (!this.canPurchase(id)) return false;
    const def = RESEARCH_UPGRADES[id];
    this.points -= def.cost;
    this.levels[id] = (this.levels[id] || 0) + 1;
    this.eventBus.emit(Events.RESEARCH_CHANGED, this.getState());
    return true;
  }

  getModifiers() {
    const mods = {
      damageMult: 1,
      rangeMult: 1,
      attackSpeedMult: 1,
      farmIncomeMult: 1,
      buildCostMult: 1,
      sellValueMult: 1,
      bonusStartingGold: 0,
      bossRewardMult: 1,
    };

    for (const [id, def] of Object.entries(RESEARCH_UPGRADES)) {
      const level = this.getUpgradeLevel(id);
      if (level <= 0) continue;
      const fx = def.effects;
      if (fx.damageMult) mods.damageMult += fx.damageMult * level;
      if (fx.rangeMult) mods.rangeMult += fx.rangeMult * level;
      if (fx.attackSpeedMult) mods.attackSpeedMult += fx.attackSpeedMult * level;
      if (fx.farmIncomeMult) mods.farmIncomeMult += fx.farmIncomeMult * level;
      if (fx.buildCostMult) mods.buildCostMult += fx.buildCostMult * level;
      if (fx.sellValueMult) mods.sellValueMult += fx.sellValueMult * level;
      if (fx.bonusStartingGold) mods.bonusStartingGold += fx.bonusStartingGold * level;
      if (fx.bossRewardMult) mods.bossRewardMult += fx.bossRewardMult * level;
    }

    return mods;
  }
}
