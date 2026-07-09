import { SUPPORT_TYPES } from '../config/supportConfig.js';

let nextSupportId = 1;

/**
 * Passive support structure — villages, banks, labs, etc.
 */
export class Support {
  constructor(typeId, gridX, gridY) {
    const def = SUPPORT_TYPES[typeId];
    if (!def) throw new Error(`Unknown support type: ${typeId}`);

    this.id = nextSupportId++;
    this.type = 'support';
    this.typeId = typeId;
    this.definition = def;
    this.gridX = gridX;
    this.gridY = gridY;
    this.level = 1;
    /** Branch for village / forge: economy | military | engineering | velocity | precision | elemental */
    this.branch = null;
    /** Bank-only: gold stored in vault */
    this.storedGold = 0;
    this.pulse = 0;
  }

  canUpgrade() {
    return this.level < this.definition.maxLevel;
  }

  getUpgradeCost() {
    if (!this.canUpgrade()) return null;
    return this.definition.upgradeCosts[this.level - 1];
  }

  upgrade(branch = null) {
    if (!this.canUpgrade()) return false;
    if (this.definition.requiresBranch && this.level === 1 && branch) {
      this.branch = branch;
    }
    this.level++;
    return true;
  }

  needsBranchChoice() {
    return this.definition.requiresBranch && this.level === 1 && !this.branch;
  }

  getPixelPosition(tileSize) {
    return {
      x: this.gridX * tileSize + tileSize / 2,
      y: this.gridY * tileSize + tileSize / 2,
    };
  }

  updatePulse(dt) {
    if (this.pulse > 0) this.pulse = Math.max(0, this.pulse - dt * 2);
  }

  triggerPulse() {
    this.pulse = 1;
  }
}
