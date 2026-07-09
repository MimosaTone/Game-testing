import { SAVE_CONFIG } from '../config/saveConfig.js';

const DEFAULT_META = {
  shards: 0,
  upgrades: {},
  totalPrestiges: 0,
  bestWave: 0,
  settings: { autoStartWaves: false },
};

/** Validate saved run payload before use. */
function isValidRun(run) {
  if (!run || typeof run !== 'object') return false;
  if (typeof run.wave !== 'number' || typeof run.gold !== 'number' || typeof run.lives !== 'number') return false;
  if (!Array.isArray(run.towers) || !Array.isArray(run.farms)) return false;
  if (!Array.isArray(run.supports)) run.supports = [];
  if (run.lives <= 0) return false;
  return true;
}

function migrateV1ToV2(data) {
  if (data.version !== 1) return data;
  if (data.run) {
    data.run.supports = data.run.supports || [];
    data.run.crystals = data.run.crystals || 0;
    data.run.research = data.run.research || { points: 0, levels: {} };
    data.run.bossesDefeated = data.run.bossesDefeated || 0;
    data.run.wavesSinceRepair = data.run.wavesSinceRepair || 0;
    for (const t of data.run.towers) {
      t.masteryXP = t.masteryXP || 0;
      t.masterUnlocked = t.masterUnlocked || false;
    }
  }
  data.version = 2;
  return data;
}

/**
 * Serializes and persists game state to localStorage.
 * Only saves run data during the planning phase (between waves).
 */
export class SaveManager {
  constructor() {
    this._data = this._loadOrCreate();
    if (this._data.run && !isValidRun(this._data.run)) {
      this._data.run = null;
      this._write(this._data);
    }
  }

  _loadOrCreate() {
    try {
      const raw = localStorage.getItem(SAVE_CONFIG.storageKey);
      if (raw) {
        let parsed = JSON.parse(raw);
        if (parsed.version === 1) parsed = migrateV1ToV2(parsed);
        if (parsed.version === SAVE_CONFIG.version) return parsed;
      }
    } catch { /* ignore corrupt save */ }

    const migrated = this._migrateLegacy();
    if (migrated) return migrated;

    return {
      version: SAVE_CONFIG.version,
      meta: { ...DEFAULT_META, settings: { ...DEFAULT_META.settings } },
      run: null,
    };
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
    try {
      localStorage.setItem(SAVE_CONFIG.storageKey, JSON.stringify(data));
    } catch { /* storage full or unavailable */ }
  }

  get meta() {
    return this._data.meta;
  }

  setMeta(meta) {
    this._data.meta = meta;
    this._write(this._data);
  }

  hasContinuableRun() {
    return isValidRun(this._data.run);
  }

  getRunSummary() {
    const run = this._data.run;
    if (!isValidRun(run)) return null;
    return {
      wave: run.wave,
      gold: run.gold,
      lives: run.lives,
      towerCount: run.towers.length,
      farmCount: run.farms.length,
      supportCount: run.supports.length,
      crystals: run.crystals || 0,
    };
  }

  serializeRun(game) {
    if (game.phase !== 'planning' || game.lives <= 0) return null;

    const hasProgress =
      game.waveManager.waveNumber > 0 ||
      game.placementSystem.towers.length > 0 ||
      game.placementSystem.farms.length > 0 ||
      game.placementSystem.supports.length > 0;

    if (!hasProgress) return null;

    return {
      wave: game.waveManager.waveNumber,
      gold: game.economy.gold,
      lives: game.lives,
      crystals: game.economy.crystals,
      bossesDefeated: game.placementSystem.bossesDefeated,
      wavesSinceRepair: game.wavesSinceRepair,
      research: game.researchManager.toRunData(),
      towers: game.placementSystem.towers.map((t) => ({
        typeId: t.typeId,
        gridX: t.gridX,
        gridY: t.gridY,
        upgradeTier: t.upgradeTier,
        masteryXP: t.masteryXP,
        masterUnlocked: t.masterUnlocked,
      })),
      farms: game.placementSystem.farms.map((f) => ({
        gridX: f.gridX,
        gridY: f.gridY,
        level: f.level,
      })),
      supports: game.placementSystem.supports.map((s) => ({
        typeId: s.typeId,
        gridX: s.gridX,
        gridY: s.gridY,
        level: s.level,
        branch: s.branch,
        storedGold: s.storedGold,
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

  save(game) {
    this._data.meta = this.serializeMeta(game);
    this._data.run = this.serializeRun(game);
    this._data.savedAt = Date.now();
    this._write(this._data);
  }

  saveMeta(game) {
    this._data.meta = this.serializeMeta(game);
    this._data.run = null;
    this._data.savedAt = Date.now();
    this._write(this._data);
  }

  getRunData() {
    return isValidRun(this._data.run) ? this._data.run : null;
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
    try {
      localStorage.removeItem(SAVE_CONFIG.legacyPrestigeKey);
      localStorage.removeItem(SAVE_CONFIG.legacySettingsKey);
    } catch { /* ignore */ }
  }
}
