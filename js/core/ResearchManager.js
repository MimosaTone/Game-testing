import {
  RESEARCH_TREE_NODES,
  ENDLESS_RESEARCH_NODES,
  LEGACY_RESEARCH_MAP,
  ENDLESS_UNLOCK_RANKS,
  researchCost,
} from '../config/researchTreeConfig.js';
import { Events } from './EventBus.js';

function emptyMods() {
  return {
    damageMult: 1,
    rangeMult: 1,
    attackSpeedMult: 1,
    farmIncomeMult: 1,
    farmWaveScalingMult: 1,
    buildCostMult: 1,
    upgradeCostMult: 1,
    sellValueMult: 1,
    bonusStartingGold: 0,
    instantGold: 0,
    bossRewardMult: 1,
    bossDamageMult: 1,
    eliteDamageMult: 1,
    eliteGoldMult: 1,
    killGoldMult: 1,
    bankInterestMult: 1,
    goldEarnedMult: 1,
    crystalMult: 1,
    researchMult: 1,
    critChance: 0,
    critDamageMult: 1.5,
    projectileSpeedMult: 1,
    splashRadiusMult: 1,
    armorPen: 0,
    chainCountAdd: 0,
    burnDPSAdd: 0,
    slowDurationMult: 1,
    slowPercentAdd: 0,
    burnSpreadCount: 0,
    structureHealthMult: 1,
    structureArmor: 0,
    towerHealthMult: 1,
    towerArmorAdd: 0,
    passiveRepairPerWave: 0,
    repairCostMult: 1,
    repairSpeedMult: 1,
    masteryXpMult: 1,
    supportRadiusMult: 1,
    bonusBuildExpansions: 0,
    challengeRewardMult: 1,
    legendaryCostMult: 1,
    wonderCostMult: 1,
    passiveGoldPerWave: 0,
    autoStartDelayMult: 1,
    extraSpeedTier: 0,
    waveRewardInsight: 0,
  };
}

function applyEffectsPerLevel(mods, fx, level) {
  if (!fx || level <= 0) return;
  for (const [key, val] of Object.entries(fx)) {
    if (key.includes('Mult') && key !== 'critChance' && key !== 'critDamageMult') {
      if (typeof val === 'number' && val < 0) {
        mods[key] = (mods[key] ?? 1) + val * level;
      } else {
        mods[key] = (mods[key] ?? 1) + val * level;
      }
    } else if (key === 'critChance' || key === 'armorPen' || key === 'structureArmor' || key === 'towerArmorAdd') {
      mods[key] = (mods[key] ?? 0) + val * level;
    } else if (key === 'critDamageMult') {
      mods[key] = (mods[key] ?? 1.5) + val * level;
    } else if (key === 'chainCountAdd') {
      mods[key] = (mods[key] ?? 0) + val * level;
    } else if (key === 'burnSpreadCount' || key === 'bonusBuildExpansions' || key === 'extraSpeedTier' || key === 'waveRewardInsight') {
      mods[key] = (mods[key] ?? 0) + Math.floor(val * level);
    } else {
      mods[key] = (mods[key] ?? 0) + val * level;
    }
  }
}

/**
 * Run-wide research tree — branches, endless scaling, and meta-persistent world unlocks.
 */
export class ResearchManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.points = 0;
    this.levels = {};
    this.endless = {};
    this.metaUnlocks = {};
    this.metaLevels = {};
  }

  loadFromMeta(meta) {
    const d = meta?.researchMeta ?? {};
    this.metaUnlocks = { ...(d.unlocks ?? {}) };
    this.metaLevels = { ...(d.levels ?? {}) };
  }

  toMetaData() {
    return {
      unlocks: { ...this.metaUnlocks },
      levels: { ...this.metaLevels },
    };
  }

  loadFromRun(data) {
    this.points = data?.points ?? 0;
    this.levels = { ...(data?.levels ?? {}) };
    this.endless = { ...(data?.endless ?? {}) };
    this._migrateLegacyLevels();
  }

  toRunData() {
    return {
      points: this.points,
      levels: { ...this.levels },
      endless: { ...this.endless },
    };
  }

  _migrateLegacyLevels() {
    for (const [oldId, newId] of Object.entries(LEGACY_RESEARCH_MAP)) {
      if (this.levels[oldId] && !this.levels[newId]) {
        this.levels[newId] = this.levels[oldId];
        delete this.levels[oldId];
      }
    }
  }

  reset() {
    this.points = 0;
    this.levels = {};
    this.endless = {};
    this.eventBus.emit(Events.RESEARCH_CHANGED, this.getState());
  }

  getState() {
    return {
      points: this.points,
      levels: { ...this.levels },
      endless: { ...this.endless },
      metaUnlocks: { ...this.metaUnlocks },
      endlessUnlocked: this.isEndlessUnlocked(),
      totalRanks: this.getTotalMainRanks(),
    };
  }

  addPoints(amount) {
    if (amount <= 0) return;
    this.points += amount;
    this.eventBus.emit(Events.RESEARCH_CHANGED, this.getState());
  }

  getTotalMainRanks() {
    let total = 0;
    for (const [id, level] of Object.entries(this.levels)) {
      const def = RESEARCH_TREE_NODES[id];
      if (def && def.branch !== 'world') total += level;
    }
    return total;
  }

  isEndlessUnlocked() {
    if (this.metaUnlocks.endless_research) return true;
    return this.getTotalMainRanks() >= ENDLESS_UNLOCK_RANKS;
  }

  hasMetaUnlock(flag) {
    return !!this.metaUnlocks[flag];
  }

  getNodeLevel(id) {
    return this.levels[id] || 0;
  }

  getEndlessLevel(id) {
    return this.endless[id] || 0;
  }

  getNodeCost(id) {
    const endless = ENDLESS_RESEARCH_NODES[id];
    if (endless) {
      return researchCost(endless.baseCost, endless.costGrowth, this.getEndlessLevel(id));
    }
    const def = RESEARCH_TREE_NODES[id];
    if (!def) return null;
    const level = this.getNodeLevel(id);
    if (level >= def.maxLevel) return null;
    const growth = def.costGrowth ?? 1.25;
    return researchCost(def.cost, growth, level);
  }

  getNodeState(id) {
    const endless = ENDLESS_RESEARCH_NODES[id];
    if (endless) {
      if (!this.isEndlessUnlocked()) return 'locked';
      const cost = this.getNodeCost(id);
      return this.points >= cost ? 'available' : 'unaffordable';
    }

    const def = RESEARCH_TREE_NODES[id];
    if (!def) return 'locked';
    const level = this.getNodeLevel(id);
    if (level >= def.maxLevel) return 'maxed';
    if (def.metaPersistent && def.unlockFlag && this.metaUnlocks[def.unlockFlag]) return 'maxed';
    const prereqMet = def.prerequisites.every((p) => {
      const pDef = RESEARCH_TREE_NODES[p];
      if (pDef?.metaPersistent && pDef.unlockFlag) return !!this.metaUnlocks[pDef.unlockFlag];
      return this.getNodeLevel(p) >= 1;
    });
    if (!prereqMet) return 'locked';
    const cost = this.getNodeCost(id);
    if (cost === null) return 'maxed';
    return this.points >= cost ? 'available' : 'unaffordable';
  }

  canPurchase(id) {
    return this.getNodeState(id) === 'available';
  }

  purchase(id, game = null) {
    if (!this.canPurchase(id)) return false;
    const cost = this.getNodeCost(id);
    if (cost === null || this.points < cost) return false;

    const endless = ENDLESS_RESEARCH_NODES[id];
    if (endless) {
      this.points -= cost;
      this.endless[id] = this.getEndlessLevel(id) + 1;
      this.eventBus.emit(Events.RESEARCH_CHANGED, this.getState());
      return { instantGold: 0, meta: false };
    }

    const def = RESEARCH_TREE_NODES[id];
    if (!def) return false;
    this.points -= cost;

    let instantGold = 0;
    if (def.metaPersistent) {
      if (def.unlockFlag) this.metaUnlocks[def.unlockFlag] = true;
      this.metaLevels[id] = 1;
      if (game) game.saveManager.saveMeta(game);
    } else {
      this.levels[id] = this.getNodeLevel(id) + 1;
      if (def.effectsPerLevel?.instantGold) {
        instantGold = def.effectsPerLevel.instantGold;
      }
    }

    this.eventBus.emit(Events.RESEARCH_CHANGED, this.getState());
    return { instantGold, meta: !!def.metaPersistent };
  }

  /** @deprecated */
  getUpgradeLevel(id) {
    return this.getNodeLevel(id) || this.getEndlessLevel(id);
  }

  getModifiers() {
    const mods = emptyMods();

    for (const [id, level] of Object.entries(this.levels)) {
      const def = RESEARCH_TREE_NODES[id];
      if (!def || def.metaPersistent) continue;
      applyEffectsPerLevel(mods, def.effectsPerLevel, level);
    }

    for (const [id, level] of Object.entries(this.endless)) {
      const def = ENDLESS_RESEARCH_NODES[id];
      if (!def) continue;
      applyEffectsPerLevel(mods, def.effectsPerLevel, level);
    }

    for (const [id, level] of Object.entries(this.metaLevels)) {
      const def = RESEARCH_TREE_NODES[id];
      if (!def) continue;
      applyEffectsPerLevel(mods, def.effectsPerLevel, level);
    }

    return mods;
  }

  getLegendaryCostMult() {
    return Math.max(0.5, 1 + (this.getModifiers().legendaryCostMult - 1));
  }

  getWonderCostMult() {
    return Math.max(0.7, 1 + (this.getModifiers().wonderCostMult - 1));
  }
}
