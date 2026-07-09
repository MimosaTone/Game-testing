import { SAVE_CONFIG } from '../config/saveConfig.js';
import { PRESTIGE_CONFIG } from '../config/prestigeConfig.js';
import { Phase } from './Game.js';

const DEFAULT_META = {
  shards: 0,
  upgrades: {},
  totalPrestiges: 0,
  bestWave: 0,
  settings: { autoStartWaves: false },
};

/**
 * Serializes and persists game state to localStorage.
 * Only saves run data during the planning phase (between waves).
 */
export class SaveManager {
  constructor() {
    this._data = this._loadOrCreate();
  }

  _loadOrCreate() {
    try {
      const raw = localStorage.getItem(SAVE_CONFIG.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.version === SAVE_CONFIG.version) return parsed;
      }
    } catch { /* ignore corrupt save */ }

    const migrated = this._migrateLegacy();
    if (migrated) return migrated;

    return { version: SAVE_CONFIG.version, meta: { ...DEFAULT_META, settings: { ...DEFAULT_META.settings } }, run: null };
  }

  _migrateLegacy() {
    try {
      const prestigeRaw = localStorage.getItem(SAVE_CONFIG.legacyPrestigeKey);
      const settingsRaw = localStorage.getItem(SAVE_CONFIG.legacySettingsKey);
      if (!prestigeRaw && !settingsRaw) return null;

      const meta = { ...DEFAULT_META, settings: { ...DEFAULT_META.settings } };
      if (prestigeRaw) Object.assign(meta, JSON.parse(prestigeRaw));
      if (settingsRaw) Object.assign(meta.settings, JSON.parse(settingsRaw));

      const data = { version: SAVE_CONFIG.version, meta, run: null };
      this._write(data);
      return data;
    } catch {
      return null;
    }
  }

  _write(data) {
    this._data = data;
    localStorage.setItem(SAVE_CONFIG.storageKey, JSON.stringify(data));
  }

  get meta() {
    return this._data.meta;
  }

  setMeta(meta) {
    this._data.meta = meta;
    this._write(this._data);
  }

  hasContinuableRun() {
    return this._data.run !== null && this._data.run.lives > 0;
  }

  getRunSummary() {
    const run = this._data.run;
    if (!run) return null;
    return {
      wave: run.wave,
      gold: run.gold,
      lives: run.lives,
      towerCount: run.towers.length,
      farmCount: run.farms.length,
    };
  }

  /** Serialize current game state. Returns null if run should not be saved. */
  serializeRun(game) {
    if (game.phase !== Phase.PLANNING || game.lives <= 0) return null;

    const hasProgress =
      game.waveManager.waveNumber > 0 ||
      game.placementSystem.towers.length > 0 ||
      game.placementSystem.farms.length > 0;

    if (!hasProgress) return null;

    return {
      wave: game.waveManager.waveNumber,
      gold: game.economy.gold,
      lives: game.lives,
      towers: game.placementSystem.towers.map((t) => ({
        typeId: t.typeId,
        gridX: t.gridX,
        gridY: t.gridY,
        upgradeTier: t.upgradeTier,
      })),
      farms: game.placementSystem.farms.map((f) => ({
        gridX: f.gridX,
        gridY: f.gridY,
        level: f.level,
      })),
    };
  }

  serializeMeta(game) {
    const pm = game.prestigeManager;
    return {
      shards: pm.data.shards,
      upgrades: { ...pm.data.upgrades },
      totalPrestiges: pm.data.totalPrestiges,
      bestWave: pm.data.bestWave,
      settings: { autoStartWaves: pm.autoStartWaves },
    };
  }

  /** Persist meta and run (if in planning phase). */
  save(game) {
    this._data.meta = this.serializeMeta(game);
    this._data.run = this.serializeRun(game);
    this._data.savedAt = Date.now();
    this._write(this._data);
  }

  /** Save meta only — used on game over or when clearing the run. */
  saveMeta(game) {
    this._data.meta = this.serializeMeta(game);
    this._data.run = null;
    this._data.savedAt = Date.now();
    this._write(this._data);
  }

  getRunData() {
    return this._data.run;
  }

  clearRun() {
    this._data.run = null;
    this._write(this._data);
  }

  clearAll() {
    this._data = {
      version: SAVE_CONFIG.version,
      meta: { ...DEFAULT_META, settings: { ...DEFAULT_META.settings } },
      run: null,
    };
    this._write(this._data);
    localStorage.removeItem(SAVE_CONFIG.legacyPrestigeKey);
    localStorage.removeItem(SAVE_CONFIG.legacySettingsKey);
  }
}
