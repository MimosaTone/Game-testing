import {
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  Phase,
  STARTING_GOLD,
  STARTING_LIVES,
} from './config/constants.js';
import { TOTAL_WAVES } from './config/waveConfig.js';
import { PathSystem } from './systems/path.js';
import { EconomySystem } from './systems/economy.js';
import { WaveSystem } from './systems/waveSystem.js';
import { BuildingSystem } from './systems/building.js';
import { CombatSystem } from './systems/combat.js';

/**
 * Core game orchestrator — wires systems together and runs the loop.
 */
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.pathSystem = new PathSystem();
    this.economy = new EconomySystem(STARTING_GOLD);
    this.waveSystem = new WaveSystem(this.pathSystem);
    this.buildingSystem = new BuildingSystem(this.pathSystem);
    this.combatSystem = new CombatSystem();

    this.enemies = [];
    this.projectiles = [];
    this.lives = STARTING_LIVES;
    this.phase = Phase.PLANNING;
    this.hoverCell = null;
    this.lastTime = 0;
    this.listeners = new Set();
  }

  onStateChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  #emitState() {
    const state = this.getState();
    for (const cb of this.listeners) cb(state);
  }

  getState() {
    return {
      gold: this.economy.gold,
      lives: this.lives,
      wave: this.waveSystem.currentWave,
      incomePerWave: this.buildingSystem.getTotalIncomePerWave(),
      phase: this.phase,
      selectedBuilding: this.buildingSystem.selectedBuilding,
      buildMode: this.buildingSystem.buildMode,
      canStartWave: this.phase === Phase.PLANNING,
      totalWaves: TOTAL_WAVES,
    };
  }

  startWave() {
    if (this.phase !== Phase.PLANNING) return;

    const nextWave = this.waveSystem.currentWave + 1;
    if (nextWave > TOTAL_WAVES) return;

    this.phase = Phase.WAVE;
    this.waveSystem.resetCompleteFlag();
    this.waveSystem.startWave(nextWave);
    this.#emitState();
  }

  #onWaveComplete() {
    const income = this.buildingSystem.getTotalIncomePerWave();
    this.economy.collectWaveIncome(income);

    if (this.waveSystem.currentWave >= TOTAL_WAVES) {
      this.phase = Phase.VICTORY;
    } else {
      this.phase = Phase.PLANNING;
    }

    this.#emitState();
  }

  #onEnemyKilled(enemy) {
    this.economy.earn(enemy.goldReward);
    this.#emitState();
  }

  setBuildMode(mode) {
    if (this.phase === Phase.GAME_OVER || this.phase === Phase.VICTORY) return;
    this.buildingSystem.setBuildMode(mode);
    this.#emitState();
  }

  handleCanvasClick(x, y) {
    if (this.phase === Phase.GAME_OVER || this.phase === Phase.VICTORY) return;

    const { col, row } = this.buildingSystem.screenToCell(x, y);

    if (this.buildingSystem.buildMode) {
      const placed = this.buildingSystem.placeBuilding(col, row, this.economy);
      if (placed) {
        this.buildingSystem.clearBuildMode();
        this.#emitState();
      }
      return;
    }

    const building = this.buildingSystem.getBuildingAt(col, row);
    if (building) {
      this.buildingSystem.selectBuilding(building);
    } else {
      this.buildingSystem.clearSelection();
    }
    this.#emitState();
  }

  handleCanvasMove(x, y) {
    this.hoverCell = this.buildingSystem.screenToCell(x, y);
  }

  upgradeSelected() {
    const upgraded = this.buildingSystem.upgradeSelected(this.economy);
    if (upgraded) this.#emitState();
    return upgraded;
  }

  update(dt) {
    if (this.phase === Phase.GAME_OVER || this.phase === Phase.VICTORY) return;

    if (this.phase === Phase.WAVE) {
      this.waveSystem.update(dt, this.enemies);

      for (const enemy of this.enemies) {
        enemy.update(dt);
        if (enemy.reachedEnd) {
          this.lives -= 1;
          enemy.alive = false;
        }
      }

      for (const tower of this.buildingSystem.buildings.filter((b) => b.category === 'tower')) {
        tower.update(dt, this.enemies, this.projectiles, this.combatSystem);
      }

      for (const projectile of this.projectiles) {
        projectile.update(dt);
      }

      this.#resolveProjectileHits();
      this.enemies = this.enemies.filter((e) => e.alive);
      this.projectiles = this.projectiles.filter((p) => p.alive);

      if (this.lives <= 0) {
        this.phase = Phase.GAME_OVER;
        this.#emitState();
        return;
      }

      if (this.waveSystem.isWaveComplete()) {
        this.#onWaveComplete();
      }
    }
  }

  #resolveProjectileHits() {
    for (const projectile of this.projectiles) {
      if (projectile.alive) continue;
      if (!projectile.target) continue;

      const directHit = projectile.target.alive;
      if (directHit) {
        const killed = projectile.target.takeDamage(projectile.damage);
        if (killed) this.#onEnemyKilled(projectile.target);
      }

      if (projectile.splashRadius > 0) {
        this.combatSystem.applySplashDamage(projectile, this.enemies, (enemy) => {
          this.#onEnemyKilled(enemy);
        });
      }
    }
  }

  draw() {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.#drawGrid(ctx);
    this.pathSystem.draw(ctx);

    for (const building of this.buildingSystem.buildings) {
      const selected = building === this.buildingSystem.selectedBuilding;
      building.draw(ctx, selected);
    }

    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }

    for (const projectile of this.projectiles) {
      projectile.draw(ctx);
    }

    if (this.hoverCell && this.buildingSystem.buildMode) {
      this.buildingSystem.drawBuildPreview(ctx, this.hoverCell.col, this.hoverCell.row);
    }

    if (this.phase === Phase.GAME_OVER) {
      this.#drawOverlay(ctx, 'Game Over', 'Your village was overrun. Refresh to try again.');
    } else if (this.phase === Phase.VICTORY) {
      this.#drawOverlay(ctx, 'Victory!', `You survived all ${TOTAL_WAVES} waves. Well done!`);
    }
  }

  #drawGrid(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;

    for (let c = 0; c <= GRID_COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL_SIZE, 0);
      ctx.lineTo(c * CELL_SIZE, GRID_ROWS * CELL_SIZE);
      ctx.stroke();
    }

    for (let r = 0; r <= GRID_ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL_SIZE);
      ctx.lineTo(GRID_COLS * CELL_SIZE, r * CELL_SIZE);
      ctx.stroke();
    }

    ctx.restore();
  }

  #drawOverlay(ctx, title, subtitle) {
    ctx.save();
    ctx.fillStyle = 'rgba(44, 62, 80, 0.55)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(title, this.canvas.width / 2, this.canvas.height / 2 - 10);

    ctx.font = '18px sans-serif';
    ctx.fillText(subtitle, this.canvas.width / 2, this.canvas.height / 2 + 30);
    ctx.restore();
  }

  tick(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.tick(t));
  }

  start() {
    this.lastTime = performance.now();
    this.#emitState();
    requestAnimationFrame((t) => this.tick(t));
  }
}
