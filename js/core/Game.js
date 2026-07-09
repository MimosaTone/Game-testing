import { EventBus, Events } from './EventBus.js';
import { Economy } from './Economy.js';
import { WaveManager } from './WaveManager.js';
import { PrestigeManager } from './PrestigeManager.js';
import { SaveManager } from './SaveManager.js';
import { ResearchManager } from './ResearchManager.js';
import { ChallengeManager } from './ChallengeManager.js';
import { SpeedController } from './SpeedController.js';
import { SupportEffectManager } from './SupportEffectManager.js';
import { StructureCombatSystem } from '../systems/StructureCombatSystem.js';
import { Path } from '../entities/Path.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { PlacementSystem } from '../systems/PlacementSystem.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { MASTERY_CONFIG } from '../config/towerMasteryConfig.js';
import { isBossWave } from '../config/waveConfig.js';
import { ECONOMY_CONFIG } from '../config/economyConfig.js';

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
    this.researchManager = new ResearchManager(this.eventBus);
    this.challengeManager = new ChallengeManager(this.eventBus);
    this.speedController = new SpeedController(this.eventBus, this.prestigeManager);
    this.speedController.loadFromSettings(this.saveManager.meta.settings);
    this.supportEffects = new SupportEffectManager();
    this.economy = new Economy(this.eventBus, this.prestigeManager);
    this.economy.setSupportEffects(this.supportEffects);
    this.waveManager = new WaveManager(this.eventBus, this.path);
    this.combatSystem = new CombatSystem(this.eventBus);
    this.placementSystem = new PlacementSystem(this.eventBus, this.economy);
    this.structureCombat = new StructureCombatSystem(this.eventBus);
    this.structureCombat.setPlacementSystem(this.placementSystem);
    this.structureCombat.setSupportEffects(this.supportEffects);

    this.phase = Phase.PLANNING;
    this.lives = this._startingLives();
    this.economy.gold = this._startingGold();
    this.hoveredCell = null;
    this.lastTime = 0;
    this.running = false;
    this.pendingHarvestEffects = [];
    this.autoStartTimer = null;
    this.wavesSinceRepair = 0;

    this._setupEventHandlers();
    this._applyChallengeEffects();
    this._refreshSupportEffects();
  }

  _applyChallengeEffects() {
    const fx = this.challengeManager.getEffects();
    this.placementSystem.setChallengeEffects(fx);
    this.waveManager.setChallengeEffects(fx);
    this.economy.setChallengeEffects(fx, this.challengeManager.getRewardMultiplier());
  }

  getChallengeRewardMult() {
    return this.challengeManager.getRewardMultiplier();
  }

  _startingGold() {
    const prestige = this.prestigeManager.getModifiers().bonusStartingGold;
    const research = this.researchManager.getModifiers().bonusStartingGold;
    return GAME_CONFIG.startingGold + prestige + research;
  }

  _startingLives() {
    const base = GAME_CONFIG.startingLives + this.prestigeManager.getModifiers().bonusStartingLives;
    const reduction = this.challengeManager.getEffects().livesReduction || 0;
    return Math.max(5, base - reduction);
  }

  _refreshSupportEffects() {
    const researchMods = this.researchManager.getModifiers();
    this.supportEffects.recalculate(this.placementSystem.supports, researchMods);
    this.economy.setSupportsForBank(this.placementSystem.supports);

    for (const tower of this.placementSystem.towers) {
      tower.supportMods = this.supportEffects.getTowerMods(
        this.placementSystem.supports,
        tower.gridX,
        tower.gridY
      );
    }

    this._refreshFarmIncome();
  }

  _applyPrestigeToTowers() {
    const mods = this.prestigeManager.getModifiers();
    for (const tower of this.placementSystem.towers) {
      tower.prestigeMods = mods;
      tower.supportMods = this.supportEffects.getTowerMods(
        this.placementSystem.supports,
        tower.gridX,
        tower.gridY
      );
    }
  }

  _setupEventHandlers() {
    this.eventBus.on(Events.ENEMY_KILLED, ({ enemy, killerTower }) => {
      const isBoss = enemy.isBoss;
      if (isBoss) {
        this.placementSystem.bossesDefeated++;
      }

      this.structureCombat.onEnemyKilled(enemy);

      const rewardMult = this.getChallengeRewardMult();
      const earned = this.economy.earn(enemy.goldReward, { isBoss, rewardMult });
      this.economy.trackKillGold(earned);
      this.waveManager.removeEnemy(enemy);

      if (killerTower && !killerTower.destroyed) {
        const baseXp = isBoss ? MASTERY_CONFIG.xpPerBossKill : MASTERY_CONFIG.xpPerKill;
        const xp = Math.round(baseXp * rewardMult);
        const result = killerTower.awardMasteryXP(xp);
        if (result.newLevel > result.prevLevel || result.unlockedMaster) {
          this.eventBus.emit(Events.MASTERY_GAINED, { tower: killerTower, ...result });
        }
      }
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
      this._refreshSupportEffects();
      this.saveGame();
    });

    this.eventBus.on(Events.SUPPORT_PLACED, () => {
      this._refreshSupportEffects();
      this.saveGame();
    });

    this.eventBus.on(Events.STRUCTURE_UPGRADED, () => {
      this._refreshSupportEffects();
      this._applyPrestigeToTowers();
      this.saveGame();
    });

    this.eventBus.on(Events.WAVE_STARTED, (wave) => {
      this.economy.setWaveNumber(wave);
      this.economy.resetWaveKillGold();
      this.prestigeManager.recordWave(wave);
      this._clearAutoStartTimer();
    });

    this.eventBus.on(Events.PRESTIGE_CHANGED, () => {
      this._refreshSupportEffects();
      this._applyPrestigeToTowers();
      this.saveGame();
    });

    this.eventBus.on(Events.RESEARCH_CHANGED, () => {
      this._refreshSupportEffects();
      this._applyPrestigeToTowers();
      this.saveGame();
    });

    this.eventBus.on(Events.STRUCTURE_DESTROYED, () => {
      this.combatSystem.setTowers(this.placementSystem.towers);
      this._refreshSupportEffects();
      this.saveGame();
    });

    this.eventBus.on(Events.CHALLENGE_CHANGED, () => {
      this._applyChallengeEffects();
      this._refreshSupportEffects();
      if (this.phase === Phase.PLANNING && this.waveManager.waveNumber === 0) {
        this.lives = this._startingLives();
        this.eventBus.emit(Events.LIVES_CHANGED, this.lives);
      }
      this.saveGame();
    });

    this.eventBus.on(Events.SETTINGS_CHANGED, () => {
      this.saveGame();
    });
  }

  _refreshFarmIncome() {
    const fn = (gx, gy) => {
      let mult = this.supportEffects.getFarmMods(this.placementSystem.supports, gx, gy);
      mult *= this.challengeManager.getEffects().farmIncomeMult ?? 1;
      return mult;
    };
    this.economy.recalculateIncome(this.placementSystem.farms, fn);
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
    this.economy.crystals = run.crystals || 0;
    this.economy.waveNumber = run.wave;
    this.economy.resetWaveKillGold();
    this.pendingHarvestEffects = [];
    this.wavesSinceRepair = run.wavesSinceRepair || 0;

    this.researchManager.loadFromRun(run.research);
    this.challengeManager.loadFromRun(run.challenge);
    this._applyChallengeEffects();
    this.waveManager.reset();
    this.waveManager.waveNumber = run.wave;
    this.combatSystem.reset();

    this.placementSystem.loadStructures(
      run.towers,
      run.farms,
      run.supports || [],
      run.bossesDefeated || 0,
      run.destroyed || []
    );
    this.speedController.loadFromSettings(this.saveManager.meta.settings);
    this.placementSystem.clearSelection();
    this._refreshSupportEffects();
    this._applyPrestigeToTowers();
    this.combatSystem.setTowers(this.placementSystem.towers);

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
    this.researchManager.reset();
    this.challengeManager.reset();
    this._applyChallengeEffects();
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
    this.eventBus.emit(Events.CRYSTALS_CHANGED, this.economy.crystals);
    this.eventBus.emit(Events.RESEARCH_CHANGED, this.researchManager.getState());
    this.eventBus.emit(Events.CHALLENGE_CHANGED, this.challengeManager.getState());
    this.eventBus.emit(Events.SPEED_CHANGED, this.speedController.getState());
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
    const rewardMult = this.getChallengeRewardMult();
    if (rewardMult > 1) {
      const bonus = Math.round(earned * (rewardMult - 1));
      this.prestigeManager.data.shards += bonus;
      this.eventBus.emit(Events.PRESTIGE_CHANGED, this.prestigeManager.data);
    }
    const crystalBonus = Math.floor(this.economy.crystals * 0.25);
    if (crystalBonus > 0) {
      this.prestigeManager.data.shards += crystalBonus;
      this.eventBus.emit(Events.PRESTIGE_CHANGED, this.prestigeManager.data);
    }
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

    const rawDt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    const dt = this.speedController.applyToDt(rawDt);

    for (const farm of this.placementSystem.farms) {
      if (!farm.destroyed) farm.updatePulse(dt);
    }

    for (const support of this.placementSystem.supports) {
      if (!support.destroyed) support.updatePulse(dt);
    }

    if (this.phase === Phase.WAVE) {
      this.waveManager.update(dt);
      this.combatSystem.update(dt, this.waveManager.enemies);
      this.structureCombat.update(dt, this.waveManager.enemies);
      this.structureCombat.processRepairs(dt, true);

      if (this.waveManager.isWaveComplete) {
        this._completeWave();
      }
    }
  }

  _completeWave() {
    const wave = this.waveManager.waveNumber;
    const { farmIncome, waveBonus, killGold, bankInterest } = this.economy.collectWaveIncome();

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

    const rewardMult = this.getChallengeRewardMult();

    let crystalGain = 0;
    for (const s of this.placementSystem.supports) {
      if (s.typeId !== 'crystal_extractor' || s.destroyed) continue;
      const yieldAmt = Math.round(this.supportEffects.getCrystalYield(s) * rewardMult);
      crystalGain += yieldAmt;
      if (yieldAmt > 0) s.triggerPulse();
    }
    if (crystalGain > 0) {
      this.economy.addCrystals(crystalGain);
    }

    this.structureCombat.processRepairs(1, false);
    this.combatSystem.awardWaveSurvivalXP(rewardMult);
    this._processRepairStations(wave);

    if (bankInterest > 0) {
      this.pendingHarvestEffects.push({
        x: GAME_CONFIG.canvasWidth / 2,
        y: 40,
        text: `Bank +${bankInterest}g`,
      });
    }

    this.waveManager.active = false;
    this.phase = Phase.PLANNING;
    this.economy.setWaveNumber(wave);
    this._refreshSupportEffects();

    const rpGain = Math.round(this.supportEffects.getRpPerWave(this.placementSystem.supports) * rewardMult);
    if (rpGain > 0) {
      this.researchManager.addPoints(rpGain);
    }

    this.saveGame();

    this.eventBus.emit(Events.WAVE_COMPLETED, wave);
    this.eventBus.emit(Events.WAVE_SUMMARY, {
      wave,
      killGold,
      farmIncome,
      waveBonus,
      bankInterest,
      rpGain,
      crystalGain,
      rewardMult,
      total: killGold + farmIncome + waveBonus + bankInterest,
    });

    if (this.prestigeManager.autoStartWaves && this.lives > 0) {
      this._clearAutoStartTimer();
      const delay = AUTO_START_DELAY_MS * (this.challengeManager.getEffects().autoStartDelayMult ?? 1);
      const scaledDelay = delay / this.speedController.getEffectiveSpeed();
      this.autoStartTimer = setTimeout(() => {
        if (this.phase === Phase.PLANNING && this.lives > 0) {
          this.startWave();
          this.eventBus.emit(Events.AUTO_WAVE_STARTED);
        }
      }, scaledDelay);
    }
  }

  _processRepairStations(wave) {
    this.wavesSinceRepair++;
    let bestHeal = 0;
    let bestInterval = Infinity;

    for (const s of this.placementSystem.supports) {
      if (s.typeId !== 'repair_station' || s.destroyed) continue;
      const stats = this.supportEffects.getRepairStats(s);
      if (!stats.healAmount) continue;
      if (stats.healInterval < bestInterval) bestInterval = stats.healInterval;
      if (this.wavesSinceRepair >= stats.healInterval) {
        bestHeal = Math.max(bestHeal, stats.healAmount);
      }
    }

    if (bestHeal > 0 && this.lives < this._startingLives()) {
      const maxLives = GAME_CONFIG.startingLives + this.prestigeManager.getModifiers().bonusStartingLives
        - (this.challengeManager.getEffects().livesReduction || 0);
      this.lives = Math.min(Math.max(5, maxLives), this.lives + bestHeal);
      this.wavesSinceRepair = 0;
      this.eventBus.emit(Events.LIVES_REPAIRED, this.lives);
      this.eventBus.emit(Events.LIVES_CHANGED, this.lives);
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

    if (this.placementSystem.sellMode) {
      const structure = this.placementSystem.occupied.get(`${gridX},${gridY}`);
      if (structure && !structure.destroyed) {
        this.placementSystem.sellStructure(structure);
        this._applyPrestigeToTowers();
        this.combatSystem.setTowers(this.placementSystem.towers);
        this._refreshSupportEffects();
      }
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

  getEnemyCount() {
    return this.waveManager.enemies.filter((e) => e.alive).length;
  }

  getEstimatedWaveReward() {
    const nextWave = this.waveManager.waveNumber + 1;
    const mods = this.prestigeManager.getModifiers();
    const base = Math.round(ECONOMY_CONFIG.waveClearBonus(nextWave) * mods.waveBonusMult);
    return Math.round(base * this.getChallengeRewardMult());
  }

  restart() {
    this.resetRun();
    this.saveManager.clearRun();
    this.saveManager.saveMeta(this);
  }

  resetRun() {
    this._clearAutoStartTimer();
    this.researchManager.reset();
    this.challengeManager.reset();
    this._applyChallengeEffects();
    this.economy.gold = this._startingGold();
    this.economy.crystals = 0;
    this.economy.incomePerWave = 0;
    this.economy.waveNumber = 0;
    this.economy.resetWaveKillGold();
    this.lives = this._startingLives();
    this.phase = Phase.PLANNING;
    this.pendingHarvestEffects = [];
    this.wavesSinceRepair = 0;
    this.waveManager.reset();
    this.combatSystem.reset();
    this.placementSystem.reset();
    this.placementSystem.clearSelection();
    this._refreshSupportEffects();

    this.eventBus.emit(Events.GOLD_CHANGED, this.economy.gold);
    this.eventBus.emit(Events.CRYSTALS_CHANGED, 0);
    this.eventBus.emit(Events.LIVES_CHANGED, this.lives);
    this.eventBus.emit(Events.WAVE_CHANGED, 0);
    this.eventBus.emit(Events.RESEARCH_CHANGED, this.researchManager.getState());
    this.eventBus.emit(Events.CHALLENGE_CHANGED, this.challengeManager.getState());
    this.eventBus.emit(Events.SPEED_CHANGED, this.speedController.getState());
    this.eventBus.emit(Events.INCOME_CHANGED, {
      total: 0,
      farmCount: 0,
      waveBonus: 0,
    });
  }
}
