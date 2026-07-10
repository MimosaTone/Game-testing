import { TOWER_TYPES } from '../config/towerTypes.js';
import {
  TOWER_UPGRADE_PATHS,
  computeTowerStats,
  applyExternalMods,
  getTowerAbilityLabels,
} from '../config/towerUpgradePaths.js';
import {
  getMasteryLevel,
  getMasteryModifiers,
  getMasteryProgress,
  MASTERY_CONFIG,
  MASTER_UPGRADES,
} from '../config/towerMasteryConfig.js';
import { initStructureHealth } from './StructureHealth.js';

let nextTowerId = 1;

/**
 * Tower entity with sequential upgrade path and per-instance mastery.
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
    this.prestigeMods = null;
    this.supportMods = null;
    this.investmentMods = null;
    this.knockbackCooldown = 0;
    this.masteryXP = 0;
    this.masterUnlocked = false;
    this.shotsFired = 0;
    initStructureHealth(this, 'tower');
  }

  get masteryLevel() {
    return getMasteryLevel(this.masteryXP);
  }

  getMasteryProgress() {
    return getMasteryProgress(this.masteryXP);
  }

  awardMasteryXP(amount) {
    const prevLevel = this.masteryLevel;
    this.masteryXP += amount;
    const newLevel = this.masteryLevel;
    const maxLevel = MASTERY_CONFIG.xpThresholds.length - 1;
    if (!this.masterUnlocked && newLevel >= maxLevel) {
      this.masterUnlocked = true;
    }
    return { prevLevel, newLevel, unlockedMaster: this.masterUnlocked && prevLevel < maxLevel };
  }

  getStats() {
    const base = computeTowerStats(
      this.definition,
      this.upgradeTier,
      this.upgradePath,
      this.prestigeMods
    );

    const masteryMods = getMasteryModifiers(this.masteryLevel, this.masterUnlocked, this.typeId);
    const prestigeCombat = this._getPrestigeCombatMods();
    const combined = {
      ...masteryMods,
      ...prestigeCombat,
      ...(this.supportMods || {}),
      ...(this.investmentMods || {}),
    };
    return applyExternalMods(base, combined);
  }

  _getPrestigeCombatMods() {
    const p = this.prestigeMods;
    if (!p) return {};
    const out = {};
    const keys = [
      'armorPen', 'eliteDamageMult', 'splashRadiusMult', 'slowDurationMult',
      'burnDPSAdd', 'bossDamageMult', 'damageMult', 'attackSpeedMult', 'rangeMult',
    ];
    for (const key of keys) {
      const val = p[key];
      if (val === undefined) continue;
      if (key.includes('Mult') && val === 1) continue;
      if (!key.includes('Mult') && val === 0) continue;
      out[key] = val;
    }
    return out;
  }

  getAbilityLabels() {
    const labels = getTowerAbilityLabels(this.getStats());
    if (this.masteryLevel > 0) {
      labels.unshift(`Mastery Lv${this.masteryLevel}`);
    }
    if (this.masterUnlocked && MASTER_UPGRADES[this.typeId]) {
      labels.push(`★ ${MASTER_UPGRADES[this.typeId].name}`);
    }
    return labels;
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
