import { FARM_CONFIG } from '../config/farmConfig.js';
import { PATHSIDE_EXPANSION_BONUS } from '../config/buildExpansionConfig.js';
import { initStructureHealth } from './StructureHealth.js';

let nextFarmId = 1;

/**
 * Sunpatch entity — generates passive income each wave.
 */
export class Farm {
  constructor(gridX, gridY) {
    this.id = nextFarmId++;
    this.type = 'farm';
    this.typeId = FARM_CONFIG.id;
    this.definition = FARM_CONFIG;
    this.gridX = gridX;
    this.gridY = gridY;
    this.level = 1;
    this.harvestPulse = 0;
    initStructureHealth(this, 'farm');
  }

  getBaseIncome() {
    const base = FARM_CONFIG.incomePerLevel[this.level - 1] || 0;
    if (this.pathsideBonus) {
      return Math.round(base * PATHSIDE_EXPANSION_BONUS.farmIncomeMult);
    }
    return base;
  }

  /** Legacy alias used by economy helpers. */
  getIncome() {
    return this.getBaseIncome();
  }

  canUpgrade() {
    return this.level < FARM_CONFIG.maxLevel;
  }

  upgrade() {
    if (!this.canUpgrade()) return false;
    this.level++;
    return true;
  }

  triggerHarvestPulse() {
    this.harvestPulse = 1;
  }

  updatePulse(dt) {
    if (this.harvestPulse > 0) {
      this.harvestPulse = Math.max(0, this.harvestPulse - dt * 1.5);
    }
  }

  getPixelPosition(tileSize) {
    return {
      x: this.gridX * tileSize + tileSize / 2,
      y: this.gridY * tileSize + tileSize / 2,
    };
  }
}
