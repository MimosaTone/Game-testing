import { Events } from './EventBus.js';

export const GAME_SPEEDS = [1, 2, 4, 8];

const NOTIFICATION_SLOW_MS = 3500;

/**
 * Controls game speed multiplier with auto-slow during important events.
 */
export class SpeedController {
  constructor(eventBus, prestigeManager, researchManager = null) {
    this.eventBus = eventBus;
    this.prestigeManager = prestigeManager;
    this.researchManager = researchManager;
    this.speed = 1;
    this.preferredSpeed = 1;
    this.forcedNormalUntil = 0;
    this._setupListeners();
  }

  loadFromSettings(settings = {}) {
    this.preferredSpeed = settings.preferredSpeed ?? 1;
    this.speed = this._clampSpeed(this.preferredSpeed);
  }

  toSettings() {
    return { preferredSpeed: this.preferredSpeed };
  }

  canUse8x() {
    return (
      this.prestigeManager.totalPrestiges >= 1 ||
      this.prestigeManager.bestWave >= 30 ||
      (this.researchManager?.getModifiers().extraSpeedTier ?? 0) >= 1
    );
  }

  getAvailableSpeeds() {
    let speeds = this.canUse8x() ? [...GAME_SPEEDS] : GAME_SPEEDS.filter((s) => s <= 4);
    if ((this.researchManager?.getModifiers().extraSpeedTier ?? 0) >= 1) {
      speeds = [...speeds, 16];
    }
    return speeds;
  }

  _clampSpeed(s) {
    const available = this.getAvailableSpeeds();
    if (available.includes(s)) return s;
    return available[available.length - 1] ?? 1;
  }

  getEffectiveSpeed() {
    if (performance.now() < this.forcedNormalUntil) return 1;
    return this.speed;
  }

  setSpeed(speed) {
    const clamped = this._clampSpeed(speed);
    this.speed = clamped;
    this.preferredSpeed = clamped;
    this.eventBus.emit(Events.SPEED_CHANGED, this.getState());
    this.eventBus.emit(Events.SETTINGS_CHANGED);
    return clamped;
  }

  cycleSpeed() {
    const speeds = this.getAvailableSpeeds();
    const idx = speeds.indexOf(this.speed);
    const next = speeds[(idx + 1) % speeds.length];
    return this.setSpeed(next);
  }

  forceNormal(durationMs = NOTIFICATION_SLOW_MS) {
    this.forcedNormalUntil = performance.now() + durationMs;
    this.eventBus.emit(Events.SPEED_CHANGED, this.getState());
  }

  applyToDt(dt) {
    return dt * this.getEffectiveSpeed();
  }

  getState() {
    return {
      speed: this.speed,
      effectiveSpeed: this.getEffectiveSpeed(),
      forcedNormal: performance.now() < this.forcedNormalUntil,
      canUse8x: this.canUse8x(),
      availableSpeeds: this.getAvailableSpeeds(),
    };
  }

  _setupListeners() {
    const slow = () => this.forceNormal();
    this.eventBus.on(Events.BOSS_WAVE, slow);
    this.eventBus.on(Events.WAVE_SUMMARY, slow);
    this.eventBus.on(Events.GAME_OVER, slow);
    this.eventBus.on(Events.MASTERY_GAINED, ({ unlockedMaster }) => {
      if (unlockedMaster) slow();
    });
    this.eventBus.on(Events.STRUCTURE_DESTROYED, slow);
  }
}
