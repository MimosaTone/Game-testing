import { Game } from './game.js';
import { HUD } from './ui/hud.js';
import { UIPanel } from './ui/uiPanel.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

const hud = new HUD({
  gold: document.getElementById('gold'),
  lives: document.getElementById('lives'),
  wave: document.getElementById('wave'),
  income: document.getElementById('income'),
});

const uiPanel = new UIPanel({
  buildButtons: document.getElementById('build-buttons'),
  selectionPanel: document.getElementById('selection-panel'),
  selectionTitle: document.getElementById('selection-title'),
  selectionInfo: document.getElementById('selection-info'),
  upgradeButtons: document.getElementById('upgrade-buttons'),
  startWaveBtn: document.getElementById('start-wave-btn'),
  phaseHint: document.getElementById('phase-hint'),
}, game);

game.onStateChange((state) => {
  hud.update(state);
  uiPanel.update(state);
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  game.handleCanvasClick(
    (e.clientX - rect.left) * scaleX,
    (e.clientY - rect.top) * scaleY,
  );
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  game.handleCanvasMove(
    (e.clientX - rect.left) * scaleX,
    (e.clientY - rect.top) * scaleY,
  );
});

game.start();
