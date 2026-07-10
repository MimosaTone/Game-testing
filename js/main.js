import { Game } from './core/Game.js';
import { Events } from './core/EventBus.js';
import { Renderer } from './render/Renderer.js';
import { FloatingTextManager } from './render/FloatingTextManager.js';
import { HUD } from './ui/HUD.js';
import { StartModal } from './ui/StartModal.js';
import { SaveCodeModal } from './ui/SaveCodeModal.js';
import { InvestmentPanel } from './ui/InvestmentPanel.js';
import { PrestigeMenu } from './ui/PrestigeMenu.js';
import { ResearchMenu } from './ui/ResearchMenu.js';
import { GAME_CONFIG, BUILD_VERSION } from './config/gameConfig.js?v=20260710g';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let game;
let renderer;
let hud;
let startModal;
let saveCodeModal;
let investmentPanel;
let prestigeMenu;
let researchMenu;

try {
  document.getElementById('build-version').textContent = `Build ${BUILD_VERSION}`;
  document.title = `Meadow Defense (${BUILD_VERSION})`;

  game = new Game();
  renderer = new Renderer(ctx);
  hud = new HUD(game);
  investmentPanel = new InvestmentPanel(game);
  prestigeMenu = new PrestigeMenu(game);
  researchMenu = new ResearchMenu(game);
  game.prestigeMenu = prestigeMenu;
  game.researchMenu = researchMenu;
  saveCodeModal = new SaveCodeModal(game, hud);
  saveCodeModal.updateButtons();

  for (const evt of [Events.WAVE_STARTED, Events.WAVE_COMPLETED, Events.GAME_OVER, Events.SAVE_LOADED, Events.SAVE_CLEARED, Events.GOLD_CHANGED, Events.INVESTMENT_CHANGED, Events.PRESTIGE_CHANGED, Events.RESEARCH_CHANGED]) {
    game.eventBus.on(evt, () => {
      saveCodeModal.updateButtons();
      if (investmentPanel && (evt === Events.GOLD_CHANGED || evt === Events.INVESTMENT_CHANGED || evt === Events.WAVE_COMPLETED || evt === Events.WAVE_STARTED || evt === Events.SAVE_LOADED)) {
        investmentPanel.render();
      }
      if (prestigeMenu?.isOpen && (evt === Events.PRESTIGE_CHANGED || evt === Events.GOLD_CHANGED || evt === Events.SAVE_LOADED)) {
        prestigeMenu.render();
      }
      if (researchMenu?.isOpen && (evt === Events.RESEARCH_CHANGED || evt === Events.GOLD_CHANGED || evt === Events.SAVE_LOADED)) {
        researchMenu.render();
      }
    });
  }

  canvas.width = GAME_CONFIG.canvasWidth;
  canvas.height = GAME_CONFIG.canvasHeight;

  const canvasWrap = document.getElementById('canvas-wrap');
  const bottomHotbar = document.getElementById('bottom-hotbar');

  function resizeCanvasDisplay() {
    const aspect = GAME_CONFIG.canvasWidth / GAME_CONFIG.canvasHeight;
    const pad = 8;
    const availW = canvasWrap.clientWidth - pad;
    const availH = canvasWrap.clientHeight - pad;
    if (availW <= 0 || availH <= 0) return;

    let displayW = availW;
    let displayH = displayW / aspect;
    if (displayH > availH) {
      displayH = availH;
      displayW = displayH * aspect;
    }

    canvas.style.width = `${Math.floor(displayW)}px`;
    canvas.style.height = `${Math.floor(displayH)}px`;
  }

  const resizeObserver = new ResizeObserver(() => resizeCanvasDisplay());
  resizeObserver.observe(canvasWrap);
  if (bottomHotbar) resizeObserver.observe(bottomHotbar);
  window.addEventListener('resize', resizeCanvasDisplay);
  requestAnimationFrame(resizeCanvasDisplay);

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
    renderer.drawDecorativeTerrain(game.path);
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

    hud.updateStatusPanel();

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
