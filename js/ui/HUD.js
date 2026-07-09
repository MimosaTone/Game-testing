import { Events } from '../core/EventBus.js';
import { TOWER_TYPES } from '../config/towerTypes.js';
import { FARM_CONFIG } from '../config/farmConfig.js';
import { SUPPORT_TYPES, SUPPORT_BUILD_ORDER } from '../config/supportConfig.js';
import { RESEARCH_UPGRADES } from '../config/researchConfig.js';
import { CHALLENGE_MODIFIERS, CHALLENGE_PRESETS } from '../config/challengeConfig.js';
import { MASTER_UPGRADES } from '../config/towerMasteryConfig.js';
import { BUILD_CATEGORIES, BUILD_CATEGORY_ORDER, getBuildItemDef } from '../config/buildCategories.js';
import { getRepairCost } from '../entities/StructureHealth.js';
import { REBUILD_COST_MULT } from '../config/structureHealthConfig.js';
import { Phase } from '../core/Game.js';
import {
  calculateFarmIncome,
  estimatePaybackWaves,
  ECONOMY_CONFIG,
} from '../config/economyConfig.js';
import { PRESTIGE_UPGRADES, PRESTIGE_CONFIG } from '../config/prestigeConfig.js';
import { isBossWave } from '../config/waveConfig.js';

/**
 * HUD and build panel UI controller.
 */
export class HUD {
  constructor(game) {
    this.game = game;
    this.hotbarCategory = 'towers';
    this.challengesExpanded = false;
    this.elements = {
      gold: document.getElementById('gold-value'),
      lives: document.getElementById('lives-value'),
      wave: document.getElementById('wave-value'),
      enemyCount: document.getElementById('enemy-count-value'),
      waveReward: document.getElementById('wave-reward-value'),
      income: document.getElementById('income-value'),
      incomeDetail: document.getElementById('income-detail'),
      startWave: document.getElementById('start-wave-btn'),
      buildPanel: document.getElementById('build-panel'),
      supportPanel: document.getElementById('support-panel'),
      upgradePanel: document.getElementById('upgrade-panel'),
      selectionPlaceholder: document.getElementById('selection-placeholder'),
      upgradeTitle: document.getElementById('upgrade-title'),
      upgradeStats: document.getElementById('upgrade-stats'),
      upgradeButtons: document.getElementById('upgrade-buttons'),
      sellBtn: document.getElementById('sell-btn'),
      waveSummary: document.getElementById('wave-summary'),
      shards: document.getElementById('shards-value'),
      crystals: document.getElementById('crystals-value'),
      research: document.getElementById('research-value'),
      researchHint: document.getElementById('research-hint'),
      researchUpgrades: document.getElementById('research-upgrades'),
      prestigeCount: document.getElementById('prestige-count'),
      prestigeHint: document.getElementById('prestige-hint'),
      prestigeBtn: document.getElementById('prestige-btn'),
      prestigeUpgrades: document.getElementById('prestige-upgrades'),
      autoStartToggle: document.getElementById('auto-start-toggle'),
      resetSaveBtn: document.getElementById('reset-save-btn'),
      speedBtn: document.getElementById('speed-btn'),
      repairAllBtn: document.getElementById('repair-all-btn'),
      sellModeBtn: document.getElementById('sell-mode-btn'),
      challengeHint: document.getElementById('challenge-hint'),
      challengePresets: document.getElementById('challenge-presets'),
      challengeActiveList: document.getElementById('challenge-active-list'),
      challengeModifiers: document.getElementById('challenge-modifiers'),
      challengeReward: document.getElementById('challenge-reward'),
      toggleChallengesBtn: document.getElementById('toggle-challenges-btn'),
      hotbarTabs: document.getElementById('hotbar-tabs'),
      hotbarCards: document.getElementById('hotbar-cards'),
    };

    this._bindEvents();
    this._subscribe();
    this._renderBuildPanel();
    this._renderSupportPanel();
    this._renderHotbar();
    this._renderResearchUpgrades();
    this._renderChallengePanel();
    this._renderPrestigeUpgrades();
    this._updateStartButton();
    this._updatePrestigeUI();
    this._updateStatusPanel();
    this.elements.autoStartToggle.checked = this.game.autoStartWaves;
  }

  /** Called each frame for live wave status. */
  updateStatusPanel() {
    this._updateStatusPanel();
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

    document.getElementById('support-panel').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-build-type]');
      if (!btn || this.game.phase !== Phase.PLANNING) return;
      if (btn.classList.contains('locked')) return;

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

    this.elements.autoStartToggle.addEventListener('change', (e) => {
      this.game.autoStartWaves = e.target.checked;
    });

    this.elements.speedBtn.addEventListener('click', () => {
      this.game.speedController.cycleSpeed();
    });

    this.elements.resetSaveBtn.addEventListener('click', () => {
      const confirmed = confirm(
        'Reset all save data?\n\nThis clears your current run, Bloom Shards, prestige upgrades, and settings. This cannot be undone.'
      );
      if (confirmed) {
        this.game.clearAllSaveData();
        this._renderPrestigeUpgrades();
        this._updatePrestigeUI();
        this._updateStartButton();
        this._hideWaveSummary();
        this._hideUpgradePanel();
        this.elements.autoStartToggle.checked = false;
      }
    });

    this.elements.repairAllBtn.addEventListener('click', () => {
      if (this.game.phase !== Phase.PLANNING) return;
      this.game.placementSystem.repairAllDamaged();
      this._updateUpgradeButtons();
    });

    this.elements.sellModeBtn.addEventListener('click', () => {
      const active = this.game.placementSystem.toggleSellMode();
      this.elements.sellModeBtn.classList.toggle('active', active);
      this.elements.sellModeBtn.textContent = active ? 'Sell Mode ON' : 'Sell Mode';
      if (active) {
        this._hideUpgradePanel();
        this.game.placementSystem.clearSelection();
      }
      this._updateBuildSelection();
    });

    this.elements.sellBtn.addEventListener('click', () => {
      const structure = this.game.placementSystem.selectedStructure;
      if (!structure || structure.destroyed || this.game.phase !== Phase.PLANNING) return;
      this.game.placementSystem.sellStructure(structure);
      this.game._applyPrestigeToTowers();
      this.game.combatSystem.setTowers(this.game.placementSystem.towers);
      this.game._refreshSupportEffects();
      this._hideUpgradePanel();
      this._renderBuildPanel();
      this._renderSupportPanel();
      this._renderHotbarCards();
    });

    this.elements.toggleChallengesBtn.addEventListener('click', () => {
      this.challengesExpanded = !this.challengesExpanded;
      this.elements.challengeModifiers.classList.toggle('hidden', !this.challengesExpanded);
      this.elements.toggleChallengesBtn.textContent = this.challengesExpanded
        ? 'Hide modifiers'
        : 'Show all modifiers';
    });

    this.elements.hotbarTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-category]');
      if (!tab) return;
      this.hotbarCategory = tab.dataset.category;
      this._renderHotbar();
    });

    this.elements.hotbarCards.addEventListener('click', (e) => {
      const card = e.target.closest('[data-build-type]');
      if (!card || this.game.phase !== Phase.PLANNING) return;
      if (card.classList.contains('locked') || card.classList.contains('disabled')) return;

      const type = card.dataset.buildType;
      const current = this.game.placementSystem.selectedBuildType;
      if (current === type) {
        this.game.placementSystem.clearSelection();
      } else {
        this.game.placementSystem.setBuildType(type);
      }
      this._updateBuildSelection();
      this._hideUpgradePanel();
    });

    this.elements.prestigeBtn.addEventListener('click', () => {
      if (this.game.phase === Phase.WAVE) return;
      const wave = this.game.waveManager.waveNumber;
      if (wave < PRESTIGE_CONFIG.unlockWave) return;
      const shards = this.game.prestigeManager.calculateShardsForWave(wave);
      const confirmed = confirm(
        `Prestige at Wave ${wave}?\n\nReset your run and earn ${shards} Bloom Shards for permanent upgrades.`
      );
      if (confirmed) {
        this.game.prestige();
        this._updatePrestigeUI();
        this._renderPrestigeUpgrades();
        this._updateStartButton();
        this._hideWaveSummary();
        this._hideUpgradePanel();
      }
    });
  }

  _subscribe() {
    const bus = this.game.eventBus;

    bus.on(Events.GOLD_CHANGED, (gold) => {
      this.elements.gold.textContent = gold;
      this._updateBuildAffordability();
      this._updateUpgradeButtons();
      this._renderHotbarCards();
    });

    bus.on(Events.CRYSTALS_CHANGED, (crystals) => {
      this.elements.crystals.textContent = crystals;
    });

    bus.on(Events.RESEARCH_CHANGED, (state) => {
      this.elements.research.textContent = `${state.points} RP`;
      this._renderResearchUpgrades();
    });

    bus.on(Events.MASTERY_GAINED, ({ tower, unlockedMaster }) => {
      if (unlockedMaster && MASTER_UPGRADES[tower.typeId]) {
        const master = MASTER_UPGRADES[tower.typeId];
        this.elements.waveSummary.classList.remove('hidden');
        this.elements.waveSummary.innerHTML = `
          <div class="summary-title mastery-alert">★ Master Upgrade Unlocked!</div>
          <p class="mastery-alert-text">${tower.definition.name}: ${master.name} — ${master.description}</p>
        `;
      }
    });

    bus.on(Events.LIVES_REPAIRED, (lives) => {
      this.elements.lives.textContent = lives;
    });

    bus.on(Events.LIVES_CHANGED, (lives) => {
      this.elements.lives.textContent = lives;
    });

    bus.on(Events.WAVE_CHANGED, (wave) => {
      this.elements.wave.textContent = wave;
      this._updatePrestigeUI();
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
      this.game.placementSystem.sellMode = false;
      this.elements.sellModeBtn.classList.remove('active');
      this.elements.sellModeBtn.textContent = 'Sell Mode';
      this._updateBuildSelection();
      this._updateStatusPanel();
    });

    bus.on(Events.WAVE_COMPLETED, () => {
      this._updateStartButton();
      this._refreshBuildPanelHints();
      this._updatePrestigeUI();
    });

    bus.on(Events.GAME_OVER, () => {
      this._updateStartButton();
      this._updatePrestigeUI();
    });

    bus.on(Events.PRESTIGE_CHANGED, () => {
      this._updatePrestigeUI();
      this._renderPrestigeUpgrades();
    });

    bus.on(Events.PRESTIGE_COMPLETED, ({ earned }) => {
      alert(`Prestige complete! You earned ${earned} Bloom Shards.`);
    });

    bus.on(Events.AUTO_WAVE_STARTED, () => {
      this._updateStartButton();
    });

    bus.on(Events.SAVE_LOADED, () => {
      this.elements.autoStartToggle.checked = this.game.autoStartWaves;
      this._renderBuildPanel();
      this._renderSupportPanel();
      this._renderHotbar();
      this._renderResearchUpgrades();
      this._renderPrestigeUpgrades();
      this._updatePrestigeUI();
      this._updateStartButton();
      this._updateBuildAffordability();
      this._updateStatusPanel();
      this.elements.crystals.textContent = this.game.economy.crystals;
      this.elements.research.textContent = `${this.game.researchManager.points} RP`;
    });

    bus.on(Events.SAVE_CLEARED, () => {
      this.elements.autoStartToggle.checked = false;
    });

    bus.on(Events.BOSS_WAVE, (wave) => {
      this.elements.waveSummary.classList.remove('hidden');
      this.elements.waveSummary.innerHTML = `
        <div class="summary-title boss-alert">⚠ Boss Wave ${wave}</div>
        <p class="boss-alert-text">A powerful invader approaches. Prepare your defenses!</p>
      `;
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

    bus.on(Events.SPEED_CHANGED, (state) => {
      const label = state.forcedNormal ? '1x' : `${state.speed}x`;
      this.elements.speedBtn.textContent = label;
      this.elements.speedBtn.classList.toggle('forced-normal', state.forcedNormal);
    });

    bus.on(Events.CHALLENGE_CHANGED, (state) => {
      this._renderChallengePanel();
    });

    bus.on(Events.STRUCTURE_DESTROYED, () => {
      this._renderBuildPanel();
      this._renderSupportPanel();
      this._renderHotbarCards();
    });

    bus.on(Events.STRUCTURE_SOLD, () => {
      this._renderBuildPanel();
      this._renderSupportPanel();
      this._renderHotbarCards();
      this._updateBuildAffordability();
    });

    bus.on(Events.SUPPORT_PLACED, () => {
      this._renderSupportPanel();
      this._updateBuildSelection();
    });
  }

  _updateStatusPanel() {
    this.elements.enemyCount.textContent = this.game.getEnemyCount();
    const reward = this.game.getEstimatedWaveReward();
    this.elements.waveReward.textContent = `+${reward}g`;
  }

  _renderHotbar() {
    this._renderHotbarTabs();
    this._renderHotbarCards();
  }

  _renderHotbarTabs() {
    const tabs = this.elements.hotbarTabs;
    tabs.innerHTML = '';
    for (const catId of BUILD_CATEGORY_ORDER) {
      const cat = BUILD_CATEGORIES[catId];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hotbar-tab';
      btn.dataset.category = catId;
      btn.textContent = `${cat.icon} ${cat.name}`;
      btn.classList.toggle('active', catId === this.hotbarCategory);
      tabs.appendChild(btn);
    }
  }

  _renderHotbarCards() {
    const container = this.elements.hotbarCards;
    container.innerHTML = '';
    const cat = BUILD_CATEGORIES[this.hotbarCategory];
    if (!cat) return;

    const ps = this.game.placementSystem;
    const gold = this.game.economy.gold;
    const selected = ps.selectedBuildType;

    for (const typeId of cat.items) {
      const def = getBuildItemDef(typeId);
      if (!def) continue;

      const isSupport = def.category === 'support';
      const unlocked = !isSupport || ps.isSupportUnlocked(typeId);
      const cost = isSupport ? def.cost : (typeId === FARM_CONFIG.id ? def.cost : ps.getBuildCost(typeId));
      const affordable = gold >= cost;

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'hotbar-card';
      card.dataset.buildType = typeId;
      if (!unlocked) card.classList.add('locked');
      else if (!affordable) card.classList.add('unaffordable');
      if (selected === typeId) card.classList.add('selected');

      const desc = unlocked ? def.description : (def.unlockAfterWave ? `Unlocks Wave ${def.unlockAfterWave}` : def.description);

      card.innerHTML = `
        <div class="hotbar-card-top">
          <span class="hotbar-card-icon" style="color:${def.color}">${def.icon}</span>
          <span class="hotbar-card-name">${def.name}</span>
        </div>
        <span class="hotbar-card-cost">${unlocked ? `${cost}g` : '🔒'}</span>
        <span class="hotbar-card-desc">${desc}</span>
      `;
      container.appendChild(card);
    }
  }

  _renderChallengeActiveList() {
    const cm = this.game.challengeManager;
    const list = this.elements.challengeActiveList;
    list.innerHTML = '';

    if (cm.active.size === 0) {
      const empty = document.createElement('div');
      empty.className = 'challenge-active-empty';
      empty.textContent = 'No active modifiers';
      list.appendChild(empty);
      return;
    }

    for (const modId of cm.active) {
      const mod = CHALLENGE_MODIFIERS[modId];
      if (!mod) continue;
      const row = document.createElement('div');
      row.className = 'challenge-active-item';
      row.innerHTML = `
        <span class="challenge-active-name">${mod.name}</span>
        <span class="challenge-active-bonus">+${Math.round(mod.rewardBonus * 100)}%</span>
      `;
      list.appendChild(row);
    }
  }

  _renderChallengePanel() {
    const cm = this.game.challengeManager;
    const canEdit = cm.canEdit(this.game.phase === Phase.PLANNING);
    const state = cm.getState();

    this.elements.challengeHint.textContent = canEdit
      ? 'Stack modifiers for bigger rewards — adjust before each wave'
      : 'Modifiers can only be changed between waves';

    this.elements.challengeReward.textContent = `Total Bonus: ${state.rewardMultiplier.toFixed(1)}×`;
    this._renderChallengeActiveList();

    const presetsEl = this.elements.challengePresets;
    presetsEl.innerHTML = '';
    for (const preset of Object.values(CHALLENGE_PRESETS)) {
      const btn = document.createElement('button');
      btn.className = 'challenge-preset-btn';
      btn.textContent = preset.name;
      btn.title = preset.description;
      btn.classList.toggle('active', state.presetId === preset.id);
      btn.disabled = !canEdit;
      if (canEdit) {
        btn.addEventListener('click', () => this.game.challengeManager.applyPreset(preset.id));
      }
      presetsEl.appendChild(btn);
    }

    const modsEl = this.elements.challengeModifiers;
    modsEl.innerHTML = '';
    for (const mod of Object.values(CHALLENGE_MODIFIERS)) {
      const row = document.createElement('label');
      row.className = 'challenge-mod-row';
      const active = cm.active.has(mod.id);
      row.innerHTML = `
        <input type="checkbox" ${active ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
        <span class="challenge-mod-name">${mod.name}</span>
        <span class="challenge-mod-diff">${mod.difficulty}</span>
        <span class="challenge-mod-bonus">+${Math.round(mod.rewardBonus * 100)}%</span>
      `;
      if (canEdit) {
        row.querySelector('input').addEventListener('change', () => {
          this.game.challengeManager.toggleModifier(mod.id);
        });
      }
      modsEl.appendChild(row);
    }
  }

  _renderSupportPanel() {
    const panel = this.elements.supportPanel;
    panel.innerHTML = '';
    const ps = this.game.placementSystem;

    for (const typeId of SUPPORT_BUILD_ORDER) {
      const def = SUPPORT_TYPES[typeId];
      const unlocked = ps.isSupportUnlocked(typeId);
      const btn = document.createElement('button');
      btn.className = 'build-btn support-btn';
      btn.dataset.buildType = typeId;
      if (!unlocked) btn.classList.add('locked');

      const lockHint = def.unlockAfterWave
        ? `Unlocks after Boss (Wave ${def.unlockAfterWave})`
        : def.description;

      btn.innerHTML = `
        <span class="build-icon" style="color:${def.color}">${def.icon}</span>
        <span class="build-info">
          <span class="build-name">${def.name}</span>
          <span class="build-hint">${unlocked ? def.description : lockHint}</span>
        </span>
        <span class="build-cost">${unlocked ? `${def.cost}g` : '🔒'}</span>
      `;
      panel.appendChild(btn);
    }
  }

  _renderResearchUpgrades() {
    const container = this.elements.researchUpgrades;
    container.innerHTML = '';
    const rm = this.game.researchManager;
    const rp = rm.points;

    this.elements.researchHint.textContent = rp > 0
      ? 'Spend Research Points on run-wide bonuses'
      : 'Build Research Labs to earn Research Points';

    for (const upgrade of Object.values(RESEARCH_UPGRADES)) {
      const level = rm.getUpgradeLevel(upgrade.id);
      const maxed = level >= upgrade.maxLevel;
      const row = document.createElement('div');
      row.className = 'research-upgrade-row';
      row.innerHTML = `
        <div class="research-upgrade-info">
          <span class="research-upgrade-name">${upgrade.name} (${level}/${upgrade.maxLevel})</span>
          <span class="research-upgrade-desc">${upgrade.description}</span>
        </div>
      `;

      if (!maxed) {
        const buyBtn = document.createElement('button');
        buyBtn.className = 'research-upgrade-btn';
        buyBtn.textContent = `${upgrade.cost} RP`;
        buyBtn.disabled = !rm.canPurchase(upgrade.id) || this.game.phase === Phase.WAVE;
        buyBtn.addEventListener('click', () => {
          if (rm.purchase(upgrade.id)) {
            this.game._refreshSupportEffects();
            this.game._applyPrestigeToTowers();
            this._renderResearchUpgrades();
          }
        });
        row.appendChild(buyBtn);
      } else {
        const maxLabel = document.createElement('span');
        maxLabel.className = 'research-maxed';
        maxLabel.textContent = 'MAX';
        row.appendChild(maxLabel);
      }

      container.appendChild(row);
    }
  }

  _projectedIncomeWithNewSunpatch() {
    const wave = this.game.waveManager.waveNumber;
    const fakeNew = { getBaseIncome: () => FARM_CONFIG.incomePerLevel[0] };
    const farms = [...this.game.placementSystem.farms, fakeNew];
    const mods = this.game.prestigeManager.getModifiers();
    return calculateFarmIncome(farms, wave, mods);
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
    this._renderSupportPanel();
    this._updateBuildSelection();
    this._updateBuildAffordability();
  }

  _updateBuildSelection() {
    const selected = this.game.placementSystem.selectedBuildType;
    for (const btn of document.querySelectorAll('#build-panel .build-btn, #support-panel .build-btn, .hotbar-card')) {
      btn.classList.toggle('selected', btn.dataset.buildType === selected);
    }
  }

  _updateBuildAffordability() {
    const gold = this.game.economy.gold;
    const ps = this.game.placementSystem;

    for (const btn of this.elements.buildPanel.querySelectorAll('.build-btn')) {
      const type = btn.dataset.buildType;
      const cost = type === FARM_CONFIG.id ? FARM_CONFIG.cost : TOWER_TYPES[type].cost;
      const adjusted = type === FARM_CONFIG.id ? cost : ps.getBuildCost(type);
      btn.classList.toggle('unaffordable', gold < adjusted);
    }

    for (const btn of this.elements.supportPanel.querySelectorAll('.build-btn')) {
      const type = btn.dataset.buildType;
      if (btn.classList.contains('locked')) continue;
      const cost = SUPPORT_TYPES[type].cost;
      btn.classList.toggle('unaffordable', gold < cost);
    }
  }

  _updateStartButton() {
    const btn = this.elements.startWave;
    if (this.game.phase === Phase.PLANNING) {
      btn.disabled = false;
      const next = this.game.waveManager.waveNumber + 1;
      const bossTag = isBossWave(next) ? ' ★BOSS' : '';
      btn.textContent = this.game.waveManager.waveNumber === 0
        ? 'Start Wave 1'
        : `Start Wave ${next}${bossTag}`;
      if (this.game.autoStartWaves && this.game.waveManager.waveNumber > 0) {
        btn.textContent += ' (auto)';
      }
    } else if (this.game.phase === Phase.WAVE) {
      btn.disabled = true;
      btn.textContent = 'Wave in progress...';
    } else {
      btn.disabled = true;
      btn.textContent = 'Game Over — click map to restart';
    }
  }

  _updatePrestigeUI() {
    const pm = this.game.prestigeManager;
    const wave = this.game.waveManager.waveNumber;
    this.elements.shards.textContent = pm.shards;
    this.elements.prestigeCount.textContent = `Prestige ×${pm.totalPrestiges} · Best W${pm.bestWave}`;

    const canPrestige = this.game.canPrestige();
    const btn = this.elements.prestigeBtn;
    btn.classList.toggle('hidden', !canPrestige && pm.totalPrestiges === 0 && wave < PRESTIGE_CONFIG.unlockWave - 5);

    if (canPrestige) {
      const shards = pm.calculateShardsForWave(wave);
      btn.disabled = this.game.phase === Phase.WAVE;
      btn.textContent = `Prestige (+${shards} Shards)`;
      this.elements.prestigeHint.textContent = `Wave ${wave} — reset run for permanent bonuses`;
    } else if (this.game.phase === Phase.GAME_OVER && wave >= PRESTIGE_CONFIG.unlockWave) {
      btn.disabled = false;
      const shards = pm.calculateShardsForWave(wave);
      btn.textContent = `Prestige (+${shards} Shards)`;
      this.elements.prestigeHint.textContent = `Run ended at Wave ${wave}`;
    } else {
      btn.disabled = true;
      btn.textContent = 'Prestige Run';
      const remaining = PRESTIGE_CONFIG.unlockWave - wave;
      this.elements.prestigeHint.textContent = remaining > 0
        ? `Reach Wave ${PRESTIGE_CONFIG.unlockWave} to unlock (${remaining} to go)`
        : 'Keep pushing — prestige unlocks at Wave 50';
    }
  }

  _renderPrestigeUpgrades() {
    const container = this.elements.prestigeUpgrades;
    container.innerHTML = '';
    const pm = this.game.prestigeManager;

    for (const upgrade of Object.values(PRESTIGE_UPGRADES)) {
      const level = pm.getUpgradeLevel(upgrade.id);
      const maxed = level >= upgrade.maxLevel;
      const row = document.createElement('div');
      row.className = 'prestige-upgrade-row';
      row.innerHTML = `
        <div class="prestige-upgrade-info">
          <span class="prestige-upgrade-name">${upgrade.name} (${level}/${upgrade.maxLevel})</span>
          <span class="prestige-upgrade-desc">${upgrade.description}</span>
        </div>
      `;

      if (!maxed) {
        const buyBtn = document.createElement('button');
        buyBtn.className = 'prestige-upgrade-btn';
        buyBtn.textContent = `${upgrade.cost} ✿`;
        buyBtn.disabled = !pm.canPurchaseUpgrade(upgrade.id);
        buyBtn.addEventListener('click', () => {
          if (pm.purchaseUpgrade(upgrade.id)) {
            this.game._applyPrestigeToTowers();
            this.game._refreshFarmIncome();
            this._renderPrestigeUpgrades();
            this._updatePrestigeUI();
          }
        });
        row.appendChild(buyBtn);
      } else {
        const maxLabel = document.createElement('span');
        maxLabel.className = 'prestige-maxed';
        maxLabel.textContent = 'MAX';
        row.appendChild(maxLabel);
      }

      container.appendChild(row);
    }
  }

  _showWaveSummary({ wave, killGold, farmIncome, waveBonus, bankInterest, rpGain, crystalGain, total }) {
    const el = this.elements.waveSummary;
    el.classList.remove('hidden');
    el.innerHTML = `
      <div class="summary-title">Wave ${wave} Harvest</div>
      <div class="summary-rows">
        ${killGold > 0 ? `<div class="summary-row"><span>Defeated foes</span><span class="gold-text">+${killGold}g</span></div>` : ''}
        ${farmIncome > 0 ? `<div class="summary-row"><span>Sunpatch harvest</span><span class="income-text">+${farmIncome}g</span></div>` : ''}
        <div class="summary-row"><span>Wave bonus</span><span class="wave-text">+${waveBonus}g</span></div>
        ${bankInterest > 0 ? `<div class="summary-row"><span>Bank interest</span><span class="gold-text">+${bankInterest}g</span></div>` : ''}
        ${rpGain > 0 ? `<div class="summary-row"><span>Research gained</span><span class="research-text">+${rpGain} RP</span></div>` : ''}
        ${crystalGain > 0 ? `<div class="summary-row"><span>Crystals mined</span><span class="crystal-text">+${crystalGain} ◆</span></div>` : ''}
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
    this.elements.selectionPlaceholder.classList.add('hidden');
    this._updateSellButton(structure);

    if (structure?.destroyed) {
      this._showDestroyedPanel(structure);
    } else if (structure.type === 'farm') {
      this._showFarmUpgrades(structure);
    } else if (structure.type === 'support') {
      this._showSupportUpgrades(structure);
    } else {
      this._showTowerUpgrades(structure);
    }
  }

  _showDestroyedPanel(data) {
    const cost = this.game.placementSystem.getRebuildCost(data);
    this.elements.upgradeTitle.textContent = 'Destroyed — Rebuild';
    this.elements.upgradeStats.innerHTML = `
      <div class="support-desc">This structure was destroyed. Rebuild at ${Math.round(REBUILD_COST_MULT * 100)}% cost.</div>
      <div>Type: <strong>${data.typeId}</strong></div>
    `;
    this.elements.upgradeButtons.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'upgrade-btn';
    btn.textContent = `Rebuild (${cost}g)`;
    btn.disabled = !this.game.economy.canAfford(cost) || this.game.phase !== Phase.PLANNING;
    btn.addEventListener('click', () => {
      this.game.placementSystem.setBuildType(data.typeId);
      this.game.placementSystem.tryPlace(data.gridX, data.gridY);
      this._hideUpgradePanel();
    });
    this.elements.upgradeButtons.appendChild(btn);
  }

  _hideUpgradePanel() {
    this.elements.upgradePanel.classList.add('hidden');
    this.elements.selectionPlaceholder.classList.remove('hidden');
    this.elements.sellBtn.classList.add('hidden');
  }

  _appendHealthStats(structure) {
    if (!structure?.maxHealth) return '';
    const pct = Math.round((structure.health / structure.maxHealth) * 100);
    const damaged = structure.health < structure.maxHealth;
    const barColor = pct > 50 ? '#4caf7a' : pct > 25 ? '#f0c040' : '#e85d5d';
    return `
      <div class="health-stat-block${damaged ? ' damaged' : ''}">
        <div>Health: <strong>${Math.round(structure.health)}</strong> / ${structure.maxHealth} (${pct}%)</div>
        ${structure.armor > 0 ? `<div>Armor: <strong>${Math.round(structure.armor * 100)}%</strong> damage reduction</div>` : ''}
        <div class="health-bar-ui">
          <div class="health-bar-fill" style="width:${pct}%;background:${barColor}"></div>
        </div>
        ${damaged ? '<div style="font-size:12px;color:#e85d5d;margin-top:4px">⚠ Structure damaged — repair recommended</div>' : ''}
      </div>
    `;
  }

  _updateSellButton(structure) {
    const btn = this.elements.sellBtn;
    if (!structure || structure.destroyed || this.game.phase !== Phase.PLANNING) {
      btn.classList.add('hidden');
      return;
    }
    const value = this.game.placementSystem.getSellValue(structure);
    btn.classList.remove('hidden');
    btn.textContent = `Sell (+${value}g)`;
    btn.disabled = false;
  }

  _showTowerUpgrades(tower) {
    const def = tower.definition;
    const stats = tower.getStats();
    const abilities = tower.getAbilityLabels();
    const next = tower.getNextUpgrade();
    const maxTier = tower.upgradePath.length;

    const progress = tower.getMasteryProgress();
    let masteryHtml = '';
    if (progress.level > 0 || progress.needed > 0) {
      const pct = Math.round(progress.pct * 100);
      masteryHtml = `
        <div class="mastery-bar-wrap">
          <div class="mastery-label">Mastery Lv${progress.level}/${progress.maxLevel}</div>
          <div class="mastery-bar"><div class="mastery-fill" style="width:${pct}%"></div></div>
          ${progress.needed > 0 ? `<div class="mastery-xp">${progress.current}/${progress.needed} XP</div>` : '<div class="mastery-xp">MAX MASTERY</div>'}
        </div>
      `;
    }

    this.elements.upgradeTitle.textContent = `${def.name} · Tier ${tower.upgradeTier}/${maxTier}`;

    let statsHtml = `
      ${masteryHtml}
      ${this._appendHealthStats(tower)}
      <div>Damage: <strong>${stats.damage}</strong></div>
      <div>Range: <strong>${stats.range.toFixed(1)}</strong></div>
      <div>Attack Speed: <strong>${stats.attackSpeed.toFixed(2)}/s</strong></div>
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
      const cost = this.game.economy.getUpgradeCost(tower, 'path');
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

    this._appendRepairButton(tower);
  }

  _showFarmUpgrades(farm) {
    const wave = this.game.waveManager.waveNumber;
    const totalIncome = this.game.economy.incomePerWave;
    const share = this.game.placementSystem.farms.length > 0
      ? Math.round(totalIncome / this.game.placementSystem.farms.length)
      : farm.getBaseIncome();

    this.elements.upgradeTitle.textContent = `${FARM_CONFIG.name} (Level ${farm.level})`;
    this.elements.upgradeStats.innerHTML = `
      ${this._appendHealthStats(farm)}
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
          wave,
          this.game.prestigeManager.getModifiers()
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
    this._appendRepairButton(farm);
  }

  _showSupportUpgrades(support) {
    const def = support.definition;
    const branchLabel = support.branch
      ? ` · ${def.branches?.[support.branch]?.name || support.branch}`
      : '';

    this.elements.upgradeTitle.textContent = `${def.name} (Level ${support.level})${branchLabel}`;

    let statsHtml = `${this._appendHealthStats(support)}<div class="support-desc">${def.description}</div>`;

    if (support.typeId === 'bank') {
      const bankStats = this.game.supportEffects.getBankStats(support);
      statsHtml += `
        <div>Stored: <strong>${support.storedGold}g</strong> / ${bankStats.capacity}g</div>
        <div>Interest: <strong>${Math.round(bankStats.interestRate * 100)}%</strong> per wave</div>
      `;
    } else if (support.typeId === 'marketplace') {
      const mult = def.perLevel.goldEarnedMult[support.level - 1];
      statsHtml += `<div>Gold bonus: <strong>+${Math.round(mult * 100)}%</strong> global</div>`;
    } else if (support.typeId === 'research_lab') {
      const rp = def.perLevel.rpPerWave[support.level - 1];
      statsHtml += `<div>Generates: <strong>+${rp} RP</strong> per wave</div>`;
    } else if (support.typeId === 'repair_station') {
      const rs = this.game.supportEffects.getStructureRepairStats(support);
      statsHtml += `<div>Heals: <strong>+${rs.waveRepairAmount} HP</strong> to nearby structures each wave</div>
        <div>Combat repair: <strong>${rs.combatRepairPerSec} HP/s</strong> · radius ${rs.radius} tiles</div>`;
    } else if (support.typeId === 'crystal_extractor') {
      const crystals = this.game.supportEffects.getCrystalYield(support);
      statsHtml += `<div>Generates: <strong>+${crystals} ◆</strong> per wave</div>`;
    } else if (support.branch && def.branches?.[support.branch]) {
      statsHtml += `<div>Path: <strong>${def.branches[support.branch].name}</strong></div>
        <div>${def.branches[support.branch].description}</div>`;
    }

    this.elements.upgradeStats.innerHTML = statsHtml;
    this.elements.upgradeButtons.innerHTML = '';

    if (support.typeId === 'bank') {
      const depositBtn = document.createElement('button');
      depositBtn.className = 'upgrade-btn';
      depositBtn.textContent = 'Deposit 50g';
      depositBtn.disabled = this.game.phase !== Phase.PLANNING || this.game.economy.gold < 50;
      depositBtn.addEventListener('click', () => {
        if (this.game.placementSystem.depositToBank(support, 50)) {
          this._showSupportUpgrades(support);
        }
      });
      this.elements.upgradeButtons.appendChild(depositBtn);

      const withdrawBtn = document.createElement('button');
      withdrawBtn.className = 'upgrade-btn';
      withdrawBtn.textContent = 'Withdraw 50g';
      withdrawBtn.disabled = this.game.phase !== Phase.PLANNING || support.storedGold < 50;
      withdrawBtn.addEventListener('click', () => {
        if (this.game.placementSystem.withdrawFromBank(support, 50)) {
          this._showSupportUpgrades(support);
        }
      });
      this.elements.upgradeButtons.appendChild(withdrawBtn);
    }

    if (support.needsBranchChoice()) {
      const branches = def.branches;
      for (const [key, branch] of Object.entries(branches)) {
        const btn = document.createElement('button');
        btn.className = 'upgrade-btn branch-btn';
        btn.innerHTML = `<span class="upgrade-btn-name">${branch.name}</span><span class="upgrade-btn-detail">${branch.description}</span>`;
        btn.disabled = this.game.phase !== Phase.PLANNING;
        btn.addEventListener('click', () => {
          if (this.game.placementSystem.upgradeSelected('level', key)) {
            this._showSupportUpgrades(support);
          }
        });
        this.elements.upgradeButtons.appendChild(btn);
      }
      return;
    }

    const cost = this.game.economy.getUpgradeCost(support, 'level');
    if (cost !== null) {
      const btn = document.createElement('button');
      btn.className = 'upgrade-btn';
      btn.textContent = `↑ Upgrade (${cost}g)`;
      btn.disabled = !this.game.economy.canAfford(cost) || this.game.phase !== Phase.PLANNING;
      btn.addEventListener('click', () => {
        if (this.game.placementSystem.upgradeSelected('level')) {
          this._showSupportUpgrades(support);
        }
      });
      this.elements.upgradeButtons.appendChild(btn);
    } else {
      const max = document.createElement('div');
      max.className = 'upgrade-maxed';
      max.textContent = '★ Fully upgraded';
      this.elements.upgradeButtons.appendChild(max);
    }
  }

  _appendRepairButton(structure) {
    const cost = getRepairCost(structure);
    if (cost === null || cost <= 0) return;
    const btn = document.createElement('button');
    btn.className = 'upgrade-btn';
    btn.textContent = `Repair (${cost}g)`;
    btn.disabled = !this.game.economy.canAfford(cost) || this.game.phase !== Phase.PLANNING;
    btn.addEventListener('click', () => {
      if (this.game.placementSystem.manualRepair(structure)) {
        if (structure.type === 'tower') this._showTowerUpgrades(structure);
        else if (structure.type === 'farm') this._showFarmUpgrades(structure);
        else this._showSupportUpgrades(structure);
      }
    });
    this.elements.upgradeButtons.appendChild(btn);
  }

  _updateUpgradeButtons() {
    const structure = this.game.placementSystem.selectedStructure;
    if (structure) this._showUpgradePanel(structure);
  }
}
