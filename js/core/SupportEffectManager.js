import { SUPPORT_AURA_RADIUS, SUPPORT_TYPES } from '../config/supportConfig.js';

function gridDistance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function isNearby(support, gridX, gridY) {
  return gridDistance(support.gridX, support.gridY, gridX, gridY) <= SUPPORT_AURA_RADIUS;
}

/**
 * Aggregates passive bonuses from support structures.
 */
export class SupportEffectManager {
  constructor() {
    this.global = this._emptyGlobal();
    this._nearbyCache = new Map();
  }

  _emptyGlobal() {
    return {
      goldEarnedMult: 1,
      damageMult: 1,
      rangeMult: 1,
      attackSpeedMult: 1,
      projectileSpeedMult: 1,
      critChance: 0,
      critDamageMult: 1.5,
      armorPen: 0,
      burnDPSAdd: 0,
      slowPercentAdd: 0,
      chainCountAdd: 0,
      upgradeCostMult: 1,
      sellValueMult: 1,
      buildCostMult: 1,
      farmIncomeMult: 1,
      bossRewardMult: 1,
      bankInterestMult: 1,
      crystalMult: 1,
      researchMult: 1,
      killGoldMult: 1,
      slowDurationMult: 1,
      repairSpeedMult: 1,
      repairCostMult: 1,
      eliteGoldMult: 1,
    };
  }

  recalculate(supports, researchMods, investMods, prestigeMods) {
    this.global = this._emptyGlobal();
    this._nearbyCache.clear();

    for (const s of supports) {
      const def = SUPPORT_TYPES[s.typeId];
      if (!def) continue;

      if (s.typeId === 'marketplace') {
        const idx = s.level - 1;
        this.global.goldEarnedMult += def.perLevel.goldEarnedMult[idx] || 0;
      }

      if (s.typeId === 'forge' && s.branch) {
        const branch = def.branches[s.branch];
        const lvl = s.level - 1;
        const pl = branch.perLevel;
        if (pl.projectileSpeedMult) this.global.projectileSpeedMult += pl.projectileSpeedMult * lvl;
        if (pl.attackSpeedMult) this.global.attackSpeedMult += pl.attackSpeedMult * lvl;
        if (pl.critChance) this.global.critChance += pl.critChance * lvl;
        if (pl.critDamageMult) this.global.critDamageMult += pl.critDamageMult * lvl;
        if (pl.armorPen) this.global.armorPen += pl.armorPen * lvl;
        if (pl.burnDPSAdd) this.global.burnDPSAdd += pl.burnDPSAdd * lvl;
        if (pl.slowPercentAdd) this.global.slowPercentAdd += pl.slowPercentAdd * lvl;
        if (pl.chainCountAdd) this.global.chainCountAdd += pl.chainCountAdd * lvl;
      }
    }

    if (researchMods) {
      this.global.damageMult *= researchMods.damageMult ?? 1;
      this.global.rangeMult *= researchMods.rangeMult ?? 1;
      this.global.attackSpeedMult *= researchMods.attackSpeedMult ?? 1;
      this.global.farmIncomeMult *= researchMods.farmIncomeMult ?? 1;
      this.global.buildCostMult *= researchMods.buildCostMult ?? 1;
      this.global.upgradeCostMult *= researchMods.upgradeCostMult ?? 1;
      this.global.sellValueMult *= researchMods.sellValueMult ?? 1;
      this.global.bossRewardMult *= researchMods.bossRewardMult ?? 1;
      this.global.bankInterestMult *= researchMods.bankInterestMult ?? 1;
      this.global.goldEarnedMult *= researchMods.goldEarnedMult ?? 1;
      this.global.killGoldMult *= researchMods.killGoldMult ?? 1;
      this.global.crystalMult *= researchMods.crystalMult ?? 1;
      this.global.researchMult *= researchMods.researchMult ?? 1;
      this.global.critChance += researchMods.critChance ?? 0;
      this.global.projectileSpeedMult *= researchMods.projectileSpeedMult ?? 1;
      this.global.chainCountAdd += Math.floor(researchMods.chainCountAdd ?? 0);
      this.global.burnDPSAdd += researchMods.burnDPSAdd ?? 0;
      this.global.slowPercentAdd = Math.max(this.global.slowPercentAdd, researchMods.slowPercentAdd ?? 0);
      this.global.armorPen += researchMods.armorPen ?? 0;
      this.global.bossDamageMult = (this.global.bossDamageMult ?? 1) * (researchMods.bossDamageMult ?? 1);
      this.global.eliteDamageMult = (this.global.eliteDamageMult ?? 1) * (researchMods.eliteDamageMult ?? 1);
      this.global.slowDurationMult *= researchMods.slowDurationMult ?? 1;
      this.global.repairSpeedMult *= researchMods.repairSpeedMult ?? 1;
      this.global.repairCostMult *= researchMods.repairCostMult ?? 1;
      this.global.eliteGoldMult *= researchMods.eliteGoldMult ?? 1;
    }

    if (investMods) {
      this.global.damageMult *= investMods.damageMult ?? 1;
      this.global.rangeMult *= investMods.rangeMult ?? 1;
      this.global.attackSpeedMult *= investMods.attackSpeedMult ?? 1;
      this.global.projectileSpeedMult *= investMods.projectileSpeedMult ?? 1;
      this.global.farmIncomeMult *= investMods.farmIncomeMult ?? 1;
      this.global.goldEarnedMult *= investMods.goldEarnedMult ?? 1;
      this.global.bossRewardMult *= investMods.bossRewardMult ?? 1;
      this.global.sellValueMult *= investMods.sellValueMult ?? 1;
      this.global.bankInterestMult *= investMods.bankInterestMult ?? 1;
      this.global.crystalMult *= investMods.crystalMult ?? 1;
      this.global.researchMult *= investMods.researchMult ?? 1;
      this.global.critChance += investMods.critChance ?? 0;
      this.global.chainCountAdd += investMods.chainCountAdd ?? 0;
    }

    if (prestigeMods) {
      this.global.damageMult *= prestigeMods.damageMult ?? 1;
      this.global.rangeMult *= prestigeMods.rangeMult ?? 1;
      this.global.attackSpeedMult *= prestigeMods.attackSpeedMult ?? 1;
      this.global.farmIncomeMult *= prestigeMods.farmIncomeMult ?? 1;
      this.global.goldEarnedMult *= prestigeMods.goldEarnedMult ?? 1;
      this.global.bossRewardMult *= prestigeMods.bossRewardMult ?? 1;
      this.global.crystalMult *= prestigeMods.crystalMult ?? 1;
      this.global.researchMult *= prestigeMods.researchMult ?? 1;
    }
  }

  getNearbyMods(support, gridX, gridY) {
    const key = `${support.id}:${gridX},${gridY}`;
    if (this._nearbyCache.has(key)) return this._nearbyCache.get(key);

    const mods = {
      farmIncomeMult: 1,
      damageMult: 1,
      rangeMult: 1,
      attackSpeedMult: 1,
      upgradeCostMult: 1,
      sellValueMult: 1,
      buildCostMult: 1,
    };

    if (!isNearby(support, gridX, gridY)) {
      this._nearbyCache.set(key, mods);
      return mods;
    }

    const def = SUPPORT_TYPES[support.typeId];
    if (support.typeId === 'village' && support.branch) {
      const branch = def.branches[support.branch];
      const lvl = support.level;
      const pl = branch.perLevel;
      if (pl.farmIncomeMult) mods.farmIncomeMult += pl.farmIncomeMult * lvl;
      if (pl.damageMult) mods.damageMult += pl.damageMult * lvl;
      if (pl.attackSpeedMult) mods.attackSpeedMult += pl.attackSpeedMult * lvl;
      if (pl.rangeMult) mods.rangeMult += pl.rangeMult * lvl;
      if (pl.upgradeCostMult) mods.upgradeCostMult += pl.upgradeCostMult * lvl;
      if (pl.sellValueMult) mods.sellValueMult += pl.sellValueMult * lvl;
      if (pl.buildCostMult) mods.buildCostMult += pl.buildCostMult * lvl;
    }

    this._nearbyCache.set(key, mods);
    return mods;
  }

  /** Combine global + village proximity mods for a tower at (gridX, gridY). */
  getTowerMods(supports, gridX, gridY) {
    const mods = { ...this.global };

    for (const s of supports) {
      if (s.typeId !== 'village') continue;
      const nearby = this.getNearbyMods(s, gridX, gridY);
      mods.damageMult *= nearby.damageMult;
      mods.rangeMult *= nearby.rangeMult;
      mods.attackSpeedMult *= nearby.attackSpeedMult;
      mods.upgradeCostMult *= nearby.upgradeCostMult;
      mods.sellValueMult *= nearby.sellValueMult;
      mods.buildCostMult *= nearby.buildCostMult;
    }

    return mods;
  }

  /** Farm income multiplier from nearby economy villages. */
  getFarmMods(supports, gridX, gridY) {
    let mult = this.global.farmIncomeMult;
    for (const s of supports) {
      if (s.typeId !== 'village' || s.branch !== 'economy') continue;
      const nearby = this.getNearbyMods(s, gridX, gridY);
      mult *= nearby.farmIncomeMult;
    }
    return mult;
  }

  getBankStats(support) {
    const def = SUPPORT_TYPES.bank;
    const idx = support.level - 1;
    return {
      capacity: def.perLevel.capacity[idx],
      interestRate: def.perLevel.interestRate[idx],
    };
  }

  getRepairStats(support) {
    const def = SUPPORT_TYPES.repair_station;
    const idx = support.level - 1;
    return {
      healAmount: def.perLevel.lifeHealAmount[idx],
      healInterval: def.perLevel.lifeHealInterval[idx],
    };
  }

  getStructureRepairStats(support) {
    const def = SUPPORT_TYPES.repair_station;
    const idx = support.level - 1;
    const speed = this.global.repairSpeedMult ?? 1;
    return {
      radius: def.perLevel.radius[idx],
      waveRepairAmount: def.perLevel.waveRepairAmount[idx] * speed,
      combatRepairPerSec: def.perLevel.combatRepairPerSec[idx] * speed,
      maxSimultaneous: def.perLevel.maxSimultaneous[idx],
    };
  }

  getCrystalYield(support) {
    const def = SUPPORT_TYPES.crystal_extractor;
    return def.perLevel.crystalsPerWave[support.level - 1] || 0;
  }

  getRpPerWave(supports) {
    let total = 0;
    for (const s of supports) {
      if (s.typeId !== 'research_lab') continue;
      const def = SUPPORT_TYPES.research_lab;
      total += def.perLevel.rpPerWave[s.level - 1] || 0;
    }
    return total;
  }
}
