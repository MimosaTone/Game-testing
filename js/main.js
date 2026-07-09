import { Game, Phase } from './core/Game.js';
import { Renderer } from './render/Renderer.js';
import { FloatingTextManager } from './render/FloatingTextManager.js';
import { HUD } from './ui/HUD.js';
import { GAME_CONFIG } from './config/gameConfig.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const game = new Game();
const renderer = new Renderer(ctx);
const floatingTexts = new FloatingTextManager();
const hud = new HUD(game);

canvas.width = GAME_CONFIG.canvasWidth;
canvas.height = GAME_CONFIG.canvasHeight;

game.start();

let lastFrameTime = performance.now();

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const px = (e.clientX - rect.left) * scaleX;
  const py = (e.clientY - rect.top) * scaleY;
  const grid = game.path.pixelToGrid(px, py);
  game.setHoveredCell(grid.x, grid.y);
});

canvas.addEventListener('mouseleave', () => {
  game.clearHoveredCell();
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const px = (e.clientX - rect.left) * scaleX;
  const py = (e.clientY - rect.top) * scaleY;
  const grid = game.path.pixelToGrid(px, py);
  game.handleClick(grid.x, grid.y);
});

function gameLoop(time) {
  const dt = Math.min((time - lastFrameTime) / 1000, 0.1);
  lastFrameTime = time;

  game.update(time);
  floatingTexts.update(dt);

  for (const effect of game.consumeHarvestEffects()) {
    floatingTexts.add(effect.x, effect.y, effect.text, '#2e7d4f', 20);
  }

  renderer.clear();
  renderer.drawGrid();
  renderer.drawPath(game.path);
  renderer.drawBuildSpots(
    game.placementSystem,
    game.hoveredCell,
    game.placementSystem.selectedBuildType
  );
  renderer.drawFarms(
    game.placementSystem.farms,
    game.placementSystem.selectedStructure
  );
  renderer.drawTowers(
    game.placementSystem.towers,
    game.placementSystem.selectedStructure
  );
  renderer.drawEnemies(game.waveManager.enemies);
  renderer.drawProjectiles(game.combatSystem.projectiles);
  floatingTexts.draw(ctx);
  renderer.drawPhaseOverlay(game.phase, game.waveManager.waveNumber);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
