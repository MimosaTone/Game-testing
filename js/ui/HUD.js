import { Events } from '../core/EventBus.js';
import { TOWER_TYPES } from '../config/towerTypes.js';
import { FARM_CONFIG } from '../config/farmConfig.js';
import { SUPPORT_TYPES, SUPPORT_BUILD_ORDER } from '../config/supportConfig.js';
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
import { isBossWave } from '../config/waveConfig.js?v=20260710c';
import { TOWER_OVERCLOCKS, STRUCTURE_REINFORCEMENTS } from '../config/investmentConfig.js';
import { LEGENDARY_UPGRADES, LEGENDARY_UNLOCK_WAVE } from '../config/legendaryConfig.js';
import {
  PERMANENT_OVERCLOCK,
  ELITE_TOWER_OVERCLOCKS,
  getOverclockPathsForTower,
} from '../config/towerOverclockConfig.js';

/**
 * HUD and build panel UI controller.
 */
export class HUD {
  constructor(game) {
    this.game = game;
    this.hotbarCategory = 'towers';
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
      factionPreview: document.getElementById('faction-preview'),
      shards: document.getElementById('shards-value'),
      crystals: document.getElementById('crystals-value'),
      research: document.getElementById('research-value'),
      researchHint: document.getElementById('research-hint'),
      openResearchMenuBtn: document.getElementById('open-research-menu-btn'),
      prestigeCount: document.getElementById('prestige-count'),
      openPrestigeMenuBtn: document.getElementById('open-prestige-menu-btn'),
      autoStartToggle: document.getElementById('auto-start-toggle'),
      resetSaveBtn: null,
      speedBtn: document.getElementById('speed-btn'),
      repairAllBtn: document.getElementById('repair-all-btn'),
      sellModeBtn: document.getElementById('sell-mode-btn'),
      challengeHint: document.getElementById('challenge-hint'),
      challengePresetName: document.getElementById('challenge-preset-name'),
      challengeReward: document.getElementById('challenge-reward'),
      challengeDifficulty: document.getElementById('challenge-difficulty'),
      challengeModCount: document.getElementById('challenge-mod-count'),
      hotbarTabs: document.getElementById('hotbar-tabs'),
      hotbarCards: document.getElementById('hotbar-cards'),
    };

    this._bindEvents();
    this._subscribe();
    this._renderBuildPanel();
    this._renderSupportPanel();
    this._renderHotbar();
    this._renderResearchUpgrades();
    this._renderChallengeSummary();
    this._updateStartButton();
    this._updatePrestigeSummary();
    this._updateFactionPreview();
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

    this.elements.resetSaveBtn = null;

    this.elements.openPrestigeMenuBtn.addEventListener('click', () => {
      this.game.prestigeMenu?.open();
    });

    this.elements.openResearchMenuBtn.addEventListener('click', () => {
      this.game.researchMenu?.open();
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

  }

  _subscribe() {
    const bus = this.game.eventBus;

    bus.on(Events.GOLD_CHANGED, (gold) => {
      this.elements.gold.textContent = gold;
      this._updateBuildAffordability();
      this._updateUpgradeButtons();
      this._renderHotbarCards();
      this._updateStatusPanel();
    });

    bus.on(Events.CRYSTALS_CHANGED, (crystals) => {
      this.elements.crystals.textContent = crystals;
    });

    bus.on(Events.RESEARCH_CHANGED, (state) => {
      this.elements.research.textContent = `${state.points} RP`;
      this._renderResearchUpgrades();
      this._renderBuildPanel();
      this._renderSupportPanel();
      this._renderHotbarCards();
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
      this._updatePrestigeSummary();
      this._updateFactionPreview();
    });

    bus.on(Events.PRESTIGE_CHANGED, () => {
      this._updatePrestigeSummary();
    });

    bus.on(Events.WORLD_TIER_CHANGED, ({ next }) => {
      this.elements.waveSummary.classList.remove('hidden');
      this.elements.waveSummary.innerHTML = `
        <div class="summary-title mastery-alert">☠ World Threat Rising</div>
        <p class="mastery-alert-text">Tier ${next.roman} — <strong>${next.name}</strong>. The meadow grows more dangerous… and more rewarding.</p>
      `;
      this._updatePrestigeSummary();
      this._updateFactionPreview();
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

    bus.on(Events.INVESTMENT_CHANGED, () => {
      this._updateUpgradeButtons();
      this._updateStatusPanel();
    });

    bus.on(Events.WAVE_STARTED, () => {
      this._updateStartButton();
      this._renderChallengeSummary();
      this._hideFactionPreview();
      this._hideUpgradePanel();
      this._hideWaveSummary();
      this.game.placementSystem.clearSelection();
      this.game.placementSystem.sellMode = false;
      this.elements.sellModeBtn.classList.remove('active');
      this.elements.sellModeBtn.textContent = 'Sell Mode';
      this._updateBuildSelection();
      this._updateStatusPanel();
      this._renderResearchUpgrades();
    });

    bus.on(Events.WAVE_COMPLETED, () => {
      this._updateStartButton();
      this._renderChallengeSummary();
      this._updateFactionPreview();
      this._refreshBuildPanelHints();
      this._updatePrestigeSummary();
      this._renderResearchUpgrades();
    });

    bus.on(Events.GAME_OVER, () => {
      this._updateStartButton();
      this._renderChallengeSummary();
      this._hideFactionPreview();
      this._updatePrestigeSummary();
    });

    bus.on(Events.PRESTIGE_COMPLETED, ({ earned }) => {
      alert(`Prestige complete! You earned ${earned} Prestige Tokens (✿).`);
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
      this._updatePrestigeSummary();
      this._updateFactionPreview();
      this._updateStartButton();
      this._renderChallengeSummary();
      this._updateBuildAffordability();
      this._updateStatusPanel();
      this.elements.crystals.textContent = this.game.economy.crystals;
      this.elements.research.textContent = `${this.game.researchManager.points} RP`;
    });

    bus.on(Events.SAVE_CLEARED, () => {
      this.elements.autoStartToggle.checked = false;
    });

    bus.on(Events.BOSS_WAVE, (data) => {
      const wave = typeof data === 'number' ? data : data.wave;
      const scaling = typeof data === 'object' ? data.scaling : null;
      const faction = typeof data === 'object' ? data.faction?.display : null;
      const tierNote = scaling?.bossTierMechanic || scaling?.bossTierModifier
        ? `<p class="boss-alert-text">Boss modifier: ${scaling.bossTierMechanic || ''} ${scaling.bossTierModifier || ''}</p>`
        : '';
      const factionNote = faction
        ? `<p class="boss-alert-text" style="color: ${faction.color}">Faction: ${faction.displayName} — ${faction.warning}</p>`
        : '';
      this.elements.waveSummary.classList.remove('hidden');
      this.elements.waveSummary.innerHTML = `
        <div class="summary-title boss-alert">⚠ Boss Wave ${wave}</div>
        <p class="boss-alert-text">A powerful invader approaches. Prepare your defenses!</p>
        ${factionNote}
        ${tierNote}
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
      this._renderChallengeSummary();
      this._updateFactionPreview();
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

    const repairCost = this.game.placementSystem.getRepairAllCost();
    const canRepair = this.game.phase === Phase.PLANNING && repairCost > 0;
    this.elements.repairAllBtn.textContent = repairCost > 0
      ? `Repair All (${repairCost}g)`
      : 'Repair All';
    this.elements.repairAllBtn.disabled = !canRepair || !this.game.economy.canAfford(repairCost);
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
      const isTower = !!TOWER_TYPES[typeId];
      const unlocked = isTower
        ? this.game.isTowerUnlocked(typeId)
        : isSupport
          ? this.game.isSupportUnlocked(typeId)
          : true;
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

  _renderChallengeSummary() {
    const cm = this.game.challengeManager;
    const state = cm.getState();
    const customPresets = this.game.prestigeManager.getCustomChallengePresets();

    this.elements.challengePresetName.textContent = cm.getPresetDisplayName(customPresets);
    this.elements.challengeReward.textContent = `${state.rewardMultiplier.toFixed(1)}×`;
    this.elements.challengeDifficulty.textContent = `${state.difficulty.label} (${state.difficulty.score})`;
    this.elements.challengeDifficulty.dataset.tier = state.difficulty.label.toLowerCase();
    this.elements.challengeModCount.textContent = String(state.active.length);
  }

  _renderSupportPanel() {
    const panel = this.elements.supportPanel;
    panel.innerHTML = '';
    const ps = this.game.placementSystem;

    for (const typeId of SUPPORT_BUILD_ORDER) {
      const def = SUPPORT_TYPES[typeId];
      const unlocked = this.game.isSupportUnlocked(typeId);
      const btn = document.createElement('button');
      btn.className = 'build-btn support-btn';
      btn.dataset.buildType = typeId;
      if (!unlocked) btn.classList.add('locked');

      const lockHint = def.unlockAfterWave
        ? `Unlocks after Boss (Wave ${def.unlockAfterWave})`
        : def.unlockWave
          ? `Unlocks at Wave ${def.unlockWave}`
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
    const rm = this.game.researchManager;
    const rp = rm.points;
    const ranks = rm.getTotalMainRanks();

    this.elements.researchHint.textContent = rp > 0
      ? `${rp} RP available · ${ranks} tree ranks · open Research Tree to specialize`
      : 'Build Research Labs to earn RP, then open the Research Tree';
  }

  _projectedIncomeWithNewSunpatch() {
    const wave = this.game.waveManager.waveNumber;
    const fakeNew = { getBaseIncome: () => FARM_CONFIG.incomePerLevel[0] };
    const farms = [...this.game.placementSystem.farms, fakeNew];
    return calculateFarmIncome(farms, wave, this.game.getFarmIncomeMods());
  }

  _renderBuildPanel() {
    const panel = this.elements.buildPanel;
    panel.innerHTML = '';

    const projectedIncome = this._projectedIncomeWithNewSunpatch();
    const sunpatchPayback = estimatePaybackWaves(FARM_CONFIG.cost, projectedIncome);

    const items = [
      ...Object.values(TOWER_TYPES)
        .filter((t) => this.game.isTowerUnlocked(t.id))
        .map((t) => ({
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

  _updateFactionPreview() {
    if (this.game.phase !== Phase.PLANNING) {
      this._hideFactionPreview();
      return;
    }

    const nextWave = this.game.waveManager.waveNumber + 1;
    const meta = this.game.waveManager.getNextWaveFactionMeta();
    const display = meta.display;
    const el = this.elements.factionPreview;
    const bossTag = isBossWave(nextWave) ? ' ★' : '';

    el.classList.remove('hidden');
    el.style.borderColor = `${display.color}55`;
    el.style.background = `${display.color}14`;
    el.innerHTML = `
      <div class="faction-preview-title" style="color: ${display.color}">
        Incoming: ${display.displayName.toUpperCase()}${bossTag}
      </div>
      <p class="faction-preview-warning">${display.warning}</p>
      <div class="faction-preview-strength">${display.strength}</div>
    `;
  }

  _hideFactionPreview() {
    this.elements.factionPreview.classList.add('hidden');
  }

  _updatePrestigeSummary() {
    const pm = this.game.prestigeManager;
    this.elements.shards.textContent = pm.shards;
    const tier = this.game.getWorldTier();
    const rewardPct = Math.round(tier.rewardBonus * 100);
    this.elements.prestigeCount.textContent = `Tier ${tier.roman} ${tier.name} · Lv ${pm.prestigeLevel} · Best W${pm.bestWave}${rewardPct > 0 ? ` · +${rewardPct}% rewards` : ''}`;
  }

  _showWaveSummary({ wave, killGold, farmIncome, waveBonus, bankInterest, rpGain, crystalGain, total, rewardMult }) {
    const el = this.elements.waveSummary;
    const insight = this.game.researchManager.getModifiers().waveRewardInsight ?? 0;
    const tier = this.game.getWorldTier();
    const tierBonus = tier.rewardBonus > 0
      ? `<div class="summary-row"><span>World Tier ${tier.roman} bonus</span><span>+${Math.round(tier.rewardBonus * 100)}%</span></div>`
      : '';
    const insightNote = insight > 0
      ? `<div class="summary-row summary-insight"><span>Scout estimate</span><span>~${this.game.getEstimatedWaveReward()}g next wave</span></div>`
      : '';
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
        ${tierBonus}
        <div class="summary-row summary-total"><span>Total earned</span><span>+${total}g</span></div>
        ${insightNote}
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
    this._appendPermanentOverclockButtons(tower);
    this._appendTowerInvestmentButtons(tower);
  }

  _appendPermanentOverclockButtons(tower) {
    const im = this.game.investmentManager;
    const paths = getOverclockPathsForTower(tower.typeId);
    if (!paths) return;

    const maxedUpgrade = tower.upgradeTier >= tower.upgradePath.length;
    const unlocked = im.canPermanentOverclock(tower, this.game);
    const totalLevels = im.getPermanentOverclockTotalLevels(tower.id);
    const hasInvestment = totalLevels > 0 || im.eliteOverclocks[tower.id];

    if (!maxedUpgrade && !hasInvestment) {
      const lock = document.createElement('div');
      lock.className = 'investment-locked-hint';
      lock.textContent = 'Permanent Overclock unlocks after max upgrade tier';
      this.elements.upgradeButtons.appendChild(lock);
      return;
    }

    if (!unlocked && !hasInvestment) {
      const lock = document.createElement('div');
      lock.className = 'investment-locked-hint';
      lock.textContent = `Permanent Overclock unlocks at wave ${PERMANENT_OVERCLOCK.unlockWave}`;
      this.elements.upgradeButtons.appendChild(lock);
      return;
    }

    const header = document.createElement('div');
    header.className = 'investment-section-label permanent-oc-label';
    header.textContent = `Permanent Overclock (${totalLevels} levels invested)`;
    this.elements.upgradeButtons.appendChild(header);

    const canBuy = this.game.phase === Phase.PLANNING;
    for (const def of Object.values(paths)) {
      const level = im.getPermanentOverclockLevel(tower.id, def.id);
      const maxed = level >= PERMANENT_OVERCLOCK.maxLevelPerPath;
      const cost = im.getPermanentOverclockPathCost(tower, def.id);

      if (maxed) {
        const row = document.createElement('div');
        row.className = 'investment-maxed-row';
        row.textContent = `⚙ ${def.name} (${level}/${PERMANENT_OVERCLOCK.maxLevelPerPath}) — MAX`;
        this.elements.upgradeButtons.appendChild(row);
        continue;
      }

      if (!canBuy) continue;

      const btn = document.createElement('button');
      btn.className = 'upgrade-btn investment-btn permanent-oc-btn';
      btn.innerHTML = `<span class="upgrade-btn-name">⚙ ${def.name}</span><span class="upgrade-btn-detail">${def.description} · ${cost}g (${level}/${PERMANENT_OVERCLOCK.maxLevelPerPath})</span>`;
      btn.disabled = cost === null || !this.game.economy.canAfford(cost);
      btn.addEventListener('click', () => {
        if (im.purchasePermanentOverclock(this.game, tower, def.id)) {
          this.game.saveGame();
          this._showTowerUpgrades(tower);
        }
      });
      this.elements.upgradeButtons.appendChild(btn);
    }

    const eliteOwned = im.getEliteOverclockDef(tower);
    if (eliteOwned) {
      const owned = document.createElement('div');
      owned.className = 'investment-active-hint elite-oc-owned';
      owned.textContent = `${eliteOwned.tag} — ${eliteOwned.name}: ${eliteOwned.description}`;
      this.elements.upgradeButtons.appendChild(owned);
    } else if (canBuy && im.canPurchaseEliteOverclock(tower, this.game)) {
      const eliteCfg = ELITE_TOWER_OVERCLOCKS[tower.typeId];
      const cost = im.getEliteOverclockCostForTower(tower);
      const btn = document.createElement('button');
      btn.className = 'upgrade-btn investment-btn elite-oc-btn';
      btn.innerHTML = `<span class="upgrade-btn-name">★ ${eliteCfg.name}</span><span class="upgrade-btn-detail">${eliteCfg.description} · ${cost}g</span>`;
      btn.disabled = !this.game.economy.canAfford(cost);
      btn.addEventListener('click', () => {
        if (im.purchaseEliteOverclock(this.game, tower)) {
          this.game.saveGame();
          this._showTowerUpgrades(tower);
        }
      });
      this.elements.upgradeButtons.appendChild(btn);
    } else if (canBuy && totalLevels > 0 && totalLevels < PERMANENT_OVERCLOCK.eliteMinTotalLevels) {
      const hint = document.createElement('div');
      hint.className = 'investment-locked-hint';
      hint.textContent = `Elite Overclock at ${PERMANENT_OVERCLOCK.eliteMinTotalLevels} total levels (${totalLevels}/${PERMANENT_OVERCLOCK.eliteMinTotalLevels})`;
      this.elements.upgradeButtons.appendChild(hint);
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
          this.game.getFarmIncomeMods()
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
    this._appendStructureReinforcementButtons(farm);
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
    this._appendRepairButton(support);
    this._appendStructureReinforcementButtons(support);
  }

  _appendTowerInvestmentButtons(tower) {
    const im = this.game.investmentManager;
    const canBuy = this.game.phase === Phase.PLANNING;
    const oc = im.overclocks[tower.id];

    if (oc) {
      const def = TOWER_OVERCLOCKS[oc.type];
      const hint = document.createElement('div');
      hint.className = 'investment-active-hint';
      hint.textContent = `⚡ ${def?.name || 'Overclock'} — ${oc.wavesLeft} wave(s) left`;
      this.elements.upgradeButtons.appendChild(hint);
    } else if (canBuy) {
      const header = document.createElement('div');
      header.className = 'investment-section-label';
      header.textContent = 'Surge Overclock (3 waves)';
      this.elements.upgradeButtons.appendChild(header);

      for (const def of Object.values(TOWER_OVERCLOCKS)) {
        const btn = document.createElement('button');
        btn.className = 'upgrade-btn investment-btn';
        btn.innerHTML = `<span class="upgrade-btn-name">⚡ ${def.name}</span><span class="upgrade-btn-detail">${def.description} · ${def.cost}g</span>`;
        btn.disabled = !this.game.economy.canAfford(def.cost);
        btn.addEventListener('click', () => {
          if (im.purchaseOverclock(this.game, tower, def.id)) {
            this.game.saveGame();
            this._showTowerUpgrades(tower);
          }
        });
        this.elements.upgradeButtons.appendChild(btn);
      }
    }

    const wave = this.game.waveManager.waveNumber;
    const legDef = LEGENDARY_UPGRADES[tower.typeId];
    if (legDef) {
      if (im.legendary[tower.id]) {
        const owned = document.createElement('div');
        owned.className = 'investment-active-hint legendary-owned';
        owned.textContent = `★ ${legDef.name} — ${legDef.description}`;
        this.elements.upgradeButtons.appendChild(owned);
      } else if (canBuy && wave >= LEGENDARY_UNLOCK_WAVE) {
        const btn = document.createElement('button');
        btn.className = 'upgrade-btn investment-btn legendary-btn';
        btn.innerHTML = `<span class="upgrade-btn-name">★ ${legDef.name}</span><span class="upgrade-btn-detail">${legDef.description} · ${legDef.cost}g</span>`;
        btn.disabled = !this.game.economy.canAfford(legDef.cost);
        btn.addEventListener('click', () => {
          if (im.purchaseLegendary(this.game, tower)) {
            this.game.saveGame();
            this._showTowerUpgrades(tower);
          }
        });
        this.elements.upgradeButtons.appendChild(btn);
      } else if (wave < LEGENDARY_UNLOCK_WAVE) {
        const lock = document.createElement('div');
        lock.className = 'investment-locked-hint';
        lock.textContent = `Legendary unlocks at wave ${LEGENDARY_UNLOCK_WAVE}`;
        this.elements.upgradeButtons.appendChild(lock);
      }
    }
  }

  _appendStructureReinforcementButtons(structure) {
    if (this.game.phase !== Phase.PLANNING) return;
    const im = this.game.investmentManager;
    const key = `${structure.gridX},${structure.gridY}`;

    const header = document.createElement('div');
    header.className = 'investment-section-label';
    header.textContent = 'Reinforce (permanent this run)';
    this.elements.upgradeButtons.appendChild(header);

    for (const def of Object.values(STRUCTURE_REINFORCEMENTS)) {
      const level = im.reinforcements[`${key}:${def.id}`] || 0;
      const cost = im.getReinforcementCost(key, def.id);
      const maxed = level >= def.maxLevel;

      if (maxed) {
        const row = document.createElement('div');
        row.className = 'investment-maxed-row';
        row.textContent = `${def.name} (${level}/${def.maxLevel}) — MAX`;
        this.elements.upgradeButtons.appendChild(row);
        continue;
      }

      const btn = document.createElement('button');
      btn.className = 'upgrade-btn investment-btn';
      btn.innerHTML = `<span class="upgrade-btn-name">🛡 ${def.name}</span><span class="upgrade-btn-detail">${def.description} · ${cost}g (${level}/${def.maxLevel})</span>`;
      btn.disabled = cost === null || !this.game.economy.canAfford(cost);
      btn.addEventListener('click', () => {
        if (im.purchaseReinforcement(this.game, structure, def.id)) {
          this.game.saveGame();
          if (structure.type === 'tower') this._showTowerUpgrades(structure);
          else if (structure.type === 'farm') this._showFarmUpgrades(structure);
          else this._showSupportUpgrades(structure);
        }
      });
      this.elements.upgradeButtons.appendChild(btn);
    }
  }

  _appendRepairButton(structure) {
    const mult = this.game.investmentManager?.getStructureRepairCostMult?.(structure) ?? 1;
    const cost = getRepairCost(structure, mult);
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
