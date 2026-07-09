import { PRESTIGE_CONFIG, PRESTIGE_UPGRADES } from '../config/prestigeConfig.js';
import { Events } from './EventBus.js';

/**
 * Manages Bloom Shards, permanent upgrades, and persisted settings.
 */
export class PrestigeManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.data = this._load();
    this.settings = this._loadSettings();
  }

  _load() {
    try {
      const raw = localStorage.getItem(PRESTIGE_CONFIG.storageKey);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { shards: 0, upgrades: {}, totalPrestiges: 0, bestWave: 0 };
  }

  _loadSettings() {
    try {
      const raw = localStorage.getItem(PRESTIGE_CONFIG.settingsKey);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { autoStartWaves: false };
  }

  save() {
    localStorage.setItem(PRESTIGE_CONFIG.storageKey, JSON.stringify(this.data));
  }

  saveSettings() {
    localStorage.setItem(PRESTIGE_CONFIG.settingsKey, JSON.stringify(this.settings));
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
    this.saveSettings();
    this.eventBus.emit(Events.SETTINGS_CHANGED, this.settings);
  }

  recordWave(wave) {
    if (wave > this.data.bestWave) {
      this.data.bestWave = wave;
      this.save();
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
    this.save();
    this.eventBus.emit(Events.PRESTIGE_COMPLETED, { earned, total: this.data.shards });
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
    this.save();
    this.eventBus.emit(Events.PRESTIGE_CHANGED, this.data);
    return true;
  }
}
