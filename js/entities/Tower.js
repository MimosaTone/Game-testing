import { TOWER_TYPES } from '../config/towerTypes.js';

let nextTowerId = 1;

/**
 * Tower entity with upgradeable stats.
 */
export class Tower {
  constructor(typeId, gridX, gridY) {
    const def = TOWER_TYPES[typeId];
    if (!def) throw new Error(`Unknown tower type: ${typeId}`);

    this.id = nextTowerId++;
    this.type = 'tower';
    this.typeId = typeId;
    this.definition = def;
    this.gridX = gridX;
    this.gridY = gridY;
    this.upgrades = { damage: 0, range: 0, attackSpeed: 0 };
    this.cooldown = 0;
    this.target = null;
    this.angle = 0;
  }

  getStats() {
    const def = this.definition;
    const base = def.baseStats;

    let damage = base.damage;
    let range = base.range;
    let attackSpeed = base.attackSpeed;

    for (let i = 0; i < this.upgrades.damage; i++) {
      damage *= def.upgradeMultipliers.damage;
    }
    for (let i = 0; i < this.upgrades.range; i++) {
      range *= def.upgradeMultipliers.range;
    }
    for (let i = 0; i < this.upgrades.attackSpeed; i++) {
      attackSpeed *= def.upgradeMultipliers.attackSpeed;
    }

    const splashRadius = base.splashRadius
      ? base.splashRadius + this.upgrades.damage * (def.splashRadiusGrowth || 0)
      : 0;

    return { damage, range, attackSpeed, splashRadius };
  }

  getRangePixels() {
    return this.getStats().range * 40;
  }

  canUpgrade(stat) {
    return this.upgrades[stat] < this.definition.maxUpgradeLevel;
  }

  upgrade(stat) {
    if (!this.canUpgrade(stat)) return false;
    this.upgrades[stat]++;
    return true;
  }

  getPixelPosition(tileSize) {
    return {
      x: this.gridX * tileSize + tileSize / 2,
      y: this.gridY * tileSize + tileSize / 2,
    };
  }
}
