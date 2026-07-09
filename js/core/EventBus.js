/**
 * Lightweight pub/sub for decoupling game systems.
 * New features can subscribe without modifying existing modules.
 */
export class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const set = this._listeners.get(event);
    if (set) set.delete(callback);
  }

  emit(event, data) {
    const set = this._listeners.get(event);
    if (!set) return;
    for (const cb of set) cb(data);
  }
}

/** Standard game events. */
export const Events = {
  GOLD_CHANGED: 'gold_changed',
  LIVES_CHANGED: 'lives_changed',
  WAVE_CHANGED: 'wave_changed',
  INCOME_CHANGED: 'income_changed',
  WAVE_STARTED: 'wave_started',
  WAVE_COMPLETED: 'wave_completed',
  ENEMY_KILLED: 'enemy_killed',
  ENEMY_ESCAPED: 'enemy_escaped',
  TOWER_PLACED: 'tower_placed',
  FARM_PLACED: 'farm_placed',
  STRUCTURE_SELECTED: 'structure_selected',
  GAME_OVER: 'game_over',
  GAME_WON: 'game_won',
  WAVE_SUMMARY: 'wave_summary',
  PRESTIGE_CHANGED: 'prestige_changed',
  PRESTIGE_COMPLETED: 'prestige_completed',
  SETTINGS_CHANGED: 'settings_changed',
  BOSS_WAVE: 'boss_wave',
  BOSS_SPAWN_MINIONS: 'boss_spawn_minions',
  AUTO_WAVE_STARTED: 'auto_wave_started',
  STRUCTURE_UPGRADED: 'structure_upgraded',
  GAME_SAVED: 'game_saved',
  SAVE_LOADED: 'save_loaded',
  SAVE_CLEARED: 'save_cleared',
  SUPPORT_PLACED: 'support_placed',
  RESEARCH_CHANGED: 'research_changed',
  CRYSTALS_CHANGED: 'crystals_changed',
  BANK_CHANGED: 'bank_changed',
  MASTERY_GAINED: 'mastery_gained',
  LIVES_REPAIRED: 'lives_repaired',
  CHALLENGE_CHANGED: 'challenge_changed',
  SPEED_CHANGED: 'speed_changed',
  STRUCTURE_DAMAGED: 'structure_damaged',
  STRUCTURE_DESTROYED: 'structure_destroyed',
  STRUCTURE_REPAIRED: 'structure_repaired',
  STRUCTURE_REBUILT: 'structure_rebuilt',
  STRUCTURE_SOLD: 'structure_sold',
};
