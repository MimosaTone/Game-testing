import { CHALLENGE_MODIFIERS, CHALLENGE_PRESETS } from '../config/challengeConfig.js?v=20260710f';
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
    this.locked = !!data?.locked;
    if (this.active.size === 0) this.presetId = 'normal';
    else if (!this.presetId) this.presetId = 'custom';
  }

  toRunData() {
    return {
      active: [...this.active],
      presetId: this.presetId,
      locked: this.locked,
    };
  }

  reset() {
    this.active.clear();
    this.presetId = 'normal';
    this.locked = false;
    this._emit();
  }

  lockForRun() {
    if (this.active.size > 0) this.locked = true;
  }

  canEdit(phasePlanning = true) {
    return phasePlanning && !this.locked;
  }

  applyPreset(presetId, phasePlanning = true) {
    if (!this.canEdit(phasePlanning)) return false;
    const preset = CHALLENGE_PRESETS[presetId];
    if (!preset) return false;
    this.active.clear();
    for (const id of preset.modifiers) this.active.add(id);
    this.presetId = presetId;
    this._emit();
    return true;
  }

  toggleModifier(id, phasePlanning = true) {
    if (!this.canEdit(phasePlanning)) return false;
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

    this.presetId = this._detectPreset() ?? 'custom';
    this._emit();
    return true;
  }

  _detectPreset() {
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

  getActiveList() {
    return [...this.active].map((id) => CHALLENGE_MODIFIERS[id]).filter(Boolean);
  }

  getState() {
    return {
      active: [...this.active],
      presetId: this.presetId,
      locked: this.locked,
      rewardMultiplier: this.getRewardMultiplier(),
      effects: this.getEffects(),
    };
  }

  _emit() {
    this.eventBus.emit(Events.CHALLENGE_CHANGED, this.getState());
  }
}
