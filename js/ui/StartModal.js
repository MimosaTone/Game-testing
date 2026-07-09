/**
 * Launch screen — continue saved run or start fresh.
 */
export class StartModal {
  constructor(game, onReady) {
    this.game = game;
    this.onReady = onReady;
    this.overlay = document.getElementById('start-modal');
    this.summaryEl = document.getElementById('start-modal-summary');
    this.continueBtn = document.getElementById('continue-btn');
    this.newGameBtn = document.getElementById('new-game-btn');

    this.continueBtn.addEventListener('click', () => this._continue());
    this.newGameBtn.addEventListener('click', () => this._newGame());
  }

  show(summary) {
    this.summaryEl.innerHTML = `
      <div class="start-summary-row"><span>Wave</span><strong>${summary.wave}</strong></div>
      <div class="start-summary-row"><span>Gold</span><strong>${summary.gold}g</strong></div>
      <div class="start-summary-row"><span>Lives</span><strong>${summary.lives}</strong></div>
      <div class="start-summary-row"><span>Structures</span><strong>${summary.towerCount} towers · ${summary.farmCount} farms</strong></div>
    `;
    this.overlay.classList.remove('hidden');
  }

  hide() {
    this.overlay.classList.add('hidden');
  }

  _continue() {
    this.game.loadSavedRun();
    this.hide();
    this.onReady();
  }

  _newGame() {
    this.game.startNewRun();
    this.hide();
    this.onReady();
  }
}
