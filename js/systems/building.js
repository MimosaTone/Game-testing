import { CELL_SIZE, BuildingCategory } from '../config/constants.js';
import { TOWER_TYPES, getTowerUpgradeCost } from '../config/towerTypes.js';
import { FARM_TYPE, getFarmUpgradeCost } from '../config/farmTypes.js';
import { Tower } from '../entities/tower.js';
import { Farm } from '../entities/farm.js';

/**
 * Handles placement, selection, and upgrades for towers and farms.
 */
export class BuildingSystem {
  constructor(pathSystem) {
    this.pathSystem = pathSystem;
    this.buildings = [];
    this.occupancy = new Map();
    this.selectedBuilding = null;
    this.buildMode = null;
  }

  setBuildMode(mode) {
    this.buildMode = mode;
    this.selectedBuilding = null;
  }

  clearBuildMode() {
    this.buildMode = null;
  }

  getCellKey(col, row) {
    return `${col},${row}`;
  }

  getBuildingAt(col, row) {
    return this.occupancy.get(this.getCellKey(col, row)) || null;
  }

  canPlace(col, row) {
    if (!this.pathSystem.isValidBuildCell(col, row)) return false;
    return !this.occupancy.has(this.getCellKey(col, row));
  }

  placeBuilding(col, row, economy) {
    if (!this.buildMode) return null;

    const { category, typeDef } = this.buildMode;
    if (!this.canPlace(col, row)) return null;
    if (!economy.canAfford(typeDef.cost)) return null;

    economy.spend(typeDef.cost);

    let building;
    if (category === BuildingCategory.TOWER) {
      building = new Tower(typeDef, col, row);
    } else {
      building = new Farm(typeDef, col, row);
    }

    this.buildings.push(building);
    this.occupancy.set(this.getCellKey(col, row), building);
    return building;
  }

  selectBuilding(building) {
    this.selectedBuilding = building;
    this.buildMode = null;
  }

  clearSelection() {
    this.selectedBuilding = null;
  }

  upgradeSelected(economy) {
    const building = this.selectedBuilding;
    if (!building) return false;

    const cost = this.getUpgradeCost(building);
    if (!economy.canAfford(cost)) return false;
    if (building.level >= building.typeDef.maxLevel) return false;

    economy.spend(cost);
    building.upgrade();
    return true;
  }

  getUpgradeCost(building) {
    if (building.category === 'farm') {
      return getFarmUpgradeCost(building.typeDef, building.level);
    }
    return getTowerUpgradeCost(building.typeDef, building.level);
  }

  getTotalIncomePerWave() {
    return this.buildings
      .filter((b) => b.category === 'farm')
      .reduce((sum, farm) => sum + farm.incomePerWave, 0);
  }

  getBuildOptions() {
    const towers = Object.values(TOWER_TYPES).map((typeDef) => ({
      category: BuildingCategory.TOWER,
      typeDef,
      id: typeDef.id,
    }));

    const farms = [{
      category: BuildingCategory.FARM,
      typeDef: FARM_TYPE,
      id: FARM_TYPE.id,
    }];

    return [...towers, ...farms];
  }

  screenToCell(x, y) {
    return {
      col: Math.floor(x / CELL_SIZE),
      row: Math.floor(y / CELL_SIZE),
    };
  }

  drawBuildPreview(ctx, col, row) {
    if (!this.buildMode) return;

    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;
    const valid = this.canPlace(col, row);

    ctx.save();
    ctx.fillStyle = valid ? 'rgba(46, 204, 113, 0.35)' : 'rgba(231, 76, 60, 0.25)';
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
    if (valid) {
      ctx.strokeStyle = 'rgba(46, 204, 113, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    }
    ctx.restore();
  }
}
