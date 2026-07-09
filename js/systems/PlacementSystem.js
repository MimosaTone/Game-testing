import { BUILD_SPOTS } from '../config/gameConfig.js';
import { TOWER_TYPES } from '../config/towerTypes.js';
import { FARM_CONFIG } from '../config/farmConfig.js';
import { SUPPORT_TYPES } from '../config/supportConfig.js';
import { REBUILD_COST_MULT } from '../config/structureHealthConfig.js';
import { Tower } from '../entities/Tower.js';
import { Farm } from '../entities/Farm.js';
import { Support } from '../entities/Support.js';
import { restoreStructureHealth, repairStructure, getRepairCost } from '../entities/StructureHealth.js';
import { Events } from '../core/EventBus.js';

/**
 * Handles building towers, farms, and support structures on valid spots.
 */
export class PlacementSystem {
  constructor(eventBus, economy) {
    this.eventBus = eventBus;
    this.economy = economy;
    this.towers = [];
    this.farms = [];
    this.supports = [];
    this.allBuildSpots = BUILD_SPOTS.map((s) => `${s.x},${s.y}`);
    this.buildSpots = new Set(this.allBuildSpots);
    this.occupied = new Map();
    this.destroyedSpots = new Map();
    this.selectedBuildType = null;
    this.selectedStructure = null;
    this.bossesDefeated = 0;
    this.challengeFx = null;
    this.sellMode = false;
  }

  toggleSellMode() {
    this.sellMode = !this.sellMode;
    if (this.sellMode) {
      this.selectedBuildType = null;
      this.eventBus.emit(Events.STRUCTURE_SELECTED, null);
    }
    return this.sellMode;
  }

  setChallengeEffects(fx) {
    this.challengeFx = fx;
    this._applyBuildSpotLimit();
  }

  _applyBuildSpotLimit() {
    const mult = this.challengeFx?.buildSpotMult ?? 1;
    const targetCount = Math.max(12, Math.round(this.allBuildSpots.length * mult));
    if (targetCount >= this.allBuildSpots.length) {
      this.buildSpots = new Set(this.allBuildSpots);
      return;
    }
    const spots = [...this.allBuildSpots];
    const seeded = spots
      .map((s, i) => ({ s, h: this._hashSpot(s, i) }))
      .sort((a, b) => a.h - b.h)
      .slice(0, targetCount)
      .map((x) => x.s);
    this.buildSpots = new Set(seeded);
  }

  _hashSpot(key, i) {
    const [x, y] = key.split(',').map(Number);
    return ((x * 73856093) ^ (y * 19349663) ^ (i * 83492791)) >>> 0;
  }

  isBuildSpot(gridX, gridY) {
    return this.buildSpots.has(`${gridX},${gridY}`);
  }

  isOccupied(gridX, gridY) {
    return this.occupied.has(`${gridX},${gridY}`);
  }

  getDestroyedAt(gridX, gridY) {
    return this.destroyedSpots.get(`${gridX},${gridY}`) || null;
  }

  setBuildType(typeId) {
    this.selectedBuildType = typeId;
    this.selectedStructure = null;
    this.eventBus.emit(Events.STRUCTURE_SELECTED, null);
  }

  selectStructure(gridX, gridY) {
    const key = `${gridX},${gridY}`;
    const structure = this.occupied.get(key) || this.destroyedSpots.get(key) || null;
    this.selectedStructure = structure;
    this.selectedBuildType = null;
    this.eventBus.emit(Events.STRUCTURE_SELECTED, structure);
    return structure;
  }

  clearSelection() {
    this.selectedBuildType = null;
    this.selectedStructure = null;
    this.eventBus.emit(Events.STRUCTURE_SELECTED, null);
  }

  isSupportUnlocked(typeId) {
    const def = SUPPORT_TYPES[typeId];
    if (!def?.unlockAfterWave) return true;
    return this.bossesDefeated > 0;
  }

  getBuildCost(typeId) {
    if (typeId === FARM_CONFIG.id) return FARM_CONFIG.cost;
    if (TOWER_TYPES[typeId]) {
      const base = TOWER_TYPES[typeId].cost;
      return this.economy.getAdjustedBuildCost(base);
    }
    if (SUPPORT_TYPES[typeId]) return SUPPORT_TYPES[typeId].cost;
    return null;
  }

  getRebuildCost(destroyedData) {
    const base = this.getBuildCost(destroyedData.typeId);
    if (base === null) return null;
    return Math.max(1, Math.round(base * REBUILD_COST_MULT));
  }

  tryPlace(gridX, gridY) {
    const key = `${gridX},${gridY}`;
    const destroyed = this.destroyedSpots.get(key);

    if (destroyed) {
      return this._rebuildAt(gridX, gridY, destroyed);
    }

    if (!this.isBuildSpot(gridX, gridY) || this.isOccupied(gridX, gridY)) {
      return false;
    }

    if (this.selectedBuildType === FARM_CONFIG.id) {
      return this._placeFarm(gridX, gridY);
    }

    if (TOWER_TYPES[this.selectedBuildType]) {
      return this._placeTower(this.selectedBuildType, gridX, gridY);
    }

    if (SUPPORT_TYPES[this.selectedBuildType]) {
      return this._placeSupport(this.selectedBuildType, gridX, gridY);
    }

    return false;
  }

  _rebuildAt(gridX, gridY, data) {
    if (this.selectedBuildType !== data.typeId) return false;
    const cost = this.getRebuildCost(data);
    if (!this.economy.spend(cost)) return false;

    const key = `${gridX},${gridY}`;
    this.destroyedSpots.delete(key);

    let structure;
    if (data.structureType === 'tower') {
      structure = new Tower(data.typeId, gridX, gridY);
      structure.upgradeTier = data.upgradeTier || 0;
      structure.masteryXP = data.masteryXP || 0;
      structure.masterUnlocked = data.masterUnlocked || false;
      this.towers.push(structure);
      this.eventBus.emit(Events.TOWER_PLACED, structure);
    } else if (data.structureType === 'farm') {
      structure = new Farm(gridX, gridY);
      structure.level = data.level || 1;
      this.farms.push(structure);
      this.economy.recalculateIncome(this.farms);
      this.eventBus.emit(Events.FARM_PLACED, structure);
    } else {
      structure = new Support(data.typeId, gridX, gridY);
      structure.level = data.level || 1;
      structure.branch = data.branch || null;
      structure.storedGold = data.storedGold || 0;
      this.supports.push(structure);
      this.eventBus.emit(Events.SUPPORT_PLACED, structure);
    }

    this.occupied.set(key, structure);
    this.eventBus.emit(Events.STRUCTURE_REBUILT, structure);
    return true;
  }

  _placeTower(typeId, gridX, gridY) {
    const cost = this.getBuildCost(typeId);
    if (!this.economy.spend(cost)) return false;

    const tower = new Tower(typeId, gridX, gridY);
    this.towers.push(tower);
    this.occupied.set(`${gridX},${gridY}`, tower);
    this.eventBus.emit(Events.TOWER_PLACED, tower);
    return true;
  }

  _placeFarm(gridX, gridY) {
    if (!this.economy.spend(FARM_CONFIG.cost)) return false;

    const farm = new Farm(gridX, gridY);
    this.farms.push(farm);
    this.occupied.set(`${gridX},${gridY}`, farm);
    this.economy.recalculateIncome(this.farms);
    this.eventBus.emit(Events.FARM_PLACED, farm);
    return true;
  }

  _placeSupport(typeId, gridX, gridY) {
    if (!this.isSupportUnlocked(typeId)) return false;
    const def = SUPPORT_TYPES[typeId];
    if (!this.economy.spend(def.cost)) return false;

    const support = new Support(typeId, gridX, gridY);
    this.supports.push(support);
    this.occupied.set(`${gridX},${gridY}`, support);
    this.eventBus.emit(Events.SUPPORT_PLACED, support);
    return true;
  }

  manualRepair(structure) {
    const mult = this.economy._investmentManager?.getStructureRepairCostMult?.(structure) ?? 1;
    const cost = getRepairCost(structure, mult);
    if (cost === null || cost <= 0) return false;
    if (!this.economy.spend(cost)) return false;
    const healed = repairStructure(structure, structure.maxHealth);
    this.eventBus.emit(Events.STRUCTURE_REPAIRED, structure);
    return healed > 0;
  }

  getRepairAllCost() {
    const structures = [...this.towers, ...this.farms, ...this.supports].filter(
      (s) => !s.destroyed && s.health < s.maxHealth
    );
    let totalCost = 0;
    const im = this.economy._investmentManager;
    for (const s of structures) {
      const mult = im?.getStructureRepairCostMult?.(s) ?? im?.getRepairCostMult?.() ?? 1;
      totalCost += getRepairCost(s, mult) || 0;
    }
    return totalCost;
  }

  repairAllDamaged() {
    const structures = [...this.towers, ...this.farms, ...this.supports].filter(
      (s) => !s.destroyed && s.health < s.maxHealth
    );
    const totalCost = this.getRepairAllCost();
    if (totalCost <= 0 || !this.economy.canAfford(totalCost)) return false;
    this.economy.spend(totalCost);
    for (const s of structures) {
      repairStructure(s, s.maxHealth);
      this.eventBus.emit(Events.STRUCTURE_REPAIRED, s);
    }
    return true;
  }

  _getSellMult(structure) {
    let mult = this.economy.supportEffects?.global.sellValueMult ?? 1;
    if (structure.type === 'tower' && this.economy.supportEffects) {
      const mods = this.economy.supportEffects.getTowerMods(
        this.supports,
        structure.gridX,
        structure.gridY
      );
      mult *= mods.sellValueMult ?? 1;
    }
    return mult;
  }

  getSellValue(structure) {
    if (!structure || structure.destroyed) return 0;
    let invested = 0;

    if (structure.type === 'tower') {
      invested = this.getBuildCost(structure.typeId) ?? TOWER_TYPES[structure.typeId].cost;
      for (let i = 0; i < structure.upgradeTier; i++) {
        invested += structure.upgradePath[i]?.cost ?? 0;
      }
    } else if (structure.type === 'farm') {
      invested = FARM_CONFIG.cost;
      for (let i = 0; i < structure.level - 1; i++) {
        invested += FARM_CONFIG.upgradeCosts[i] ?? 0;
      }
    } else if (structure.type === 'support') {
      invested = structure.definition.cost;
      for (let i = 0; i < structure.level - 1; i++) {
        invested += structure.definition.upgradeCosts[i] ?? 0;
      }
      if (structure.typeId === 'bank') invested += structure.storedGold;
    }

    return Math.max(1, Math.round(invested * 0.6 * this._getSellMult(structure)));
  }

  sellStructure(structure) {
    if (!structure || structure.destroyed) return false;
    const value = this.getSellValue(structure);
    const key = `${structure.gridX},${structure.gridY}`;

    if (structure.type === 'tower') {
      this.towers = this.towers.filter((t) => t.id !== structure.id);
    } else if (structure.type === 'farm') {
      this.farms = this.farms.filter((f) => f.id !== structure.id);
      this.economy.recalculateIncome(this.farms);
    } else if (structure.type === 'support') {
      this.supports = this.supports.filter((s) => s.id !== structure.id);
    }

    this.occupied.delete(key);
    this.selectedStructure = null;
    this.economy.earn(value, { skipMultiplier: true });
    this.eventBus.emit(Events.STRUCTURE_SOLD, { structure, value });
    this.eventBus.emit(Events.STRUCTURE_SELECTED, null);
    return true;
  }

  upgradeSelected(stat, branch = null) {
    const structure = this.selectedStructure;
    if (!structure || structure.destroyed) return false;

    const cost = this.economy.getUpgradeCost(structure, stat);
    if (cost === null || !this.economy.spend(cost)) return false;

    if (structure.type === 'farm') {
      structure.upgrade();
      this.economy.recalculateIncome(this.farms);
    } else if (structure.type === 'tower') {
      structure.upgrade();
    } else if (structure.type === 'support') {
      if (structure.needsBranchChoice() && !branch) return false;
      structure.upgrade(branch);
    }

    this.eventBus.emit(Events.STRUCTURE_SELECTED, structure);
    this.eventBus.emit(Events.STRUCTURE_UPGRADED, structure);
    return true;
  }

  depositToBank(support, amount) {
    if (support.typeId !== 'bank' || amount <= 0 || support.destroyed) return false;
    const capacity = this.economy.supportEffects.getBankStats(support).capacity;
    const space = capacity - support.storedGold;
    const deposit = Math.min(amount, space, this.economy.gold);
    if (deposit <= 0) return false;
    this.economy.spend(deposit);
    support.storedGold += deposit;
    this.eventBus.emit(Events.BANK_CHANGED, support);
    return true;
  }

  withdrawFromBank(support, amount) {
    if (support.typeId !== 'bank' || amount <= 0 || support.destroyed) return false;
    const withdraw = Math.min(amount, support.storedGold);
    if (withdraw <= 0) return false;
    support.storedGold -= withdraw;
    this.economy.earn(withdraw);
    this.eventBus.emit(Events.BANK_CHANGED, support);
    return true;
  }

  recordDestroyed(structure) {
    const key = `${structure.gridX},${structure.gridY}`;
    if (structure.type === 'tower') {
      this.towers = this.towers.filter((t) => t.id !== structure.id);
    } else if (structure.type === 'farm') {
      this.farms = this.farms.filter((f) => f.id !== structure.id);
    } else if (structure.type === 'support') {
      this.supports = this.supports.filter((s) => s.id !== structure.id);
    }
    this.occupied.delete(key);

    const data = {
      structureType: structure.type,
      typeId: structure.typeId,
      gridX: structure.gridX,
      gridY: structure.gridY,
      upgradeTier: structure.upgradeTier,
      masteryXP: structure.masteryXP,
      masterUnlocked: structure.masterUnlocked,
      level: structure.level,
      branch: structure.branch,
      storedGold: structure.storedGold,
    };
    this.destroyedSpots.set(key, data);
  }

  loadStructures(towerData, farmData, supportData = [], bossesDefeated = 0, destroyedData = []) {
    this.towers = [];
    this.farms = [];
    this.supports = [];
    this.occupied.clear();
    this.destroyedSpots.clear();
    this.selectedBuildType = null;
    this.selectedStructure = null;
    this.bossesDefeated = bossesDefeated;

    for (const t of towerData) {
      if (t.destroyed) {
        this.destroyedSpots.set(`${t.gridX},${t.gridY}`, {
          structureType: 'tower',
          typeId: t.typeId,
          gridX: t.gridX,
          gridY: t.gridY,
          upgradeTier: t.upgradeTier,
          masteryXP: t.masteryXP,
          masterUnlocked: t.masterUnlocked,
        });
        continue;
      }
      if (!TOWER_TYPES[t.typeId]) continue;
      const tower = new Tower(t.typeId, t.gridX, t.gridY);
      tower.upgradeTier = t.upgradeTier || 0;
      tower.masteryXP = t.masteryXP || 0;
      tower.masterUnlocked = t.masterUnlocked || false;
      restoreStructureHealth(tower, t.health, t.maxHealth, false);
      this.towers.push(tower);
      this.occupied.set(`${t.gridX},${t.gridY}`, tower);
    }

    for (const f of farmData) {
      if (f.destroyed) {
        this.destroyedSpots.set(`${f.gridX},${f.gridY}`, {
          structureType: 'farm',
          typeId: FARM_CONFIG.id,
          gridX: f.gridX,
          gridY: f.gridY,
          level: f.level,
        });
        continue;
      }
      const farm = new Farm(f.gridX, f.gridY);
      farm.level = f.level || 1;
      restoreStructureHealth(farm, f.health, f.maxHealth, false);
      this.farms.push(farm);
      this.occupied.set(`${f.gridX},${f.gridY}`, farm);
    }

    for (const s of supportData) {
      if (s.destroyed) {
        this.destroyedSpots.set(`${s.gridX},${s.gridY}`, {
          structureType: 'support',
          typeId: s.typeId,
          gridX: s.gridX,
          gridY: s.gridY,
          level: s.level,
          branch: s.branch,
          storedGold: s.storedGold,
        });
        continue;
      }
      if (!SUPPORT_TYPES[s.typeId]) continue;
      const support = new Support(s.typeId, s.gridX, s.gridY);
      support.level = s.level || 1;
      support.branch = s.branch || null;
      support.storedGold = s.storedGold || 0;
      restoreStructureHealth(support, s.health, s.maxHealth, false);
      this.supports.push(support);
      this.occupied.set(`${s.gridX},${s.gridY}`, support);
    }

    this.economy.recalculateIncome(this.farms);

    for (const d of destroyedData) {
      const key = d.key || `${d.gridX},${d.gridY}`;
      this.destroyedSpots.set(key, d);
    }
  }

  getPlacementCost() {
    if (!this.selectedBuildType) return null;
    return this.getBuildCost(this.selectedBuildType);
  }

  reset() {
    this.towers = [];
    this.farms = [];
    this.supports = [];
    this.occupied.clear();
    this.destroyedSpots.clear();
    this.selectedBuildType = null;
    this.selectedStructure = null;
    this.sellMode = false;
    this.bossesDefeated = 0;
    this._applyBuildSpotLimit();
    this.economy.recalculateIncome([]);
  }
}
