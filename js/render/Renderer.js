import { GAME_CONFIG, DECORATIVE_TILES } from '../config/gameConfig.js';
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

  drawDecorativeTerrain(path) {
    const { ctx, tileSize, colors } = this;
    const pathCells = path.getPathCells();

    for (let y = 0; y < GAME_CONFIG.gridRows; y++) {
      for (let x = 0; x < GAME_CONFIG.gridCols; x++) {
        const key = `${x},${y}`;
        if (pathCells.has(key)) continue;
        const checker = (x + y) % 2 === 0;
        ctx.fillStyle = checker ? colors.terrainGrass : colors.terrainMeadow;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    for (const tile of DECORATIVE_TILES) {
      const key = `${tile.x},${tile.y}`;
      if (pathCells.has(key)) continue;
      const px = tile.x * tileSize;
      const py = tile.y * tileSize;
      const cx = px + tileSize / 2;
      const cy = py + tileSize / 2;

      if (tile.type === 'flower') {
        ctx.fillStyle = colors.terrainFlower;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#e8a0c0';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✿', cx, cy);
      } else if (tile.type === 'stone') {
        ctx.fillStyle = colors.terrainStone;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (tile.type === 'meadow') {
        ctx.fillStyle = colors.terrainMeadow;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(px + 6, py + 6, tileSize - 12, tileSize - 12);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = colors.terrainGrass;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(px + 8, py + 8, tileSize - 16, tileSize - 16);
        ctx.globalAlpha = 1;
      }
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

    for (const [key, data] of placementSystem.destroyedSpots) {
      const [x, y] = key.split(',').map(Number);
      ctx.fillStyle = 'rgba(60, 50, 50, 0.5)';
      ctx.fillRect(x * tileSize + 4, y * tileSize + 4, tileSize - 8, tileSize - 8);
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(x * tileSize + 4, y * tileSize + 4, tileSize - 8, tileSize - 8);
      ctx.setLineDash([]);
      ctx.fillStyle = '#e85d5d';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✕', x * tileSize + tileSize / 2, y * tileSize + tileSize / 2);
    }

    for (const key of placementSystem.buildSpots) {
      const [x, y] = key.split(',').map(Number);
      const occupied = placementSystem.isOccupied(x, y);
      const hovered = hoveredCell && hoveredCell.x === x && hoveredCell.y === y;
      const cx = x * tileSize + tileSize / 2;
      const cy = y * tileSize + tileSize / 2;

      if (occupied) continue;

      ctx.fillStyle = hovered ? colors.buildSpotFill : colors.buildSpotFill;
      ctx.globalAlpha = hovered ? 0.55 : 0.35;
      ctx.fillRect(x * tileSize + 5, y * tileSize + 5, tileSize - 10, tileSize - 10);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = hovered ? colors.buildSpotHover : colors.buildSpotRing;
      ctx.lineWidth = hovered ? 2.5 : 1.5;
      ctx.setLineDash(hovered ? [] : [4, 4]);
      ctx.strokeRect(x * tileSize + 6, y * tileSize + 6, tileSize - 12, tileSize - 12);
      ctx.setLineDash([]);

      if (!hovered) {
        ctx.fillStyle = colors.buildSpotRing;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

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

    if (stats.auraSlow > 0) {
      ctx.beginPath();
      ctx.arc(x, y, rangePx, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(77, 182, 172, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(77, 182, 172, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
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

    if (tower.upgradeTier > 0) {
      ctx.fillStyle = '#2d3436';
      ctx.beginPath();
      ctx.arc(x + 12, y - 12, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f1c40f';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(String(tower.upgradeTier), x + 12, y - 11);
    }

    if (tower.masteryLevel > 0) {
      ctx.fillStyle = '#5c6bc0';
      ctx.beginPath();
      ctx.arc(x - 12, y - 12, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(`M${tower.masteryLevel}`, x - 12, y - 11);
    }

    this._drawStructureHealthBar(x, y + 18, tower);
  }

  _drawStructureHealthBar(x, y, structure) {
    if (!structure?.maxHealth || structure.destroyed) return;
    if (structure.health >= structure.maxHealth) return;
    const { ctx } = this;
    const w = 30;
    const h = 4;
    const pct = structure.health / structure.maxHealth;
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x - w / 2, y, w, h);
    ctx.fillStyle = pct > 0.5 ? '#43a047' : pct > 0.25 ? '#f9a825' : '#e53935';
    ctx.fillRect(x - w / 2, y, w * pct, h);
  }

  drawSupports(supports, selectedStructure, supportEffects) {
    for (const support of supports) {
      const pos = support.getPixelPosition(this.tileSize);
      const isSelected = selectedStructure && selectedStructure.id === support.id;
      this._drawSupport(pos.x, pos.y, support, isSelected, supportEffects);
    }
  }

  _drawSupport(x, y, support, isSelected, supportEffects) {
    const { ctx } = this;
    const def = support.definition;
    const pulse = support.pulse;

    if (pulse > 0) {
      ctx.beginPath();
      ctx.arc(x, y, 20 + pulse * 15, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(171, 71, 188, ${pulse * 0.3})`;
      ctx.fill();
    }

    if (isSelected) {
      ctx.strokeStyle = '#9b59b6';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 18, y - 18, 36, 36);

      if (support.typeId === 'village') {
        const radius = 2.5 * this.tileSize;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(141, 110, 99, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(141, 110, 99, 0.35)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.fillStyle = def.color;
    ctx.fillRect(x - 15, y - 15, 30, 30);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 15, y - 15, 30, 30);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.icon, x, y - 1);

    ctx.fillStyle = '#2c3e50';
    ctx.font = '10px sans-serif';
    ctx.fillText(`L${support.level}`, x, y + 12);

    if (support.branch) {
      ctx.fillStyle = '#636e72';
      ctx.font = '8px sans-serif';
      ctx.fillText(support.branch[0].toUpperCase(), x + 14, y - 14);
    }

    this._drawStructureHealthBar(x, y + 20, support);
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
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.icon, x, y - 2);

    ctx.fillStyle = '#2c3e50';
    ctx.font = '12px sans-serif';
    ctx.fillText(`L${farm.level}`, x, y + 12);
    this._drawStructureHealthBar(x, y + 20, farm);
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

    if (enemy.isFlying) {
      ctx.save();
      ctx.translate(0, -10);
    }

    ctx.fillStyle = enemy.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    if (enemy.typeId === 'drift') {
      ctx.moveTo(enemy.x, enemy.y - size);
      ctx.lineTo(enemy.x + size, enemy.y + size * 0.6);
      ctx.lineTo(enemy.x - size, enemy.y + size * 0.6);
      ctx.closePath();
    } else if (enemy.typeId === 'husk' || enemy.typeId === 'ward') {
      ctx.rect(enemy.x - size, enemy.y - size, size * 2, size * 2);
    } else if (enemy.typeId === 'titan') {
      const s = size * 1.1;
      ctx.moveTo(enemy.x, enemy.y - s);
      ctx.lineTo(enemy.x + s, enemy.y);
      ctx.lineTo(enemy.x, enemy.y + s);
      ctx.lineTo(enemy.x - s, enemy.y);
      ctx.closePath();
    } else if (enemy.typeId === 'rime') {
      const s = size;
      ctx.moveTo(enemy.x, enemy.y - s);
      ctx.lineTo(enemy.x + s * 0.7, enemy.y);
      ctx.lineTo(enemy.x, enemy.y + s);
      ctx.lineTo(enemy.x - s * 0.7, enemy.y);
      ctx.closePath();
    } else {
      ctx.arc(enemy.x, enemy.y, size, 0, Math.PI * 2);
    }

    ctx.fill();

    if (enemy.armor > 0.1) {
      ctx.strokeStyle = '#90a4ae';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (enemy.isSlowed) {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, size + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(79, 195, 247, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (enemy.isBurning) {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 2, size + 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 112, 67, 0.35)';
      ctx.fill();
    }

    if (enemy.isExposed) {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, size + 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 214, 102, 0.65)';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (enemy.isBoss) {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, size + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(241, 196, 15, 0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();

      if (enemy.shieldActive) {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, size + 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100, 181, 246, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    const barWidth = size * 2;
    const barHeight = 4;
    const healthPct = enemy.health / enemy.maxHealth;

    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(enemy.x - barWidth / 2, enemy.y - size - 10, barWidth, barHeight);
    ctx.fillStyle = healthPct > 0.5 ? '#2ecc71' : healthPct > 0.25 ? '#f1c40f' : '#e74c3c';
    ctx.fillRect(enemy.x - barWidth / 2, enemy.y - size - 10, barWidth * healthPct, barHeight);

    if (enemy.isFlying) ctx.restore();
  }

  drawProjectiles(projectiles) {
    const { ctx } = this;
    for (const proj of projectiles) {
      const radius = proj.size || 4;
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (proj.isCrit) {
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 235, 120, 0.85)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (proj.isExecutionShot) {
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 90, 120, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  drawPhaseOverlay(phase, waveNumber) {
    const { ctx } = this;

    if (phase === Phase.PLANNING && waveNumber === 0) {
      this._drawCenterMessage('Place a tower for defense, Sunpatches for long-term gold', '#3a6d9c');
    } else if (phase === Phase.PLANNING) {
      this._drawCenterMessage(`Wave ${waveNumber} cleared — invest, upgrade, or start the next wave`, '#2e7d4f');
    } else if (phase === Phase.GAME_OVER) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);
      this._drawCenterMessage('Game Over — Click to restart', '#e74c3c');
    }
  }

  _drawCenterMessage(text, color) {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, GAME_CONFIG.canvasWidth / 2, GAME_CONFIG.canvasHeight - 30);
  }
}
