import { EventBus, Events } from './EventBus.js';
import { Economy } from './Economy.js';
import { WaveManager } from './WaveManager.js';
import { PrestigeManager } from './PrestigeManager.js';
import { SaveManager } from './SaveManager.js';
import { Path } from '../entities/Path.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { PlacementSystem } from '../systems/PlacementSystem.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

/** Game phases. */
export const Phase = {
  PLANNING: 'planning',
  WAVE: 'wave',
  GAME_OVER: 'game_over',
};

const AUTO_START_DELAY_MS = 2500;

/**
 * Central game orchestrator — ties all systems together.
 */
export class Game {
  constructor() {
    this.eventBus = new EventBus();
    this.saveManager = new SaveManager();
    this.path = new Path();
    this.prestigeManager = new PrestigeManager(this.eventBus);
    this.prestigeManager.loadFromMeta(this.saveManager.meta);
    this.economy = new Economy(this.eventBus, this.prestigeManager);
    this.waveManager = new WaveManager(this.eventBus, this.path);
    this.combatSystem = new CombatSystem(this.eventBus);
    this.placementSystem = new PlacementSystem(this.eventBus, this.economy);

    this.phase = Phase.PLANNING;
    this.lives = this._startingLives();
    this.economy.gold = this._startingGold();
    this.hoveredCell = null;
    this.lastTime = 0;
    this.running = false;
    this.pendingHarvestEffects = [];
    this.autoStartTimer = null;

    this._setupEventHandlers();
  }

  _startingGold() {
    return GAME_CONFIG.startingGold + this.prestigeManager.getModifiers().bonusStartingGold;
  }

  _startingLives() {
    return GAME_CONFIG.startingLives + this.prestigeManager.getModifiers().bonusStartingLives;
  }

  _applyPrestigeToTowers() {
    const mods = this.prestigeManager.getModifiers();
    for (const tower of this.placementSystem.towers) {
      tower.prestigeMods = mods;
    }
  }

  _setupEventHandlers() {
    this.eventBus.on(Events.ENEMY_KILLED, (enemy) => {
      this.economy.trackKillGold(enemy.goldReward);
      this.economy.earn(enemy.goldReward);
      this.waveManager.removeEnemy(enemy);
    });

    this.eventBus.on(Events.ENEMY_ESCAPED, (enemy) => {
      this.lives -= enemy.isBoss ? 3 : 1;
      this.eventBus.emit(Events.LIVES_CHANGED, this.lives);
      if (this.lives <= 0) {
        this.phase = Phase.GAME_OVER;
        this.prestigeManager.recordWave(this.waveManager.waveNumber);
        this.saveManager.saveMeta(this);
        this.eventBus.emit(Events.GAME_OVER, { wave: this.waveManager.waveNumber });
      }
    });

    this.eventBus.on(Events.TOWER_PLACED, () => {
      this._applyPrestigeToTowers();
      this.combatSystem.setTowers(this.placementSystem.towers);
      this.saveGame();
    });

    this.eventBus.on(Events.FARM_PLACED, () => {
      this._refreshFarmIncome();
      this.saveGame();
    });

    this.eventBus.on(Events.STRUCTURE_UPGRADED, () => {
      this.saveGame();
    });

    this.eventBus.on(Events.WAVE_STARTED, (wave) => {
      this.economy.setWaveNumber(wave);
      this.economy.resetWaveKillGold();
      this.prestigeManager.recordWave(wave);
      this._clearAutoStartTimer();
    });

    this.eventBus.on(Events.PRESTIGE_CHANGED, () => {
      this._applyPrestigeToTowers();
      this._refreshFarmIncome();
      this.saveGame();
    });

    this.eventBus.on(Events.SETTINGS_CHANGED, () => {
      this.saveGame();
    });
  }

  _refreshFarmIncome() {
    this.economy.recalculateIncome(this.placementSystem.farms);
  }

  _clearAutoStartTimer() {
    if (this.autoStartTimer) {
      clearTimeout(this.autoStartTimer);
      this.autoStartTimer = null;
    }
  }

  saveGame() {
    if (this.phase !== Phase.PLANNING || this.lives <= 0) return;
    this.saveManager.save(this);
    this.eventBus.emit(Events.GAME_SAVED);
  }

  hasSavedRun() {
    return this.saveManager.hasContinuableRun();
  }

  getSavedRunSummary() {
    return this.saveManager.getRunSummary();
  }

  loadSavedRun() {
    const run = this.saveManager.getRunData();
    if (!run) return false;

    this._clearAutoStartTimer();
    this.phase = Phase.PLANNING;
    this.lives = run.lives;
    this.economy.gold = run.gold;
    this.economy.waveNumber = run.wave;
    this.economy.resetWaveKillGold();
    this.pendingHarvestEffects = [];

    this.waveManager.reset();
    this.waveManager.waveNumber = run.wave;
    this.combatSystem.reset();

    this.placementSystem.loadStructures(run.towers, run.farms);
    this.placementSystem.clearSelection();
    this._applyPrestigeToTowers();
    this.combatSystem.setTowers(this.placementSystem.towers);
    this._refreshFarmIncome();

    this._emitFullState();
    this.eventBus.emit(Events.SAVE_LOADED);
    return true;
  }

  startNewRun() {
    this.resetRun();
    this.saveManager.clearRun();
    this.saveManager.saveMeta(this);
    this.eventBus.emit(Events.SAVE_LOADED);
  }

  clearAllSaveData() {
    this._clearAutoStartTimer();
    this.prestigeManager.resetAll();
    this.saveManager.clearAll();
    this.resetRun();
    this.eventBus.emit(Events.SAVE_CLEARED);
    this._emitFullState();
  }

  _emitFullState() {
    this.eventBus.emit(Events.GOLD_CHANGED, this.economy.gold);
    this.eventBus.emit(Events.LIVES_CHANGED, this.lives);
    this.eventBus.emit(Events.WAVE_CHANGED, this.waveManager.waveNumber);
    this.eventBus.emit(Events.PRESTIGE_CHANGED, this.prestigeManager.data);
    this.eventBus.emit(Events.INCOME_CHANGED, {
      total: this.economy.incomePerWave,
      farmCount: this.placementSystem.farms.length,
      waveBonus: this.waveManager.waveNumber > 0
        ? Math.round(this.waveManager.waveNumber * 3.5)
        : 0,
    });
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this._emitFullState();
  }

  get autoStartWaves() {
    return this.prestigeManager.autoStartWaves;
  }

  set autoStartWaves(value) {
    this.prestigeManager.autoStartWaves = value;
    if (!value) this._clearAutoStartTimer();
  }

  canPrestige() {
    return this.prestigeManager.canPrestige(this.waveManager.waveNumber);
  }

  prestige() {
    if (!this.canPrestige()) return false;
    const wave = this.waveManager.waveNumber;
    const earned = this.prestigeManager.prestige(wave);
    this.resetRun();
    this.saveManager.save(this);
    return earned;
  }

  startWave() {
    if (this.phase !== Phase.PLANNING) return;
    this._clearAutoStartTimer();
    this.waveManager.startNextWave();
    this.phase = Phase.WAVE;
    this._applyPrestigeToTowers();
    this.combatSystem.setTowers(this.placementSystem.towers);
  }

  update(currentTime) {
    if (!this.running) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    for (const farm of this.placementSystem.farms) {
      farm.updatePulse(dt);
    }

    if (this.phase === Phase.WAVE) {
      this.waveManager.update(dt);
      this.combatSystem.update(dt, this.waveManager.enemies);

      if (this.waveManager.isWaveComplete) {
        this._completeWave();
      }
    }
  }

  _completeWave() {
    const wave = this.waveManager.waveNumber;
    const { farmIncome, waveBonus, killGold } = this.economy.collectWaveIncome();

    if (farmIncome > 0) {
      const perFarm = Math.round(farmIncome / this.placementSystem.farms.length);
      for (const farm of this.placementSystem.farms) {
        farm.triggerHarvestPulse();
        const pos = farm.getPixelPosition(GAME_CONFIG.tileSize);
        this.pendingHarvestEffects.push({
          x: pos.x,
          y: pos.y - 20,
          text: `+${perFarm}`,
        });
      }
    }

    this.waveManager.active = false;
    this.phase = Phase.PLANNING;
    this.economy.setWaveNumber(wave);
    this._refreshFarmIncome();
    this.saveGame();

    this.eventBus.emit(Events.WAVE_COMPLETED, wave);
    this.eventBus.emit(Events.WAVE_SUMMARY, {
      wave,
      killGold,
      farmIncome,
      waveBonus,
      total: killGold + farmIncome + waveBonus,
    });

    if (this.prestigeManager.autoStartWaves && this.lives > 0) {
      this._clearAutoStartTimer();
      this.autoStartTimer = setTimeout(() => {
        if (this.phase === Phase.PLANNING && this.lives > 0) {
          this.startWave();
          this.eventBus.emit(Events.AUTO_WAVE_STARTED);
        }
      }, AUTO_START_DELAY_MS);
    }
  }

  consumeHarvestEffects() {
    const effects = this.pendingHarvestEffects;
    this.pendingHarvestEffects = [];
    return effects;
  }

  setHoveredCell(gridX, gridY) {
    this.hoveredCell = { x: gridX, y: gridY };
  }

  clearHoveredCell() {
    this.hoveredCell = null;
  }

  handleClick(gridX, gridY) {
    if (this.phase === Phase.GAME_OVER) {
      this.restart();
      return;
    }

    if (this.phase !== Phase.PLANNING) {
      this.placementSystem.selectStructure(gridX, gridY);
      return;
    }

    if (this.placementSystem.selectedBuildType) {
      if (this.placementSystem.tryPlace(gridX, gridY)) {
        this._applyPrestigeToTowers();
        this.combatSystem.setTowers(this.placementSystem.towers);
      }
    } else {
      this.placementSystem.selectStructure(gridX, gridY);
    }
  }

  restart() {
    this.resetRun();
    this.saveManager.clearRun();
    this.saveManager.saveMeta(this);
  }

  resetRun() {
    this._clearAutoStartTimer();
    this.economy.gold = this._startingGold();
    this.economy.incomePerWave = 0;
    this.economy.waveNumber = 0;
    this.economy.resetWaveKillGold();
    this.lives = this._startingLives();
    this.phase = Phase.PLANNING;
    this.pendingHarvestEffects = [];
    this.waveManager.reset();
    this.combatSystem.reset();
    this.placementSystem.reset();
    this.placementSystem.clearSelection();

    this.eventBus.emit(Events.GOLD_CHANGED, this.economy.gold);
    this.eventBus.emit(Events.LIVES_CHANGED, this.lives);
    this.eventBus.emit(Events.WAVE_CHANGED, 0);
    this.eventBus.emit(Events.INCOME_CHANGED, {
      total: 0,
      farmCount: 0,
      waveBonus: 0,
    });
  }
}
