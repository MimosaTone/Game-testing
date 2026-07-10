import { Events } from './EventBus.js';
import {
  GLOBAL_UPGRADES,
  ENDLESS_INVESTMENTS,
  COMMANDER_ABILITIES,
  HQ_UPGRADES,
  ECONOMIC_INVESTMENTS,
  WORLD_WONDERS,
  TOWER_OVERCLOCKS,
  STRUCTURE_REINFORCEMENTS,
  BUILD_EXPANSION,
  scaledCost,
} from '../config/investmentConfig.js';
import { LEGENDARY_UPGRADES, LEGENDARY_UNLOCK_WAVE } from '../config/legendaryConfig.js';
import { BUILD_EXPANSION_POOL } from '../config/gameConfig.js';

function emptyMods() {
  return {
    damageMult: 1,
    attackSpeedMult: 1,
    rangeMult: 1,
    critChance: 0,
    projectileSpeedMult: 1,
    sellValueMult: 1,
    farmIncomeMult: 1,
    crystalMult: 1,
    bossRewardMult: 1,
    researchMult: 1,
    goldEarnedMult: 1,
    bankInterestMult: 1,
    upgradeCostMult: 1,
    repairCostMult: 1,
    structureArmor: 0,
    structureHealthMult: 0,
    passiveGoldPerWave: 0,
    passiveRepairPerWave: 0,
    chainCountAdd: 0,
    masteryXpMult: 1,
    farmBonusGold: 0,
    magicTowerBonus: false,
    bonusLives: 0,
  };
}

function applyLeveledEffects(mods, def, level) {
  if (level <= 0) return;
  const fx = def.effectPerLevel;
  for (const [key, val] of Object.entries(fx)) {
    if (key.includes('Mult') && key !== 'critChance') {
      mods[key] = (mods[key] ?? 1) + val * level;
    } else if (key === 'armorAdd' || key === 'structureArmor') {
      mods.structureArmor += val * level;
    } else if (key === 'healthMult') {
      mods.structureHealthMult += val * level;
    } else if (key === 'repairCostMult') {
      mods.repairCostMult += val * level;
    } else if (key === 'passiveRepair') {
      mods.passiveRepairPerWave += val * level;
    } else {
      mods[key] = (mods[key] ?? 0) + val * level;
    }
  }
}

/**
 * Run-scoped gold sinks: global upgrades, commander buffs, wonders, etc.
 */
export class InvestmentManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.global = {};
    this.endless = {};
    this.hq = {};
    this.economic = {};
    this.wonder = null;
    this.buildExpansions = 0;
    this.unlockedSpots = [];
    this.commanderBuff = null;
    this.overclocks = {};
    this.reinforcements = {};
    this.legendary = {};
    this._bonusLivesThisWave = 0;
  }

  reset() {
    this.global = {};
    this.endless = {};
    this.hq = {};
    this.economic = {};
    this.wonder = null;
    this.buildExpansions = 0;
    this.unlockedSpots = [];
    this.commanderBuff = null;
    this.overclocks = {};
    this.reinforcements = {};
    this.legendary = {};
    this._bonusLivesThisWave = 0;
    this._emit();
  }

  loadFromRun(data) {
    const d = data || {};
    this.global = { ...d.global };
    this.endless = { ...d.endless };
    this.hq = { ...d.hq };
    this.economic = { ...d.economic };
    this.wonder = d.wonder ?? null;
    this.buildExpansions = d.buildExpansions ?? 0;
    this.unlockedSpots = [...(d.unlockedSpots ?? [])];
    this.commanderBuff = d.commanderBuff ?? null;
    this.overclocks = { ...(d.overclocks ?? {}) };
    this.reinforcements = { ...(d.reinforcements ?? {}) };
    this.legendary = { ...(d.legendary ?? {}) };
    this._bonusLivesThisWave = 0;
  }

  toRunData() {
    return {
      global: { ...this.global },
      endless: { ...this.endless },
      hq: { ...this.hq },
      economic: { ...this.economic },
      wonder: this.wonder,
      buildExpansions: this.buildExpansions,
      unlockedSpots: [...this.unlockedSpots],
      commanderBuff: this.commanderBuff,
      overclocks: { ...this.overclocks },
      reinforcements: { ...this.reinforcements },
      legendary: { ...this.legendary },
    };
  }

  _emit() {
    this.eventBus.emit(Events.INVESTMENT_CHANGED, this.getState());
  }

  getState() {
    return {
      global: { ...this.global },
      endless: { ...this.endless },
      hq: { ...this.hq },
      economic: { ...this.economic },
      wonder: this.wonder,
      buildExpansions: this.buildExpansions,
      commanderBuff: this.commanderBuff,
      overclocks: { ...this.overclocks },
      legendary: { ...this.legendary },
    };
  }

  _getLevel(map, id) {
    return map[id] || 0;
  }

  getGlobalUpgradeCost(id) {
    const def = GLOBAL_UPGRADES[id];
    if (!def) return null;
    const level = this._getLevel(this.global, id);
    if (level >= def.maxLevel) return null;
    return scaledCost(def.baseCost, def.costGrowth, level);
  }

  getEndlessCost(id) {
    const def = ENDLESS_INVESTMENTS[id];
    if (!def) return null;
    return scaledCost(def.baseCost, def.costGrowth, this._getLevel(this.endless, id));
  }

  getHqCost(id) {
    const def = HQ_UPGRADES[id];
    if (!def) return null;
    const level = this._getLevel(this.hq, id);
    if (level >= def.maxLevel) return null;
    return scaledCost(def.baseCost, def.costGrowth, level);
  }

  getEconomicCost(id) {
    const def = ECONOMIC_INVESTMENTS[id];
    if (!def) return null;
    const level = this._getLevel(this.economic, id);
    if (level >= def.maxLevel) return null;
    return scaledCost(def.baseCost, def.costGrowth, level);
  }

  getExpansionCost(game = null) {
    const max = game?.getMaxBuildExpansions?.() ?? BUILD_EXPANSION.maxPurchases;
    if (this.buildExpansions >= max) return null;
    return scaledCost(BUILD_EXPANSION.baseCost, BUILD_EXPANSION.costGrowth, this.buildExpansions);
  }

  getReinforcementCost(structureKey, typeId) {
    const def = STRUCTURE_REINFORCEMENTS[typeId];
    if (!def) return null;
    const key = `${structureKey}:${typeId}`;
    const level = this.reinforcements[key] || 0;
    if (level >= def.maxLevel) return null;
    return scaledCost(def.baseCost, def.costGrowth, level);
  }

  purchaseGlobal(game, id) {
    const cost = this.getGlobalUpgradeCost(id);
    if (cost === null || !game.economy.spend(cost)) return false;
    this.global[id] = (this.global[id] || 0) + 1;
    this._emit();
    game._refreshInvestmentEffects();
    return true;
  }

  purchaseEndless(game, id) {
    const cost = this.getEndlessCost(id);
    if (cost === null || !game.economy.spend(cost)) return false;
    this.endless[id] = (this.endless[id] || 0) + 1;
    this._emit();
    game._refreshInvestmentEffects();
    return true;
  }

  purchaseHq(game, id) {
    const def = HQ_UPGRADES[id];
    const cost = this.getHqCost(id);
    if (!def || cost === null || !game.economy.spend(cost)) return false;
    this.hq[id] = (this.hq[id] || 0) + 1;
    if (def.effectPerLevel.bonusGold) {
      game.economy.earn(def.effectPerLevel.bonusGold, { skipMultiplier: true });
    }
    if (def.effectPerLevel.bonusLives) {
      game.lives += def.effectPerLevel.bonusLives;
      game.eventBus.emit(Events.LIVES_CHANGED, game.lives);
    }
    this._emit();
    game._refreshInvestmentEffects();
    return true;
  }

  purchaseEconomic(game, id) {
    const cost = this.getEconomicCost(id);
    if (cost === null || !game.economy.spend(cost)) return false;
    this.economic[id] = (this.economic[id] || 0) + 1;
    this._emit();
    game._refreshInvestmentEffects();
    game._refreshFarmIncome();
    return true;
  }

  purchaseWonder(game, id) {
    if (this.wonder) return false;
    const def = WORLD_WONDERS[id];
    if (!def) return false;
    if (game.waveManager.waveNumber < def.unlockWave) return false;
    const wonderMult = game.researchManager.getWonderCostMult();
    if (!game.economy.spend(Math.round(def.cost * wonderMult))) return false;
    this.wonder = id;
    if (def.effects.structureHealthMult) {
      game._applyWonderToStructures();
    }
    this._emit();
    game._refreshInvestmentEffects();
    return true;
  }

  purchaseExpansion(game) {
    const cost = this.getExpansionCost(game);
    if (cost === null || !game.economy.spend(cost)) return false;
    const next = BUILD_EXPANSION_POOL[this.buildExpansions];
    if (!next) return false;
    const key = `${next.x},${next.y}`;
    if (!game.placementSystem.buildSpots.has(key)) {
      game.placementSystem.buildSpots.add(key);
      this.unlockedSpots.push(key);
    }
    this.buildExpansions++;
    this._emit();
    return true;
  }

  purchaseCommander(game, id) {
    if (this.commanderBuff) return false;
    const def = COMMANDER_ABILITIES[id];
    if (!def) return false;
    if (def.cost > 0 && !game.economy.spend(def.cost)) return false;

    if (def.instantGold) {
      game.economy.earn(def.instantGold, { skipMultiplier: true });
    }
    if (def.repairAll) {
      game.placementSystem.repairAllDamaged();
    }
    if (def.effects?.bonusLives) {
      game.lives += def.effects.bonusLives;
      this._bonusLivesThisWave = def.effects.bonusLives;
      game.eventBus.emit(Events.LIVES_CHANGED, game.lives);
    }

    this.commanderBuff = id;
    this._emit();
    game._refreshInvestmentEffects();
    return true;
  }

  purchaseOverclock(game, tower, typeId) {
    const def = TOWER_OVERCLOCKS[typeId];
    if (!def || !tower || tower.destroyed) return false;
    if (!game.economy.spend(def.cost)) return false;
    this.overclocks[tower.id] = { type: typeId, wavesLeft: def.waves };
    this._emit();
    game._refreshInvestmentEffects();
    return true;
  }

  purchaseReinforcement(game, structure, typeId) {
    if (!structure || structure.destroyed) return false;
    const def = STRUCTURE_REINFORCEMENTS[typeId];
    if (!def) return false;
    const key = `${structure.gridX},${structure.gridY}`;
    const cost = this.getReinforcementCost(key, typeId);
    if (cost === null || !game.economy.spend(cost)) return false;
    const rKey = `${key}:${typeId}`;
    this.reinforcements[rKey] = (this.reinforcements[rKey] || 0) + 1;
    game._applyReinforcementPurchase(structure, typeId);
    this._emit();
    return true;
  }

  purchaseLegendary(game, tower) {
    if (!tower || tower.destroyed) return false;
    if (game.waveManager.waveNumber < LEGENDARY_UNLOCK_WAVE) return false;
    if (this.legendary[tower.id]) return false;
    const def = LEGENDARY_UPGRADES[tower.typeId];
    if (!def) return false;
    if (!game.economy.spend(Math.round(def.cost * game.researchManager.getLegendaryCostMult()))) return false;
    this.legendary[tower.id] = def.id;
    this._emit();
    game._refreshInvestmentEffects();
    return true;
  }

  onWaveStart(game) {
    this._bonusLivesThisWave = 0;
  }

  onWaveComplete(game) {
    if (this._bonusLivesThisWave > 0) {
      game.lives = Math.max(0, game.lives - this._bonusLivesThisWave);
      this._bonusLivesThisWave = 0;
      game.eventBus.emit(Events.LIVES_CHANGED, game.lives);
    }
    this.commanderBuff = null;

    for (const id of Object.keys(this.overclocks)) {
      this.overclocks[id].wavesLeft--;
      if (this.overclocks[id].wavesLeft <= 0) delete this.overclocks[id];
    }

    const mods = this.getPassiveMods();
    const repair = mods.passiveRepairPerWave;
    if (repair > 0) {
      for (const s of [...game.placementSystem.towers, ...game.placementSystem.farms, ...game.placementSystem.supports]) {
        if (!s.destroyed) {
          s.health = Math.min(s.maxHealth, s.health + repair);
        }
      }
    }

    if (mods.farmBonusGold > 0) {
      const bonus = mods.farmBonusGold * game.placementSystem.farms.length;
      if (bonus > 0) game.economy.earn(bonus, { skipMultiplier: true });
    }

    if (mods.passiveGoldPerWave > 0) {
      game.economy.earn(mods.passiveGoldPerWave, { skipMultiplier: true });
    }

    this._emit();
    game._refreshInvestmentEffects();
  }

  getOverclockMods(towerId) {
    const oc = this.overclocks[towerId];
    if (!oc) return {};
    const def = TOWER_OVERCLOCKS[oc.type];
    if (!def?.effects) return {};
    const out = {};
    for (const [k, v] of Object.entries(def.effects)) {
      if (k.includes('Mult') && k !== 'critChance') out[k] = 1 + v;
      else out[k] = v;
    }
    return out;
  }

  getLegendaryMods(tower) {
    const legId = this.legendary[tower.id];
    if (!legId) return {};
    const def = LEGENDARY_UPGRADES[tower.typeId];
    return def?.effects ?? {};
  }

  getReinforcementMods(structure) {
    const key = `${structure.gridX},${structure.gridY}`;
    const mods = { healthMult: 0, armorAdd: 0, passiveRepair: 0, repairCostMult: 0 };
    for (const [rKey, level] of Object.entries(this.reinforcements)) {
      if (!rKey.startsWith(`${key}:`)) continue;
      const typeId = rKey.split(':').pop();
      const def = STRUCTURE_REINFORCEMENTS[typeId];
      if (!def) continue;
      applyLeveledEffects(mods, def, level);
    }
    return mods;
  }

  getPassiveMods() {
    const mods = emptyMods();

    for (const [id, level] of Object.entries(this.global)) {
      applyLeveledEffects(mods, GLOBAL_UPGRADES[id], level);
    }
    for (const [id, level] of Object.entries(this.endless)) {
      applyLeveledEffects(mods, ENDLESS_INVESTMENTS[id], level);
    }
    for (const [id, level] of Object.entries(this.hq)) {
      applyLeveledEffects(mods, HQ_UPGRADES[id], level);
    }
    for (const [id, level] of Object.entries(this.economic)) {
      applyLeveledEffects(mods, ECONOMIC_INVESTMENTS[id], level);
    }

    if (this.wonder) {
      const w = WORLD_WONDERS[this.wonder];
      if (w?.effects) {
        for (const [k, v] of Object.entries(w.effects)) {
          if (k.includes('Mult') || k === 'structureArmor' || k === 'passiveRepairPerWave' || k === 'farmBonusGold' || k === 'chainCountAdd') {
            if (k.includes('Mult') && k !== 'critChance') mods[k] = (mods[k] ?? 1) + v;
            else mods[k] = (mods[k] ?? 0) + v;
          } else if (k === 'masteryXpMult') mods.masteryXpMult *= v;
          else if (k === 'magicTowerBonus') mods.magicTowerBonus = v;
        }
      }
    }

    return mods;
  }

  getCommanderMods() {
    if (!this.commanderBuff) return {};
    return COMMANDER_ABILITIES[this.commanderBuff]?.effects ?? {};
  }

  /** Combined run modifiers for combat/economy pipelines. */
  getCombinedMods() {
    const passive = this.getPassiveMods();
    const commander = this.getCommanderMods();
    const combined = { ...passive };

    for (const [k, v] of Object.entries(commander)) {
      if (k.includes('Mult') && k !== 'critChance') combined[k] = (combined[k] ?? 1) + v;
      else combined[k] = (combined[k] ?? 0) + v;
    }

    return combined;
  }

  getRepairCostMult() {
    const mods = this.getCombinedMods();
    return Math.max(0.2, 1 + (mods.repairCostMult || 0));
  }

  getStructureRepairCostMult(structure) {
    const reinf = structure ? this.getReinforcementMods(structure).repairCostMult || 0 : 0;
    return Math.max(0.15, this.getRepairCostMult() * (1 + reinf));
  }

  getUpgradeCostMult() {
    const mods = this.getCombinedMods();
    return Math.max(0.5, 1 + (mods.upgradeCostMult || 0));
  }

  applyExpansionSpots(placementSystem) {
    for (const key of this.unlockedSpots) {
      placementSystem.buildSpots.add(key);
    }
  }
}
