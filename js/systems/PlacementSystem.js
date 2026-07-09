import { BUILD_SPOTS } from '../config/gameConfig.js';
import { TOWER_TYPES } from '../config/towerTypes.js';
import { FARM_CONFIG } from '../config/farmConfig.js';
import { Tower } from '../entities/Tower.js';
import { Farm } from '../entities/Farm.js';
import { Events } from '../core/EventBus.js';

/**
 * Handles building towers and farms on valid spots.
 */
export class PlacementSystem {
  constructor(eventBus, economy) {
    this.eventBus = eventBus;
    this.economy = economy;
    this.towers = [];
    this.farms = [];
    this.buildSpots = new Set(BUILD_SPOTS.map((s) => `${s.x},${s.y}`));
    this.occupied = new Map();
    this.selectedBuildType = null;
    this.selectedStructure = null;
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

    return false;
  }

  _placeTower(typeId, gridX, gridY) {
    const def = TOWER_TYPES[typeId];
    if (!this.economy.spend(def.cost)) return false;

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

  upgradeSelected(stat) {
    const structure = this.selectedStructure;
    if (!structure) return false;

    const cost = this.economy.getUpgradeCost(structure, stat);
    if (cost === null || !this.economy.spend(cost)) return false;

    if (structure.type === 'farm') {
      structure.upgrade();
      this.economy.recalculateIncome(this.farms);
    } else if (structure.type === 'tower') {
      structure.upgrade();
    }

    this.eventBus.emit(Events.STRUCTURE_SELECTED, structure);
    return true;
  }

  getPlacementCost() {
    if (!this.selectedBuildType) return null;
    if (this.selectedBuildType === FARM_CONFIG.id) return FARM_CONFIG.cost;
    return TOWER_TYPES[this.selectedBuildType]?.cost ?? null;
  }

  reset() {
    this.towers = [];
    this.farms = [];
    this.occupied.clear();
    this.selectedBuildType = null;
    this.selectedStructure = null;
    this.economy.recalculateIncome([]);
  }
}
