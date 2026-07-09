import { GAME_CONFIG } from '../config/gameConfig.js';
import { FARM_CONFIG } from '../config/farmConfig.js';
import { Phase } from '../core/Game.js';

/**
 * Canvas renderer for the game world.
 */
export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.tileSize = GAME_CONFIG.tileSize;
    this.colors = GAME_CONFIG.colors;
  }

  clear() {
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);
  }

  drawGrid() {
    const { ctx, tileSize, colors } = this;
    ctx.strokeStyle = colors.gridLine;
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= GAME_CONFIG.gridCols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * tileSize, 0);
      ctx.lineTo(x * tileSize, GAME_CONFIG.gridRows * tileSize);
      ctx.stroke();
    }
    for (let y = 0; y <= GAME_CONFIG.gridRows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * tileSize);
      ctx.lineTo(GAME_CONFIG.gridCols * tileSize, y * tileSize);
      ctx.stroke();
    }
  }

  drawPath(path) {
    const cells = path.getPathCells();
    const { ctx, tileSize, colors } = this;

    for (const key of cells) {
      const [x, y] = key.split(',').map(Number);
      ctx.fillStyle = colors.path;
      ctx.fillRect(x * tileSize + 2, y * tileSize + 2, tileSize - 4, tileSize - 4);
      ctx.strokeStyle = colors.pathBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(x * tileSize + 2, y * tileSize + 2, tileSize - 4, tileSize - 4);
    }
  }

  drawBuildSpots(placementSystem, hoveredCell, selectedBuildType) {
    const { ctx, tileSize, colors } = this;

    for (const key of placementSystem.buildSpots) {
      const [x, y] = key.split(',').map(Number);
      const occupied = placementSystem.isOccupied(x, y);
      const hovered = hoveredCell && hoveredCell.x === x && hoveredCell.y === y;

      if (occupied) continue;

      ctx.fillStyle = hovered ? colors.buildSpotHover : colors.buildSpot;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x * tileSize + 4, y * tileSize + 4, tileSize - 8, tileSize - 8);
      ctx.globalAlpha = 1;

      if (hovered && selectedBuildType) {
        ctx.strokeStyle = colors.selection;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x * tileSize + 2, y * tileSize + 2, tileSize - 4, tileSize - 4);
        ctx.setLineDash([]);
      }
    }
  }

  drawTowers(towers, selectedStructure) {
    for (const tower of towers) {
      const pos = tower.getPixelPosition(this.tileSize);
      const isSelected = selectedStructure && selectedStructure.id === tower.id;
      this._drawTower(pos.x, pos.y, tower, isSelected);
    }
  }

  _drawTower(x, y, tower, isSelected) {
    const { ctx } = this;
    const def = tower.definition;
    const stats = tower.getStats();
    const rangePx = stats.range * this.tileSize;

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, rangePx, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(155, 89, 182, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(155, 89, 182, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.icon, x, y);

    const barrelLen = 16;
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(tower.angle) * barrelLen, y + Math.sin(tower.angle) * barrelLen);
    ctx.stroke();
  }

  drawFarms(farms, selectedStructure) {
    for (const farm of farms) {
      const pos = farm.getPixelPosition(this.tileSize);
      const isSelected = selectedStructure && selectedStructure.id === farm.id;
      this._drawFarm(pos.x, pos.y, farm, isSelected);
    }
  }

  _drawFarm(x, y, farm, isSelected) {
    const { ctx } = this;
    const def = FARM_CONFIG;
    const pulse = farm.harvestPulse;

    if (pulse > 0) {
      const glow = pulse * 20;
      ctx.beginPath();
      ctx.arc(x, y, 18 + glow, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 200, 87, ${pulse * 0.35})`;
      ctx.fill();
    }

    if (isSelected) {
      ctx.strokeStyle = '#9b59b6';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 18, y - 18, 36, 36);
    }

    ctx.fillStyle = def.color;
    ctx.fillRect(x - 14, y - 14, 28, 28);
    ctx.strokeStyle = '#e6a817';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 14, y - 14, 28, 28);

    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.icon, x, y - 2);

    ctx.fillStyle = '#2c3e50';
    ctx.font = '10px sans-serif';
    ctx.fillText(`L${farm.level}`, x, y + 12);
  }

  drawEnemies(enemies) {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      this._drawEnemy(enemy);
    }
  }

  _drawEnemy(enemy) {
    const { ctx } = this;
    const size = enemy.size;

    ctx.fillStyle = enemy.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    if (enemy.typeId === 'drift') {
      ctx.moveTo(enemy.x, enemy.y - size);
      ctx.lineTo(enemy.x + size, enemy.y + size * 0.6);
      ctx.lineTo(enemy.x - size, enemy.y + size * 0.6);
      ctx.closePath();
    } else if (enemy.typeId === 'husk') {
      ctx.rect(enemy.x - size, enemy.y - size, size * 2, size * 2);
    } else if (enemy.typeId === 'titan') {
      const s = size * 1.1;
      ctx.moveTo(enemy.x, enemy.y - s);
      ctx.lineTo(enemy.x + s, enemy.y);
      ctx.lineTo(enemy.x, enemy.y + s);
      ctx.lineTo(enemy.x - s, enemy.y);
      ctx.closePath();
    } else {
      ctx.arc(enemy.x, enemy.y, size, 0, Math.PI * 2);
    }

    ctx.fill();
    ctx.stroke();

    const barWidth = size * 2;
    const barHeight = 4;
    const healthPct = enemy.health / enemy.maxHealth;

    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(enemy.x - barWidth / 2, enemy.y - size - 10, barWidth, barHeight);
    ctx.fillStyle = healthPct > 0.5 ? '#2ecc71' : healthPct > 0.25 ? '#f1c40f' : '#e74c3c';
    ctx.fillRect(enemy.x - barWidth / 2, enemy.y - size - 10, barWidth * healthPct, barHeight);
  }

  drawProjectiles(projectiles) {
    const { ctx } = this;
    for (const proj of projectiles) {
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPhaseOverlay(phase, waveNumber) {
    const { ctx } = this;

    if (phase === Phase.PLANNING && waveNumber === 0) {
      this._drawCenterMessage('Place a tower for defense, Sunpatches for long-term gold', '#3498db');
    } else if (phase === Phase.PLANNING) {
      this._drawCenterMessage(`Wave ${waveNumber} cleared — invest, upgrade, or start the next wave`, '#27ae60');
    } else if (phase === Phase.GAME_OVER) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);
      this._drawCenterMessage('Game Over — Click to restart', '#e74c3c');
    }
  }

  _drawCenterMessage(text, color) {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, GAME_CONFIG.canvasWidth / 2, GAME_CONFIG.canvasHeight - 30);
  }
}
