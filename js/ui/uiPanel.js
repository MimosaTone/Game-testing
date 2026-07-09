import { getTowerStats } from '../config/towerTypes.js';

/**
 * Build panel and selection/upgrade UI.
 */
export class UIPanel {
  constructor(elements, game) {
    this.buildButtonsEl = elements.buildButtons;
    this.selectionPanelEl = elements.selectionPanel;
    this.selectionTitleEl = elements.selectionTitle;
    this.selectionInfoEl = elements.selectionInfo;
    this.upgradeButtonsEl = elements.upgradeButtons;
    this.startWaveBtn = elements.startWaveBtn;
    this.phaseHintEl = elements.phaseHint;
    this.game = game;

    this.activeBuildId = null;
    this.#renderBuildButtons();
    this.#bindEvents();
  }

  #bindEvents() {
    this.startWaveBtn.addEventListener('click', () => {
      this.game.startWave();
    });
  }

  #renderBuildButtons() {
    const options = this.game.buildingSystem.getBuildOptions();
    this.buildButtonsEl.innerHTML = '';

    for (const option of options) {
      const btn = document.createElement('button');
      btn.className = 'build-btn';
      btn.dataset.id = option.id;
      btn.innerHTML = `
        <span class="icon" style="background:${option.typeDef.color}"></span>
        <span class="details">
          <span class="name">${option.typeDef.name}</span>
          <span class="cost">${option.typeDef.cost} gold</span>
        </span>
      `;

      btn.addEventListener('click', () => {
        if (btn.classList.contains('disabled')) return;

        if (this.activeBuildId === option.id) {
          this.activeBuildId = null;
          this.game.buildingSystem.clearBuildMode();
        } else {
          this.activeBuildId = option.id;
          this.game.setBuildMode(option);
        }

        this.game.buildingSystem.clearSelection();
        this.#syncBuildButtons();
      });

      this.buildButtonsEl.appendChild(btn);
    }
  }

  #syncBuildButtons() {
    const buttons = this.buildButtonsEl.querySelectorAll('.build-btn');
    const state = this.game.getState();

    buttons.forEach((btn) => {
      const option = this.game.buildingSystem.getBuildOptions().find((o) => o.id === btn.dataset.id);
      const canAfford = state.gold >= option.typeDef.cost;
      const isActive = this.activeBuildId === btn.dataset.id;

      btn.classList.toggle('active', isActive);
      btn.classList.toggle('disabled', !canAfford && !isActive);
    });
  }

  update(state) {
    this.#syncBuildButtons();

    const startLabel = state.wave === 0 ? 'Start Wave 1' : `Start Wave ${state.wave + 1}`;
    this.startWaveBtn.textContent = state.phase === 'victory' ? 'Victory!' : startLabel;
    this.startWaveBtn.disabled = !state.canStartWave || state.phase === 'game_over' || state.phase === 'victory';

    if (state.phase === 'planning') {
      this.phaseHintEl.textContent = state.wave === 0
        ? 'Build towers and farms, then start the first wave.'
        : 'Wave complete! Collect income, upgrade, and plan your next defense.';
    } else if (state.phase === 'wave') {
      this.phaseHintEl.textContent = 'Wave in progress — defend the path!';
    } else if (state.phase === 'victory') {
      this.phaseHintEl.textContent = 'You survived every wave. Refresh to play again.';
    } else {
      this.phaseHintEl.textContent = 'Game over. Refresh to replay.';
    }

    if (state.selectedBuilding) {
      this.#showSelection(state);
    } else {
      this.selectionPanelEl.hidden = true;
    }
  }

  #showSelection(state) {
    const building = state.selectedBuilding;
    this.selectionPanelEl.hidden = false;
    this.activeBuildId = null;
    this.#syncBuildButtons();

    const isFarm = building.category === 'farm';
    this.selectionTitleEl.textContent = building.typeDef.name;

    if (isFarm) {
      this.selectionInfoEl.innerHTML = `
        <p class="selection-stat">Level: <strong>${building.level}</strong> / ${building.typeDef.maxLevel}</p>
        <p class="selection-stat">Income: <strong>+${building.incomePerWave}</strong> per wave</p>
      `;
    } else {
      const stats = getTowerStats(building.typeDef, building.level);
      this.selectionInfoEl.innerHTML = `
        <p class="selection-stat">Level: <strong>${building.level}</strong> / ${building.typeDef.maxLevel}</p>
        <p class="selection-stat">Damage: <strong>${Math.round(stats.damage)}</strong></p>
        <p class="selection-stat">Range: <strong>${Math.round(stats.range)}</strong></p>
        <p class="selection-stat">Attack Speed: <strong>${stats.attackSpeed.toFixed(2)}/s</strong></p>
      `;
    }

    this.upgradeButtonsEl.innerHTML = '';
    const atMax = building.level >= building.typeDef.maxLevel;

    if (!atMax) {
      const cost = this.game.buildingSystem.getUpgradeCost(building);
      const btn = document.createElement('button');
      btn.className = 'upgrade-btn';
      btn.innerHTML = `<span>Upgrade</span><span>${cost} gold</span>`;
      btn.classList.toggle('disabled', state.gold < cost);

      btn.addEventListener('click', () => {
        if (state.gold < cost) return;
        this.game.upgradeSelected();
      });

      this.upgradeButtonsEl.appendChild(btn);
    } else {
      this.upgradeButtonsEl.innerHTML = '<p class="hint">Max level reached.</p>';
    }
  }
}
