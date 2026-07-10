import { TOWER_TYPES } from '../config/towerTypes.js';
import {
  TOWER_UPGRADE_PATHS,
  computeTowerStats,
  applyExternalMods,
  getTowerAbilityLabels,
  NEEDLE_BRANCHES,
  NEEDLE_MAX_UPGRADE_TIER,
  getNeedleNextUpgrade,
  getNeedleBranchEntryUpgrade,
  getNeedlePurchasedTierNames,
} from '../config/towerUpgradePaths.js';
import {
  getMasteryLevel,
  getMasteryModifiers,
  getMasteryProgress,
  MASTERY_CONFIG,
  MASTER_UPGRADES,
  NEEDLE_MASTER_UPGRADES,
  getNeedleMasterUpgrade,
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
    /** Needle specialization: rapid_fire | marksman | hunter */
    this.upgradeBranch = null;
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
    this.focusTargetId = null;
    this.focusStacks = 0;
    this.needleStormCooldown = 0;
    this.needleStormActive = 0;
    this.executionShotCooldown = 0;
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
      this.prestigeMods,
      this.upgradeBranch
    );

    const masteryMods = getMasteryModifiers(
      this.masteryLevel,
      this.masterUnlocked,
      this.typeId,
      this.upgradeBranch
    );
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
    if (this.masterUnlocked) {
      if (this.typeId === 'needle' && this.upgradeBranch) {
        const master = getNeedleMasterUpgrade(this.upgradeBranch);
        if (master) labels.push(`★ ${master.name}`);
      } else if (MASTER_UPGRADES[this.typeId]) {
        labels.push(`★ ${MASTER_UPGRADES[this.typeId].name}`);
      }
    }
    if (this.typeId === 'needle' && this.upgradeBranch && NEEDLE_BRANCHES[this.upgradeBranch]) {
      labels.unshift(NEEDLE_BRANCHES[this.upgradeBranch].name);
    }
    return labels;
  }

  getRangePixels(tileSize = 40) {
    return this.getStats().range * tileSize;
  }

  canUpgrade() {
    if (this.typeId === 'needle') {
      return this.upgradeTier < NEEDLE_MAX_UPGRADE_TIER;
    }
    return this.upgradeTier < this.upgradePath.length;
  }

  needsBranchChoice() {
    return this.typeId === 'needle' && this.upgradeTier === 1 && !this.upgradeBranch;
  }

  getNextUpgrade() {
    if (!this.canUpgrade()) return null;
    if (this.typeId === 'needle') {
      return getNeedleNextUpgrade(this.upgradeTier, this.upgradeBranch);
    }
    return this.upgradePath[this.upgradeTier];
  }

  getMaxUpgradeTier() {
    if (this.typeId === 'needle') return NEEDLE_MAX_UPGRADE_TIER;
    return this.upgradePath.length;
  }

  getPurchasedTierNames() {
    if (this.typeId === 'needle') {
      return getNeedlePurchasedTierNames(this.upgradeTier, this.upgradeBranch);
    }
    return this.upgradePath.slice(0, this.upgradeTier).map((t) => t.name);
  }

  upgrade(branch = null) {
    if (!this.canUpgrade()) return false;

    if (this.typeId === 'needle') {
      if (this.needsBranchChoice()) {
        if (!branch || !NEEDLE_BRANCHES[branch]) return false;
        this.upgradeBranch = branch;
        this.upgradeTier++;
        return true;
      }
      if (this.upgradeTier >= 1 && !this.upgradeBranch) return false;
      this.upgradeTier++;
      return true;
    }

    this.upgradeTier++;
    return true;
  }

  getBranchEntryCost(branch) {
    const entry = getNeedleBranchEntryUpgrade(branch);
    return entry?.cost ?? null;
  }

  resetFocusCombo() {
    this.focusTargetId = null;
    this.focusStacks = 0;
  }

  syncFocusTarget(targetId) {
    if (targetId !== this.focusTargetId) {
      this.focusTargetId = targetId;
      this.focusStacks = 0;
    }
  }

  addFocusStack(maxStacks) {
    this.focusStacks = Math.min(maxStacks, this.focusStacks + 1);
  }

  getPixelPosition(tileSize) {
    return {
      x: this.gridX * tileSize + tileSize / 2,
      y: this.gridY * tileSize + tileSize / 2,
    };
  }
}
