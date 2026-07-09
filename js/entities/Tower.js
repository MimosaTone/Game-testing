import { TOWER_TYPES } from '../config/towerTypes.js';
import {
  TOWER_UPGRADE_PATHS,
  computeTowerStats,
  getTowerAbilityLabels,
} from '../config/towerUpgradePaths.js';

let nextTowerId = 1;

/**
 * Tower entity with a sequential upgrade path.
 */
export class Tower {
  constructor(typeId, gridX, gridY) {
    const def = TOWER_TYPES[typeId];
    if (!def) throw new Error(`Unknown tower type: ${typeId}`);

    this.id = nextTowerId++;
    this.type = 'tower';
    this.typeId = typeId;
    this.definition = def;
    this.upgradePath = TOWER_UPGRADE_PATHS[typeId] || [];
    this.upgradeTier = 0;
    this.gridX = gridX;
    this.gridY = gridY;
    this.cooldown = 0;
    this.target = null;
    this.angle = 0;
  }

  getStats() {
    return computeTowerStats(this.definition, this.upgradeTier, this.upgradePath);
  }

  getAbilityLabels() {
    return getTowerAbilityLabels(this.getStats());
  }

  getRangePixels(tileSize = 40) {
    return this.getStats().range * tileSize;
  }

  canUpgrade() {
    return this.upgradeTier < this.upgradePath.length;
  }

  getNextUpgrade() {
    return this.canUpgrade() ? this.upgradePath[this.upgradeTier] : null;
  }

  upgrade() {
    if (!this.canUpgrade()) return false;
    this.upgradeTier++;
    return true;
  }

  getPixelPosition(tileSize) {
    return {
      x: this.gridX * tileSize + tileSize / 2,
      y: this.gridY * tileSize + tileSize / 2,
    };
  }
}
