import {
  CHALLENGE_MODIFIERS,
  CHALLENGE_PRESETS,
} from '../config/challengeConfig.js?v=20260710j';
import { Events } from './EventBus.js';

/**
 * Tracks active challenge modifiers and computes combined difficulty/reward effects.
 */
export class ChallengeManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.active = new Set();
    this.presetId = 'normal';
    this.locked = false;
  }

  loadFromRun(data) {
    this.active = new Set(data?.active ?? []);
    this.presetId = data?.presetId ?? 'custom';
    this.locked = false;
    if (this.active.size === 0) this.presetId = 'normal';
    else if (!this.presetId) this.presetId = 'custom';
  }

  toRunData() {
    return {
      active: [...this.active],
      presetId: this.presetId,
      locked: false,
    };
  }

  reset() {
    this.active.clear();
    this.presetId = 'normal';
    this.locked = false;
    this._emit();
  }

  lockForRun() {
    // Legacy no-op — challenges stay editable for the whole run.
  }

  canEdit(gamePhase = 'planning') {
    return gamePhase !== 'game_over';
  }

  applyPreset(presetId, gamePhase = 'planning') {
    if (!this.canEdit(gamePhase)) return false;
    const preset = CHALLENGE_PRESETS[presetId];
    if (!preset) return false;
    return this._setActiveModifiers(preset.modifiers, presetId);
  }

  applyCustomPreset(modifiers, presetId = 'custom', gamePhase = 'planning') {
    if (!this.canEdit(gamePhase)) return false;
    return this._setActiveModifiers(modifiers, presetId);
  }

  _setActiveModifiers(modifierIds, presetId) {
    this.active.clear();
    for (const id of modifierIds) {
      if (CHALLENGE_MODIFIERS[id]) this.active.add(id);
    }
    this.presetId = presetId;
    this._emit();
    return true;
  }

  toggleModifier(id, gamePhase = 'planning') {
    if (!this.canEdit(gamePhase)) return false;
    const mod = CHALLENGE_MODIFIERS[id];
    if (!mod) return false;

    if (this.active.has(id)) {
      this.active.delete(id);
    } else {
      if (mod.group) {
        for (const activeId of [...this.active]) {
          const other = CHALLENGE_MODIFIERS[activeId];
          if (other?.group === mod.group) this.active.delete(activeId);
        }
      }
      this.active.add(id);
    }

    this.presetId = this._detectBuiltinPreset() ?? 'custom';
    this._emit();
    return true;
  }

  _detectBuiltinPreset() {
    for (const [id, preset] of Object.entries(CHALLENGE_PRESETS)) {
      if (id === 'normal' && this.active.size === 0) return 'normal';
      if (
        preset.modifiers.length === this.active.size &&
        preset.modifiers.every((m) => this.active.has(m))
      ) {
        return id;
      }
    }
    return null;
  }

  getPresetDisplayName(customPresets = []) {
    const builtin = CHALLENGE_PRESETS[this.presetId];
    if (builtin) return builtin.name;
    const custom = customPresets.find((p) => p.id === this.presetId);
    return custom?.name ?? 'Custom';
  }

  getEffects() {
    const fx = {
      enemyHealthMult: 1,
      enemySpeedMult: 1,
      enemyCountMult: 1,
      bossHealthMult: 1,
      bossEmpowered: false,
      doubleBoss: false,
      farmIncomeMult: 1,
      killGoldMult: 1,
      bossGoldMult: 1,
      buildSpotMult: 1,
      livesReduction: 0,
      autoStartDelayMult: 1,
      eliteSpawnMult: 1,
      spawnSpecialEnemies: false,
    };

    for (const id of this.active) {
      const mod = CHALLENGE_MODIFIERS[id];
      if (!mod?.effects) continue;
      const e = mod.effects;
      if (e.enemyHealthMult) fx.enemyHealthMult *= e.enemyHealthMult;
      if (e.enemySpeedMult) fx.enemySpeedMult *= e.enemySpeedMult;
      if (e.enemyCountMult) fx.enemyCountMult *= e.enemyCountMult;
      if (e.bossHealthMult) fx.bossHealthMult *= e.bossHealthMult;
      if (e.bossEmpowered) fx.bossEmpowered = true;
      if (e.doubleBoss) fx.doubleBoss = true;
      if (e.farmIncomeMult) fx.farmIncomeMult *= e.farmIncomeMult;
      if (e.killGoldMult) fx.killGoldMult *= e.killGoldMult;
      if (e.bossGoldMult) fx.bossGoldMult *= e.bossGoldMult;
      if (e.buildSpotMult) fx.buildSpotMult *= e.buildSpotMult;
      if (e.livesReduction) fx.livesReduction += e.livesReduction;
      if (e.autoStartDelayMult) fx.autoStartDelayMult *= e.autoStartDelayMult;
      if (e.eliteSpawnMult) fx.eliteSpawnMult *= e.eliteSpawnMult;
      if (e.spawnSpecialEnemies) fx.spawnSpecialEnemies = true;
    }

    return fx;
  }

  getRewardMultiplier() {
    let bonus = 1;
    for (const id of this.active) {
      bonus += CHALLENGE_MODIFIERS[id]?.rewardBonus ?? 0;
    }
    return bonus;
  }

  getDifficultyRating() {
    const fx = this.getEffects();
    let score = 0;
    score += Math.max(0, fx.enemyHealthMult - 1) * 40;
    score += Math.max(0, fx.enemySpeedMult - 1) * 30;
    score += Math.max(0, fx.enemyCountMult - 1) * 35;
    score += this.active.size * 4;
    score += fx.livesReduction * 3;
    score += Math.max(0, 1 - fx.farmIncomeMult) * 25;
    score += Math.max(0, 1 - fx.buildSpotMult) * 20;
    if (fx.bossEmpowered) score += 15;
    if (fx.doubleBoss) score += 20;
    if (fx.spawnSpecialEnemies) score += 10;

    const rounded = Math.round(score);
    let label = 'Relaxed';
    if (rounded >= 110) label = 'Unhinged';
    else if (rounded >= 90) label = 'Extreme';
    else if (rounded >= 65) label = 'Brutal';
    else if (rounded >= 40) label = 'Hard';
    else if (rounded >= 18) label = 'Moderate';

    return { score: rounded, label };
  }

  getActiveList() {
    return [...this.active].map((id) => CHALLENGE_MODIFIERS[id]).filter(Boolean);
  }

  getState() {
    return {
      active: [...this.active],
      presetId: this.presetId,
      locked: this.locked,
      rewardMultiplier: this.getRewardMultiplier(),
      difficulty: this.getDifficultyRating(),
      effects: this.getEffects(),
    };
  }

  _emit() {
    this.eventBus.emit(Events.CHALLENGE_CHANGED, this.getState());
  }
}
