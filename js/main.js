import { Game } from './core/Game.js';
import { Renderer } from './render/Renderer.js';
import { FloatingTextManager } from './render/FloatingTextManager.js';
import { HUD } from './ui/HUD.js';
import { StartModal } from './ui/StartModal.js';
import { GAME_CONFIG } from './config/gameConfig.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let game;
let renderer;
let hud;
let startModal;

try {
  game = new Game();
  renderer = new Renderer(ctx);
  hud = new HUD(game);

  canvas.width = GAME_CONFIG.canvasWidth;
  canvas.height = GAME_CONFIG.canvasHeight;

  let floatingTexts = new FloatingTextManager();
  let lastFrameTime = performance.now();

  function gameLoop(time) {
    const dt = Math.min((time - lastFrameTime) / 1000, 0.1);
    lastFrameTime = time;

    game.update(time);
    const speed = game.speedController.getEffectiveSpeed();
    floatingTexts.update(dt * speed);

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
    renderer.drawSupports(
      game.placementSystem.supports,
      game.placementSystem.selectedStructure,
      game.supportEffects
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

  function beginGame() {
    game.start();
    requestAnimationFrame(gameLoop);
  }

  startModal = new StartModal(game, () => {
    /* modal resolved — game already running */
  });

  // Always start rendering immediately so the canvas is never blank
  beginGame();

  // Offer to continue a saved run via overlay
  if (game.hasSavedRun()) {
    const summary = game.getSavedRunSummary();
    if (summary) {
      startModal.show(summary);
    }
  }

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
} catch (err) {
  console.error('Meadow Defense failed to start:', err);
  document.body.innerHTML = `
    <div style="padding:40px;font-family:sans-serif;text-align:center;color:#2d3436;">
      <h2>Failed to load Meadow Defense</h2>
      <p style="color:#636e72;margin:12px 0;">${err.message}</p>
      <button onclick="localStorage.clear();location.reload()" style="padding:10px 20px;font-size:16px;cursor:pointer;">
        Clear save &amp; reload
      </button>
    </div>
  `;
}
