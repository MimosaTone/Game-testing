import { Events } from '../core/EventBus.js';
import { TOWER_TYPES } from '../config/towerTypes.js';
import { FARM_CONFIG } from '../config/farmConfig.js';
import { Phase } from '../core/Game.js';
import {
  calculateFarmIncome,
  estimatePaybackWaves,
  ECONOMY_CONFIG,
} from '../config/economyConfig.js';

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
      incomeDetail: document.getElementById('income-detail'),
      startWave: document.getElementById('start-wave-btn'),
      buildPanel: document.getElementById('build-panel'),
      upgradePanel: document.getElementById('upgrade-panel'),
      upgradeTitle: document.getElementById('upgrade-title'),
      upgradeStats: document.getElementById('upgrade-stats'),
      upgradeButtons: document.getElementById('upgrade-buttons'),
      waveSummary: document.getElementById('wave-summary'),
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
        this._hideWaveSummary();
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

    bus.on(Events.INCOME_CHANGED, (data) => {
      const income = typeof data === 'number' ? data : data.total;
      const farmCount = typeof data === 'number' ? 0 : data.farmCount;
      const waveBonus = typeof data === 'number' ? 0 : data.waveBonus;

      this.elements.income.textContent = `+${income}`;

      if (farmCount === 0) {
        this.elements.incomeDetail.textContent = 'Invest in Sunpatches';
      } else if (farmCount > 1) {
        this.elements.incomeDetail.textContent = `${farmCount} patches · network +${Math.round(ECONOMY_CONFIG.farmNetworkBonus * (farmCount - 1) * 100)}%`;
      } else if (waveBonus > 0) {
        this.elements.incomeDetail.textContent = `+${waveBonus}% wave scaling`;
      } else {
        this.elements.incomeDetail.textContent = 'Per wave harvest';
      }
    });

    bus.on(Events.WAVE_STARTED, () => {
      this._updateStartButton();
      this._hideUpgradePanel();
      this._hideWaveSummary();
      this.game.placementSystem.clearSelection();
      this._updateBuildSelection();
    });

    bus.on(Events.WAVE_COMPLETED, () => {
      this._updateStartButton();
      this._refreshBuildPanelHints();
    });

    bus.on(Events.WAVE_SUMMARY, (summary) => {
      this._showWaveSummary(summary);
    });

    bus.on(Events.STRUCTURE_SELECTED, (structure) => {
      if (structure) {
        this._showUpgradePanel(structure);
      } else {
        this._hideUpgradePanel();
      }
    });

    bus.on(Events.FARM_PLACED, () => {
      this._refreshBuildPanelHints();
    });
  }

  _projectedIncomeWithNewSunpatch() {
    const wave = this.game.waveManager.waveNumber;
    const fakeNew = { getBaseIncome: () => FARM_CONFIG.incomePerLevel[0] };
    const farms = [...this.game.placementSystem.farms, fakeNew];
    return calculateFarmIncome(farms, wave);
  }

  _renderBuildPanel() {
    const panel = this.elements.buildPanel;
    panel.innerHTML = '';

    const projectedIncome = this._projectedIncomeWithNewSunpatch();
    const sunpatchPayback = estimatePaybackWaves(FARM_CONFIG.cost, projectedIncome);

    const items = [
      ...Object.values(TOWER_TYPES).map((t) => ({
        id: t.id,
        name: t.name,
        cost: t.cost,
        icon: t.icon,
        color: t.color,
        hint: t.description,
      })),
      {
        id: FARM_CONFIG.id,
        name: FARM_CONFIG.name,
        cost: FARM_CONFIG.cost,
        icon: FARM_CONFIG.icon,
        color: FARM_CONFIG.color,
        hint: `+${FARM_CONFIG.incomePerLevel[0]}/wave · pays back ~${sunpatchPayback} wave${sunpatchPayback === 1 ? '' : 's'}`,
      },
    ];

    for (const item of items) {
      const btn = document.createElement('button');
      btn.className = 'build-btn';
      btn.dataset.buildType = item.id;
      btn.innerHTML = `
        <span class="build-icon" style="color:${item.color}">${item.icon}</span>
        <span class="build-info">
          <span class="build-name">${item.name}</span>
          <span class="build-hint">${item.hint}</span>
        </span>
        <span class="build-cost">${item.cost}g</span>
      `;
      panel.appendChild(btn);
    }
  }

  _refreshBuildPanelHints() {
    this._renderBuildPanel();
    this._updateBuildSelection();
    this._updateBuildAffordability();
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
      const cost = type === FARM_CONFIG.id ? FARM_CONFIG.cost : TOWER_TYPES[type].cost;
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

  _showWaveSummary({ wave, killGold, farmIncome, waveBonus, total }) {
    const el = this.elements.waveSummary;
    el.classList.remove('hidden');
    el.innerHTML = `
      <div class="summary-title">Wave ${wave} Harvest</div>
      <div class="summary-rows">
        ${killGold > 0 ? `<div class="summary-row"><span>Defeated foes</span><span class="gold-text">+${killGold}g</span></div>` : ''}
        ${farmIncome > 0 ? `<div class="summary-row"><span>Sunpatch harvest</span><span class="income-text">+${farmIncome}g</span></div>` : ''}
        <div class="summary-row"><span>Wave bonus</span><span class="wave-text">+${waveBonus}g</span></div>
        <div class="summary-row summary-total"><span>Total earned</span><span>+${total}g</span></div>
      </div>
    `;
  }

  _hideWaveSummary() {
    this.elements.waveSummary.classList.add('hidden');
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
    const abilities = tower.getAbilityLabels();
    const next = tower.getNextUpgrade();
    const maxTier = tower.upgradePath.length;

    this.elements.upgradeTitle.textContent = `${def.name} · Tier ${tower.upgradeTier}/${maxTier}`;

    let statsHtml = `
      <div>Damage: <strong>${stats.damage}</strong></div>
      <div>Range: <strong>${stats.range.toFixed(1)}</strong></div>
      <div>Speed: <strong>${stats.attackSpeed.toFixed(2)}/s</strong></div>
    `;

    if (abilities.length > 0) {
      statsHtml += `<div class="ability-tags">${abilities.map((a) => `<span class="ability-tag">${a}</span>`).join('')}</div>`;
    }

    if (tower.upgradeTier > 0) {
      const purchased = tower.upgradePath
        .slice(0, tower.upgradeTier)
        .map((t) => `<span class="tier-chip">${t.name}</span>`)
        .join('');
      statsHtml += `<div class="tier-history">${purchased}</div>`;
    }

    this.elements.upgradeStats.innerHTML = statsHtml;

    this.elements.upgradeButtons.innerHTML = '';

    if (next) {
      const cost = next.cost;
      const btn = document.createElement('button');
      btn.className = 'upgrade-btn';
      btn.innerHTML = `<span class="upgrade-btn-name">↑ ${next.name}</span><span class="upgrade-btn-detail">${next.description} · ${cost}g</span>`;
      btn.disabled = !this.game.economy.canAfford(cost) || this.game.phase !== Phase.PLANNING;
      btn.addEventListener('click', () => {
        if (this.game.placementSystem.upgradeSelected('path')) {
          this._showTowerUpgrades(tower);
        }
      });
      this.elements.upgradeButtons.appendChild(btn);
    } else {
      const max = document.createElement('div');
      max.className = 'upgrade-maxed';
      max.textContent = '★ Fully upgraded — peak performance';
      this.elements.upgradeButtons.appendChild(max);
    }
  }

  _showFarmUpgrades(farm) {
    const wave = this.game.waveManager.waveNumber;
    const totalIncome = this.game.economy.incomePerWave;
    const share = this.game.placementSystem.farms.length > 0
      ? Math.round(totalIncome / this.game.placementSystem.farms.length)
      : farm.getBaseIncome();

    this.elements.upgradeTitle.textContent = `${FARM_CONFIG.name} (Level ${farm.level})`;
    this.elements.upgradeStats.innerHTML = `
      <div>Your share: <strong>+${share}/wave</strong></div>
      <div>Total harvest: <strong>+${totalIncome}/wave</strong></div>
      ${farm.canUpgrade()
        ? `<div>Next level base: <strong>+${FARM_CONFIG.incomePerLevel[farm.level]}/wave</strong></div>`
        : '<div><strong>MAX LEVEL — thriving harvest!</strong></div>'}
    `;

    this.elements.upgradeButtons.innerHTML = '';
    const cost = this.game.economy.getUpgradeCost(farm, 'level');
    const projectedAfterUpgrade = farm.canUpgrade()
      ? calculateFarmIncome(
          this.game.placementSystem.farms.map((f) =>
            f.id === farm.id
              ? { getBaseIncome: () => FARM_CONFIG.incomePerLevel[farm.level] }
              : f
          ),
          wave
        )
      : null;
    const incomeGain = projectedAfterUpgrade !== null
      ? Math.max(1, projectedAfterUpgrade - totalIncome)
      : null;
    const payback = cost !== null && incomeGain !== null
      ? estimatePaybackWaves(cost, incomeGain)
      : null;

    const btn = document.createElement('button');
    btn.className = 'upgrade-btn upgrade-btn-farm';
    if (cost !== null && payback !== null) {
      btn.textContent = `↑ Cultivate (${cost}g · ~${payback} wave payback)`;
    } else {
      btn.textContent = cost !== null ? `↑ Cultivate (${cost}g)` : 'MAX LEVEL';
    }
    btn.disabled = cost === null || !this.game.economy.canAfford(cost) || this.game.phase !== Phase.PLANNING;
    btn.addEventListener('click', () => {
      if (this.game.placementSystem.upgradeSelected('level')) {
        this._showFarmUpgrades(farm);
        this._refreshBuildPanelHints();
      }
    });
    this.elements.upgradeButtons.appendChild(btn);
  }

  _updateUpgradeButtons() {
    const structure = this.game.placementSystem.selectedStructure;
    if (structure) this._showUpgradePanel(structure);
  }
}
