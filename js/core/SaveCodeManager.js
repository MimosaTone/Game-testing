import { SAVE_CONFIG } from '../config/saveConfig.js';
import { isValidRun, migrateSave } from './SaveManager.js';

const PLANNING_PHASE = 'planning';

function encodeBase64Utf8(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function decodeBase64Utf8(encoded) {
  return decodeURIComponent(escape(atob(encoded)));
}

function normalizeMeta(meta) {
  return {
    shards: meta?.shards ?? 0,
    upgrades: { ...(meta?.upgrades ?? {}) },
    totalPrestiges: meta?.totalPrestiges ?? 0,
    bestWave: meta?.bestWave ?? 0,
    settings: {
      autoStartWaves: meta?.settings?.autoStartWaves ?? false,
      preferredSpeed: meta?.settings?.preferredSpeed ?? 1,
    },
  };
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Save code is not a valid game save.' };
  }

  if (payload.format !== SAVE_CONFIG.saveCodeFormat) {
    return { ok: false, error: 'This code is not a Meadow Defense save.' };
  }

  if (typeof payload.version !== 'number') {
    return { ok: false, error: 'Save code is missing a version number.' };
  }

  if (payload.version > SAVE_CONFIG.version) {
    return { ok: false, error: 'This save code was created in a newer version of the game.' };
  }

  if (!payload.meta || typeof payload.meta !== 'object') {
    return { ok: false, error: 'Save code is missing prestige and settings data.' };
  }

  if (payload.run != null && !isValidRun(payload.run)) {
    return { ok: false, error: 'Save code contains invalid or expired run data.' };
  }

  return {
    ok: true,
    payload: {
      format: payload.format,
      version: payload.version,
      exportedAt: payload.exportedAt ?? null,
      meta: normalizeMeta(payload.meta),
      run: payload.run ?? null,
    },
  };
}

/**
 * Encodes/decodes portable Base64 save codes for manual backup and transfer.
 */
export class SaveCodeManager {
  constructor(saveManager) {
    this.saveManager = saveManager;
  }

  canTransfer(game) {
    return game.phase === PLANNING_PHASE;
  }

  exportCode(game) {
    if (!this.canTransfer(game)) {
      return {
        ok: false,
        error: 'Save codes can only be exported between waves during the planning phase.',
      };
    }

    if (game.lives <= 0) {
      return { ok: false, error: 'Cannot export a finished run. Start a new run first.' };
    }

    const built = this.saveManager.buildExportPayload(game);
    if (!built.ok) return built;

    const json = JSON.stringify(built.payload);
    const code = `${SAVE_CONFIG.saveCodePrefix}${encodeBase64Utf8(json)}`;
    return { ok: true, code, summary: this._summarize(built.payload) };
  }

  parseCode(rawCode) {
    const trimmed = (rawCode || '').trim();
    if (!trimmed) {
      return { ok: false, error: 'Paste a save code to import.' };
    }

    const prefix = SAVE_CONFIG.saveCodePrefix;
    const payloadPart = trimmed.startsWith(prefix) ? trimmed.slice(prefix.length) : trimmed;

    let json;
    try {
      json = decodeBase64Utf8(payloadPart.replace(/\s+/g, ''));
    } catch {
      return { ok: false, error: 'Save code could not be decoded. Check that you copied the full code.' };
    }

    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch {
      return { ok: false, error: 'Save code contains invalid data.' };
    }

    const migrated = migrateSave({
      version: parsed.version,
      meta: parsed.meta,
      run: parsed.run,
    });

    const wrapped = {
      format: parsed.format ?? SAVE_CONFIG.saveCodeFormat,
      version: migrated.version,
      exportedAt: parsed.exportedAt ?? null,
      meta: migrated.meta ?? parsed.meta,
      run: migrated.run ?? parsed.run ?? null,
    };

    return validatePayload(wrapped);
  }

  importCode(game, rawCode) {
    if (!this.canTransfer(game)) {
      return {
        ok: false,
        error: 'Save codes can only be imported between waves during the planning phase.',
      };
    }

    const parsed = this.parseCode(rawCode);
    if (!parsed.ok) return parsed;

    return { ok: true, payload: parsed.payload, summary: this._summarize(parsed.payload) };
  }

  _summarize(payload) {
    const run = payload.run;
    if (!run) {
      return {
        wave: 0,
        gold: 0,
        lives: 0,
        crystals: 0,
        researchPoints: payload.meta?.research?.points ?? 0,
        shards: payload.meta?.shards ?? 0,
        towerCount: 0,
        farmCount: 0,
        supportCount: 0,
        runIncluded: false,
      };
    }

    return {
      wave: run.wave,
      gold: run.gold,
      lives: run.lives,
      crystals: run.crystals || 0,
      researchPoints: run.research?.points ?? 0,
      shards: payload.meta?.shards ?? 0,
      towerCount: run.towers?.length ?? 0,
      farmCount: run.farms?.length ?? 0,
      supportCount: run.supports?.length ?? 0,
      runIncluded: true,
    };
  }
}
