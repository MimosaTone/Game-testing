import { PRESTIGE_CONFIG, PRESTIGE_UPGRADES } from '../config/prestigeConfig.js';
import { Events } from './EventBus.js';

const DEFAULT_DATA = {
  shards: 0,
  upgrades: {},
  totalPrestiges: 0,
  bestWave: 0,
};

const DEFAULT_SETTINGS = { autoStartWaves: false };

/**
 * Manages Bloom Shards, permanent upgrades, and persisted settings.
 * Persistence is handled by SaveManager — this class holds runtime state.
 */
export class PrestigeManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.data = { ...DEFAULT_DATA };
    this.settings = { ...DEFAULT_SETTINGS };
  }

  loadFromMeta(meta) {
    if (!meta) return;
    this.data = {
      shards: meta.shards ?? 0,
      upgrades: meta.upgrades ?? {},
      totalPrestiges: meta.totalPrestiges ?? 0,
      bestWave: meta.bestWave ?? 0,
    };
    this.settings = { ...DEFAULT_SETTINGS, ...meta.settings };
  }

  get shards() {
    return this.data.shards;
  }

  get totalPrestiges() {
    return this.data.totalPrestiges;
  }

  get bestWave() {
    return this.data.bestWave;
  }

  get autoStartWaves() {
    return this.settings.autoStartWaves;
  }

  set autoStartWaves(value) {
    this.settings.autoStartWaves = value;
    this.eventBus.emit(Events.SETTINGS_CHANGED, this.settings);
  }

  recordWave(wave) {
    if (wave > this.data.bestWave) {
      this.data.bestWave = wave;
    }
  }

  canPrestige(waveNumber) {
    return waveNumber >= PRESTIGE_CONFIG.unlockWave;
  }

  getUpgradeLevel(id) {
    return this.data.upgrades[id] || 0;
  }

  getModifiers() {
    const mods = {
      farmIncomeMult: 1,
      bonusStartingGold: 0,
      bonusStartingLives: 0,
      towerDamageMult: 1,
      waveBonusMult: 1,
    };

    for (const upgrade of Object.values(PRESTIGE_UPGRADES)) {
      const level = this.getUpgradeLevel(upgrade.id);
      if (level > 0) {
        const effect = upgrade.effect(level);
        if (effect.farmIncomeMult) mods.farmIncomeMult *= effect.farmIncomeMult;
        if (effect.bonusStartingGold) mods.bonusStartingGold += effect.bonusStartingGold;
        if (effect.bonusStartingLives) mods.bonusStartingLives += effect.bonusStartingLives;
        if (effect.towerDamageMult) mods.towerDamageMult *= effect.towerDamageMult;
        if (effect.waveBonusMult) mods.waveBonusMult *= effect.waveBonusMult;
      }
    }

    return mods;
  }

  calculateShardsForWave(waveReached) {
    return PRESTIGE_CONFIG.calculateShards(waveReached);
  }

  prestige(waveReached) {
    const earned = this.calculateShardsForWave(waveReached);
    this.data.shards += earned;
    this.data.totalPrestiges++;
    this.recordWave(waveReached);
    this.eventBus.emit(Events.PRESTIGE_COMPLETED, { earned, total: this.data.shards });
    this.eventBus.emit(Events.PRESTIGE_CHANGED, this.data);
    return earned;
  }

  canPurchaseUpgrade(id) {
    const def = PRESTIGE_UPGRADES[id];
    if (!def) return false;
    const level = this.getUpgradeLevel(id);
    if (level >= def.maxLevel) return false;
    return this.data.shards >= def.cost;
  }

  purchaseUpgrade(id) {
    const def = PRESTIGE_UPGRADES[id];
    if (!def || !this.canPurchaseUpgrade(id)) return false;

    this.data.shards -= def.cost;
    this.data.upgrades[id] = this.getUpgradeLevel(id) + 1;
    this.eventBus.emit(Events.PRESTIGE_CHANGED, this.data);
    return true;
  }

  resetAll() {
    this.data = { ...DEFAULT_DATA };
    this.settings = { ...DEFAULT_SETTINGS };
  }
}
