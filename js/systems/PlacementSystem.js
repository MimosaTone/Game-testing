import { BUILD_SPOTS } from '../config/gameConfig.js';
import { TOWER_TYPES } from '../config/towerTypes.js';
import { FARM_CONFIG } from '../config/farmConfig.js';
import { SUPPORT_TYPES } from '../config/supportConfig.js';
import { Tower } from '../entities/Tower.js';
import { Farm } from '../entities/Farm.js';
import { Support } from '../entities/Support.js';
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
    this.buildSpots = new Set(BUILD_SPOTS.map((s) => `${s.x},${s.y}`));
    this.occupied = new Map();
    this.selectedBuildType = null;
    this.selectedStructure = null;
    this.bossesDefeated = 0;
  }

  isBuildSpot(gridX, gridY) {
    return this.buildSpots.has(`${gridX},${gridY}`);
  }

  isOccupied(gridX, gridY) {
    return this.occupied.has(`${gridX},${gridY}`);
  }

  setBuildType(typeId) {
    this.selectedBuildType = typeId;
    this.selectedStructure = null;
    this.eventBus.emit(Events.STRUCTURE_SELECTED, null);
  }

  selectStructure(gridX, gridY) {
    const key = `${gridX},${gridY}`;
    const structure = this.occupied.get(key) || null;
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

  tryPlace(gridX, gridY) {
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

  upgradeSelected(stat, branch = null) {
    const structure = this.selectedStructure;
    if (!structure) return false;

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
    if (support.typeId !== 'bank' || amount <= 0) return false;
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
    if (support.typeId !== 'bank' || amount <= 0) return false;
    const withdraw = Math.min(amount, support.storedGold);
    if (withdraw <= 0) return false;
    support.storedGold -= withdraw;
    this.economy.earn(withdraw);
    this.eventBus.emit(Events.BANK_CHANGED, support);
    return true;
  }

  loadStructures(towerData, farmData, supportData = [], bossesDefeated = 0) {
    this.towers = [];
    this.farms = [];
    this.supports = [];
    this.occupied.clear();
    this.selectedBuildType = null;
    this.selectedStructure = null;
    this.bossesDefeated = bossesDefeated;

    for (const t of towerData) {
      if (!TOWER_TYPES[t.typeId]) continue;
      const tower = new Tower(t.typeId, t.gridX, t.gridY);
      tower.upgradeTier = t.upgradeTier || 0;
      tower.masteryXP = t.masteryXP || 0;
      tower.masterUnlocked = t.masterUnlocked || false;
      this.towers.push(tower);
      this.occupied.set(`${t.gridX},${t.gridY}`, tower);
    }

    for (const f of farmData) {
      const farm = new Farm(f.gridX, f.gridY);
      farm.level = f.level || 1;
      this.farms.push(farm);
      this.occupied.set(`${f.gridX},${f.gridY}`, farm);
    }

    for (const s of supportData) {
      if (!SUPPORT_TYPES[s.typeId]) continue;
      const support = new Support(s.typeId, s.gridX, s.gridY);
      support.level = s.level || 1;
      support.branch = s.branch || null;
      support.storedGold = s.storedGold || 0;
      this.supports.push(support);
      this.occupied.set(`${s.gridX},${s.gridY}`, support);
    }

    this.economy.recalculateIncome(this.farms);
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
    this.selectedBuildType = null;
    this.selectedStructure = null;
    this.bossesDefeated = 0;
    this.economy.recalculateIncome([]);
  }
}
