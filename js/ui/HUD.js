import { Events } from '../core/EventBus.js';
import { TOWER_TYPES } from '../config/towerTypes.js';
import { FARM_CONFIG } from '../config/farmConfig.js';
import { Phase } from '../core/Game.js';

/**
 * HUD and build panel UI controller.
 */
export class HUD {
  constructor(game) {
    this.game = game;
    this.elements = {
      gold: document.getElementById('gold-value'),
      lives: document.getElementById('lives-value'),
      wave: document.getElementById('wave-value'),
      income: document.getElementById('income-value'),
      startWave: document.getElementById('start-wave-btn'),
      buildPanel: document.getElementById('build-panel'),
      upgradePanel: document.getElementById('upgrade-panel'),
      upgradeTitle: document.getElementById('upgrade-title'),
      upgradeStats: document.getElementById('upgrade-stats'),
      upgradeButtons: document.getElementById('upgrade-buttons'),
    };

    this._bindEvents();
    this._subscribe();
    this._renderBuildPanel();
    this._updateStartButton();
  }

  _bindEvents() {
    this.elements.startWave.addEventListener('click', () => {
      if (this.game.phase === Phase.PLANNING) {
        this.game.startWave();
        this._updateStartButton();
        this._hideUpgradePanel();
      }
    });

    document.getElementById('build-panel').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-build-type]');
      if (!btn || this.game.phase !== Phase.PLANNING) return;

      const type = btn.dataset.buildType;
      const current = this.game.placementSystem.selectedBuildType;

      if (current === type) {
        this.game.placementSystem.clearSelection();
      } else {
        this.game.placementSystem.setBuildType(type);
      }

      this._updateBuildSelection();
      this._hideUpgradePanel();
    });
  }

  _subscribe() {
    const bus = this.game.eventBus;

    bus.on(Events.GOLD_CHANGED, (gold) => {
      this.elements.gold.textContent = gold;
      this._updateBuildAffordability();
      this._updateUpgradeButtons();
    });

    bus.on(Events.LIVES_CHANGED, (lives) => {
      this.elements.lives.textContent = lives;
    });

    bus.on(Events.WAVE_CHANGED, (wave) => {
      this.elements.wave.textContent = wave;
    });

    bus.on(Events.INCOME_CHANGED, (income) => {
      this.elements.income.textContent = `+${income}`;
    });

    bus.on(Events.WAVE_STARTED, () => {
      this._updateStartButton();
      this._hideUpgradePanel();
      this.game.placementSystem.clearSelection();
      this._updateBuildSelection();
    });

    bus.on(Events.WAVE_COMPLETED, () => {
      this._updateStartButton();
    });

    bus.on(Events.STRUCTURE_SELECTED, (structure) => {
      if (structure) {
        this._showUpgradePanel(structure);
      } else {
        this._hideUpgradePanel();
      }
    });
  }

  _renderBuildPanel() {
    const panel = this.elements.buildPanel;
    panel.innerHTML = '';

    const items = [
      ...Object.values(TOWER_TYPES).map((t) => ({
        id: t.id,
        name: t.name,
        cost: t.cost,
        icon: t.icon,
        color: t.color,
      })),
      {
        id: 'farm',
        name: FARM_CONFIG.name,
        cost: FARM_CONFIG.cost,
        icon: FARM_CONFIG.icon,
        color: FARM_CONFIG.color,
      },
    ];

    for (const item of items) {
      const btn = document.createElement('button');
      btn.className = 'build-btn';
      btn.dataset.buildType = item.id;
      btn.innerHTML = `
        <span class="build-icon" style="color:${item.color}">${item.icon}</span>
        <span class="build-name">${item.name}</span>
        <span class="build-cost">${item.cost}g</span>
      `;
      panel.appendChild(btn);
    }
  }

  _updateBuildSelection() {
    const selected = this.game.placementSystem.selectedBuildType;
    for (const btn of this.elements.buildPanel.querySelectorAll('.build-btn')) {
      btn.classList.toggle('selected', btn.dataset.buildType === selected);
    }
  }

  _updateBuildAffordability() {
    const gold = this.game.economy.gold;
    for (const btn of this.elements.buildPanel.querySelectorAll('.build-btn')) {
      const type = btn.dataset.buildType;
      const cost = type === 'farm' ? FARM_CONFIG.cost : TOWER_TYPES[type].cost;
      btn.classList.toggle('unaffordable', gold < cost);
    }
  }

  _updateStartButton() {
    const btn = this.elements.startWave;
    if (this.game.phase === Phase.PLANNING) {
      btn.disabled = false;
      btn.textContent = this.game.waveManager.waveNumber === 0
        ? 'Start Wave 1'
        : `Start Wave ${this.game.waveManager.waveNumber + 1}`;
    } else if (this.game.phase === Phase.WAVE) {
      btn.disabled = true;
      btn.textContent = 'Wave in progress...';
    } else {
      btn.disabled = true;
      btn.textContent = 'Game Over';
    }
  }

  _showUpgradePanel(structure) {
    const panel = this.elements.upgradePanel;
    panel.classList.remove('hidden');

    if (structure.type === 'farm') {
      this._showFarmUpgrades(structure);
    } else {
      this._showTowerUpgrades(structure);
    }
  }

  _hideUpgradePanel() {
    this.elements.upgradePanel.classList.add('hidden');
  }

  _showTowerUpgrades(tower) {
    const def = tower.definition;
    const stats = tower.getStats();

    this.elements.upgradeTitle.textContent = def.name;
    this.elements.upgradeStats.innerHTML = `
      <div>Damage: <strong>${Math.round(stats.damage)}</strong></div>
      <div>Range: <strong>${stats.range.toFixed(1)}</strong></div>
      <div>Speed: <strong>${stats.attackSpeed.toFixed(2)}/s</strong></div>
    `;

    const buttons = [
      { stat: 'damage', label: '↑ Damage' },
      { stat: 'range', label: '↑ Range' },
      { stat: 'attackSpeed', label: '↑ Speed' },
    ];

    this.elements.upgradeButtons.innerHTML = '';
    for (const { stat, label } of buttons) {
      const cost = this.game.economy.getUpgradeCost(tower, stat);
      const btn = document.createElement('button');
      btn.className = 'upgrade-btn';
      btn.textContent = cost !== null ? `${label} (${cost}g)` : `${label} (MAX)`;
      btn.disabled = cost === null || !this.game.economy.canAfford(cost) || this.game.phase !== Phase.PLANNING;
      btn.addEventListener('click', () => {
        if (this.game.placementSystem.upgradeSelected(stat)) {
          this._showTowerUpgrades(tower);
        }
      });
      this.elements.upgradeButtons.appendChild(btn);
    }
  }

  _showFarmUpgrades(farm) {
    this.elements.upgradeTitle.textContent = `Farm (Level ${farm.level})`;
    this.elements.upgradeStats.innerHTML = `
      <div>Income: <strong>+${farm.getIncome()}/wave</strong></div>
      ${farm.canUpgrade() ? `<div>Next level: <strong>+${FARM_CONFIG.incomePerLevel[farm.level]}/wave</strong></div>` : '<div><strong>MAX LEVEL</strong></div>'}
    `;

    this.elements.upgradeButtons.innerHTML = '';
    const cost = this.game.economy.getUpgradeCost(farm, 'level');
    const btn = document.createElement('button');
    btn.className = 'upgrade-btn';
    btn.textContent = cost !== null ? `↑ Upgrade (${cost}g)` : 'MAX LEVEL';
    btn.disabled = cost === null || !this.game.economy.canAfford(cost) || this.game.phase !== Phase.PLANNING;
    btn.addEventListener('click', () => {
      if (this.game.placementSystem.upgradeSelected('level')) {
        this._showFarmUpgrades(farm);
      }
    });
    this.elements.upgradeButtons.appendChild(btn);
  }

  _updateUpgradeButtons() {
    const structure = this.game.placementSystem.selectedStructure;
    if (structure) this._showUpgradePanel(structure);
  }
}
