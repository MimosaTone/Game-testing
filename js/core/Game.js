import { EventBus, Events } from './EventBus.js';
import { Economy } from './Economy.js';
import { WaveManager } from './WaveManager.js';
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

/**
 * Central game orchestrator — ties all systems together.
 */
export class Game {
  constructor() {
    this.eventBus = new EventBus();
    this.path = new Path();
    this.economy = new Economy(this.eventBus);
    this.waveManager = new WaveManager(this.eventBus, this.path);
    this.combatSystem = new CombatSystem(this.eventBus);
    this.placementSystem = new PlacementSystem(this.eventBus, this.economy);

    this.phase = Phase.PLANNING;
    this.lives = GAME_CONFIG.startingLives;
    this.hoveredCell = null;
    this.lastTime = 0;
    this.running = false;
    this.pendingHarvestEffects = [];

    this._setupEventHandlers();
  }

  _setupEventHandlers() {
    this.eventBus.on(Events.ENEMY_KILLED, (enemy) => {
      this.economy.trackKillGold(enemy.goldReward);
      this.economy.earn(enemy.goldReward);
      this.waveManager.removeEnemy(enemy);
    });

    this.eventBus.on(Events.ENEMY_ESCAPED, () => {
      this.lives--;
      this.eventBus.emit(Events.LIVES_CHANGED, this.lives);
      if (this.lives <= 0) {
        this.phase = Phase.GAME_OVER;
        this.eventBus.emit(Events.GAME_OVER);
      }
    });

    this.eventBus.on(Events.TOWER_PLACED, () => {
      this.combatSystem.setTowers(this.placementSystem.towers);
    });

    this.eventBus.on(Events.FARM_PLACED, () => {
      this._refreshFarmIncome();
    });

    this.eventBus.on(Events.WAVE_STARTED, (wave) => {
      this.economy.setWaveNumber(wave);
      this.economy.resetWaveKillGold();
    });
  }

  _refreshFarmIncome() {
    this.economy.recalculateIncome(this.placementSystem.farms);
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.eventBus.emit(Events.GOLD_CHANGED, this.economy.gold);
    this.eventBus.emit(Events.LIVES_CHANGED, this.lives);
    this.eventBus.emit(Events.WAVE_CHANGED, this.waveManager.waveNumber);
    this.eventBus.emit(Events.INCOME_CHANGED, {
      total: this.economy.incomePerWave,
      farmCount: 0,
      waveBonus: 0,
    });
  }

  startWave() {
    if (this.phase !== Phase.PLANNING) return;
    this.waveManager.startNextWave();
    this.phase = Phase.WAVE;
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

    this.eventBus.emit(Events.WAVE_COMPLETED, wave);
    this.eventBus.emit(Events.WAVE_SUMMARY, {
      wave,
      killGold,
      farmIncome,
      waveBonus,
      total: killGold + farmIncome + waveBonus,
    });
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
        this.combatSystem.setTowers(this.placementSystem.towers);
      }
    } else {
      this.placementSystem.selectStructure(gridX, gridY);
    }
  }

  restart() {
    this.economy.gold = GAME_CONFIG.startingGold;
    this.economy.incomePerWave = 0;
    this.economy.waveNumber = 0;
    this.economy.resetWaveKillGold();
    this.lives = GAME_CONFIG.startingLives;
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
