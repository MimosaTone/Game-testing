import { FARM_CONFIG } from '../config/farmConfig.js';

let nextFarmId = 1;

/**
 * Farm entity — generates passive income each wave.
 */
export class Farm {
  constructor(gridX, gridY) {
    this.id = nextFarmId++;
    this.type = 'farm';
    this.typeId = 'farm';
    this.definition = FARM_CONFIG;
    this.gridX = gridX;
    this.gridY = gridY;
    this.level = 1;
  }

  getIncome() {
    return FARM_CONFIG.incomePerLevel[this.level - 1] || 0;
  }

  canUpgrade() {
    return this.level < FARM_CONFIG.maxLevel;
  }

  upgrade() {
    if (!this.canUpgrade()) return false;
    this.level++;
    return true;
  }

  getPixelPosition(tileSize) {
    return {
      x: this.gridX * tileSize + tileSize / 2,
      y: this.gridY * tileSize + tileSize / 2,
    };
  }
}
