import { Events } from '../core/EventBus.js';
import { Phase } from '../core/Game.js';
import {
  CHALLENGE_PRESETS,
  CHALLENGE_MODIFIER_CATEGORIES,
  CHALLENGE_MODIFIER_CATEGORY_ORDER,
  EVERCLEAR_CONFIRM,
  getModifiersByCategory,
  getOrderedBuiltinPresets,
  getPresetDisplay,
  isPresetUnlocked,
} from '../config/challengeConfig.js?v=20260710m';

/**
 * Bottom-dock Custom Game Editor — presets and challenge modifier toggles.
 */
export class CustomGameEditor {
  constructor(game) {
    this.game = game;
    this.activeDock = 'build';
    this.root = document.getElementById('bottom-dock-custom');
    this._buildDOM();
    this._bindDockTabs();
    this._subscribe();
    this.render();
  }

  _buildDOM() {
    this.root.innerHTML = `
      <div class="cge-header">
        <div class="cge-header-text">
          <h3 class="cge-title">Custom Game Editor</h3>
          <p class="cge-subtitle" id="cge-hint">Tune modifiers before or during a run</p>
        </div>
        <div class="cge-live-stats">
          <div class="cge-stat">
            <span class="cge-stat-label">Reward Bonus</span>
            <span class="cge-stat-value cge-reward" id="cge-reward">1.0×</span>
          </div>
          <div class="cge-stat">
            <span class="cge-stat-label">Difficulty</span>
            <span class="cge-stat-value cge-difficulty" id="cge-difficulty">Relaxed</span>
          </div>
          <div class="cge-stat">
            <span class="cge-stat-label">Score</span>
            <span class="cge-stat-value" id="cge-difficulty-score">0</span>
          </div>
        </div>
      </div>
      <div class="cge-toolbar">
        <label class="cge-preset-label">
          <span>Preset</span>
          <select id="cge-preset-select" class="cge-preset-select"></select>
        </label>
        <button type="button" id="cge-save-preset-btn" class="secondary-btn cge-toolbar-btn">Save Custom</button>
        <button type="button" id="cge-delete-preset-btn" class="secondary-btn cge-toolbar-btn" disabled>Delete</button>
        <button type="button" id="cge-clear-btn" class="secondary-btn cge-toolbar-btn">Clear All</button>
      </div>
      <div id="cge-preset-meta" class="cge-preset-meta hidden">
        <div class="cge-preset-meta-titles">
          <span class="preset-title" id="cge-preset-title"></span>
          <span class="preset-traditional" id="cge-preset-traditional"></span>
        </div>
        <p class="cge-preset-desc" id="cge-preset-desc"></p>
        <div id="cge-everclear-stats" class="cge-everclear-stats hidden"></div>
      </div>
      <div id="cge-confirm-modal" class="cge-confirm-modal hidden" role="dialog" aria-modal="true">
        <div class="cge-confirm-card">
          <h4 id="cge-confirm-title"></h4>
          <p id="cge-confirm-body"></p>
          <div class="cge-confirm-actions">
            <button type="button" id="cge-confirm-enter" class="primary-btn"></button>
            <button type="button" id="cge-confirm-cancel" class="secondary-btn"></button>
          </div>
        </div>
      </div>
      <div id="cge-modifier-groups" class="cge-modifier-groups"></div>
    `;

    this.elements = {
      hint: document.getElementById('cge-hint'),
      reward: document.getElementById('cge-reward'),
      difficulty: document.getElementById('cge-difficulty'),
      difficultyScore: document.getElementById('cge-difficulty-score'),
      presetSelect: document.getElementById('cge-preset-select'),
      presetMeta: document.getElementById('cge-preset-meta'),
      presetTitle: document.getElementById('cge-preset-title'),
      presetTraditional: document.getElementById('cge-preset-traditional'),
      presetDesc: document.getElementById('cge-preset-desc'),
      everclearStats: document.getElementById('cge-everclear-stats'),
      confirmModal: document.getElementById('cge-confirm-modal'),
      confirmTitle: document.getElementById('cge-confirm-title'),
      confirmBody: document.getElementById('cge-confirm-body'),
      confirmEnter: document.getElementById('cge-confirm-enter'),
      confirmCancel: document.getElementById('cge-confirm-cancel'),
      savePresetBtn: document.getElementById('cge-save-preset-btn'),
      deletePresetBtn: document.getElementById('cge-delete-preset-btn'),
      clearBtn: document.getElementById('cge-clear-btn'),
      modifierGroups: document.getElementById('cge-modifier-groups'),
    };

    this._pendingPresetId = null;

    this.elements.presetSelect.addEventListener('change', () => this._onPresetChange());
    this.elements.savePresetBtn.addEventListener('click', () => this._saveCustomPreset());
    this.elements.deletePresetBtn.addEventListener('click', () => this._deleteCustomPreset());
    this.elements.clearBtn.addEventListener('click', () => this._clearModifiers());
    this.elements.confirmEnter.addEventListener('click', () => this._confirmPendingPreset());
    this.elements.confirmCancel.addEventListener('click', () => this._cancelPendingPreset());
  }

  _bindDockTabs() {
    const tabs = document.querySelectorAll('.bottom-dock-tab');
    for (const tab of tabs) {
      tab.addEventListener('click', () => {
        const dock = tab.dataset.dock;
        if (!dock || dock === this.activeDock) return;
        this.setDock(dock);
      });
    }

    const openBtn = document.getElementById('open-custom-editor-btn');
    openBtn?.addEventListener('click', () => this.setDock('custom'));
  }

  _subscribe() {
    this.game.eventBus.on(Events.CHALLENGE_CHANGED, () => this.render());
    this.game.eventBus.on(Events.SAVE_LOADED, () => this.render());
    this.game.eventBus.on(Events.WAVE_STARTED, () => this.render());
    this.game.eventBus.on(Events.WAVE_COMPLETED, () => this.render());
    this.game.eventBus.on(Events.CHALLENGE_PRESET_UNLOCKED, (data) => this._onPresetUnlocked(data));
  }

  _onPresetUnlocked(data) {
    this.render();
    if (data?.message) {
      this.elements.hint.textContent = data.message;
    }
  }

  _getUnlockedSecrets() {
    return this.game.prestigeManager.getUnlockedChallengePresets();
  }

  setDock(dock) {
    this.activeDock = dock;
    const buildPane = document.getElementById('bottom-dock-build');
    const customPane = document.getElementById('bottom-dock-custom');
    for (const tab of document.querySelectorAll('.bottom-dock-tab')) {
      tab.classList.toggle('active', tab.dataset.dock === dock);
    }
    buildPane?.classList.toggle('hidden', dock !== 'build');
    customPane?.classList.toggle('hidden', dock !== 'custom');
  }

  _getCustomPresets() {
    return this.game.prestigeManager.settings.customChallengePresets ?? [];
  }

  _canEdit() {
    return this.game.challengeManager.canEdit(this.game.phase);
  }

  render() {
    this._renderPresetSelect();
    this._renderPresetMeta();
    this._renderModifierGroups();
    this._renderStats();
    this._renderEditState();
  }

  _renderEditState() {
    const canEdit = this._canEdit();
    const hint = canEdit
      ? 'Enable modifiers below — reward and difficulty update live'
      : this.game.phase === Phase.GAME_OVER
        ? 'Game over — start a new run to customize'
        : 'Modifiers apply to the current run';

    this.elements.hint.textContent = hint;
    this.elements.presetSelect.disabled = !canEdit;
    this.elements.savePresetBtn.disabled = !canEdit;
    this.elements.clearBtn.disabled = !canEdit;

    const presetId = this.game.challengeManager.presetId;
    const isCustomSaved = presetId.startsWith('custom_');
    this.elements.deletePresetBtn.disabled = !canEdit || !isCustomSaved;
  }

  _renderStats() {
    const cm = this.game.challengeManager;
    const state = cm.getState();
    this.elements.reward.textContent = `${state.rewardMultiplier.toFixed(1)}×`;
    this.elements.difficulty.textContent = state.difficulty.label;
    this.elements.difficultyScore.textContent = String(state.difficulty.score);
    this.elements.difficulty.dataset.tier = state.difficulty.label.toLowerCase();
  }

  _renderPresetSelect() {
    const cm = this.game.challengeManager;
    const current = cm.presetId;
    const select = this.elements.presetSelect;
    const unlocked = this._getUnlockedSecrets();
    select.innerHTML = '';

    const builtinGroup = document.createElement('optgroup');
    builtinGroup.label = 'Built-in';
    for (const preset of getOrderedBuiltinPresets()) {
      const unlockedPreset = isPresetUnlocked(preset, unlocked);
      const opt = document.createElement('option');
      opt.value = preset.id;
      if (unlockedPreset) {
        opt.textContent = preset.name;
        opt.title = preset.traditionalName
          ? `${preset.name} (${preset.traditionalName})`
          : preset.name;
        if (preset.secret) opt.className = 'cge-everclear-option';
      } else {
        opt.textContent = '???';
        opt.disabled = true;
        opt.dataset.lockedSecret = 'true';
      }
      builtinGroup.appendChild(opt);
    }
    select.appendChild(builtinGroup);

    const customs = this._getCustomPresets();
    if (customs.length > 0) {
      const customGroup = document.createElement('optgroup');
      customGroup.label = 'Your Presets';
      for (const preset of customs) {
        const opt = document.createElement('option');
        opt.value = preset.id;
        opt.textContent = preset.name;
        customGroup.appendChild(opt);
      }
      select.appendChild(customGroup);
    }

    if ([...select.options].some((o) => o.value === current)) {
      select.value = current;
    } else if (current === 'custom' || cm.active.size > 0) {
      const opt = document.createElement('option');
      opt.value = 'custom';
      opt.textContent = 'Custom Mix';
      select.insertBefore(opt, select.firstChild);
      select.value = 'custom';
    } else {
      select.value = 'normal';
    }
  }

  _renderPresetMeta() {
    const cm = this.game.challengeManager;
    const customPresets = this._getCustomPresets();
    const unlocked = this._getUnlockedSecrets();
    const display = getPresetDisplay(cm.presetId, customPresets, unlocked);
    const meta = this.elements.presetMeta;
    const preset = CHALLENGE_PRESETS[cm.presetId];

    meta.classList.toggle('cge-preset-meta--everclear', preset?.secret && unlocked.includes(preset.id));
    this.elements.presetTitle.textContent = display.title;
    this.elements.presetTraditional.textContent = display.traditional ?? '';
    this.elements.presetTraditional.classList.toggle('hidden', !display.traditional);
    this.elements.presetDesc.textContent = display.description ?? '';
    meta.classList.toggle('hidden', !display.title && !display.description);

    const statsEl = this.elements.everclearStats;
    if (preset?.id === 'everclear_pain' && unlocked.includes('everclear_pain')) {
      const stats = this.game.prestigeManager.getEverclearStats();
      const state = cm.getState();
      statsEl.innerHTML = `
        <div class="cge-everclear-stat"><span>Reward</span><strong>${state.rewardMultiplier.toFixed(1)}×</strong></div>
        <div class="cge-everclear-stat"><span>First-clear</span><strong>${preset.firstClearReward ?? 'Pure Pain Artifact'}</strong></div>
        <div class="cge-everclear-stat"><span>Best wave</span><strong>${stats.bestWave || '—'}</strong></div>
        <div class="cge-everclear-stat"><span>Clears</span><strong>${stats.clears}</strong></div>
      `;
      statsEl.classList.remove('hidden');
    } else {
      statsEl.classList.add('hidden');
      statsEl.innerHTML = '';
    }
  }

  _renderModifierGroups() {
    const cm = this.game.challengeManager;
    const canEdit = this._canEdit();
    const grouped = getModifiersByCategory();
    const container = this.elements.modifierGroups;
    container.innerHTML = '';

    for (const catId of CHALLENGE_MODIFIER_CATEGORY_ORDER) {
      const mods = grouped[catId];
      if (!mods?.length) continue;
      const cat = CHALLENGE_MODIFIER_CATEGORIES[catId];

      const section = document.createElement('section');
      section.className = 'cge-category';
      section.innerHTML = `<h4 class="cge-category-title">${cat.icon} ${cat.name}</h4>`;

      const grid = document.createElement('div');
      grid.className = 'cge-mod-grid';

      for (const mod of mods) {
        const active = cm.active.has(mod.id);
        const row = document.createElement('label');
        row.className = 'cge-mod-toggle';
        row.innerHTML = `
          <input type="checkbox" ${active ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
          <span class="cge-mod-body">
            <span class="cge-mod-name">${mod.name}</span>
            <span class="cge-mod-desc">${mod.description}</span>
            <span class="cge-mod-meta">
              <span class="cge-mod-diff">${mod.difficulty}</span>
              <span class="cge-mod-bonus">+${Math.round(mod.rewardBonus * 100)}%</span>
            </span>
          </span>
        `;
        row.querySelector('input').addEventListener('change', () => {
          cm.toggleModifier(mod.id, this.game.phase);
        });
        grid.appendChild(row);
      }

      section.appendChild(grid);
      container.appendChild(section);
    }
  }

  _onPresetChange() {
    const id = this.elements.presetSelect.value;
    if (id === 'custom') return;
    const cm = this.game.challengeManager;
    const builtin = CHALLENGE_PRESETS[id];
    if (builtin?.secret && id === 'everclear_pain' && cm.presetId !== id) {
      this._pendingPresetId = id;
      this._showEverclearConfirm();
      this.elements.presetSelect.value = cm.presetId;
      return;
    }
    if (builtin) {
      cm.applyPreset(id, this.game.phase);
      return;
    }
    const custom = this._getCustomPresets().find((p) => p.id === id);
    if (custom) {
      cm.applyCustomPreset(custom.modifiers, custom.id, this.game.phase);
    }
  }

  _showEverclearConfirm() {
    const modal = this.elements.confirmModal;
    this.elements.confirmTitle.textContent = EVERCLEAR_CONFIRM.title;
    this.elements.confirmBody.textContent = EVERCLEAR_CONFIRM.body;
    this.elements.confirmEnter.textContent = EVERCLEAR_CONFIRM.confirmLabel;
    this.elements.confirmCancel.textContent = EVERCLEAR_CONFIRM.cancelLabel;
    modal.classList.remove('hidden');
  }

  _confirmPendingPreset() {
    const id = this._pendingPresetId;
    this._pendingPresetId = null;
    this.elements.confirmModal.classList.add('hidden');
    if (!id) return;
    this.game.challengeManager.applyPreset(id, this.game.phase);
    this.elements.presetSelect.value = id;
    this.render();
  }

  _cancelPendingPreset() {
    this._pendingPresetId = null;
    this.elements.confirmModal.classList.add('hidden');
    this.elements.presetSelect.value = this.game.challengeManager.presetId;
  }

  _saveCustomPreset() {
    if (!this._canEdit()) return;
    const name = prompt('Name your custom preset:', 'My Challenge');
    if (!name?.trim()) return;

    const modifiers = [...this.game.challengeManager.active];
    const presets = [...this._getCustomPresets()];
    const id = `custom_${Date.now()}`;
    presets.push({ id, name: name.trim(), modifiers });
    this.game.prestigeManager.setCustomChallengePresets(presets);
    this.game.challengeManager.applyCustomPreset(modifiers, id, this.game.phase);
    this.game.saveGame();
    this.render();
  }

  _deleteCustomPreset() {
    if (!this._canEdit()) return;
    const id = this.game.challengeManager.presetId;
    if (!id.startsWith('custom_')) return;
    const presets = this._getCustomPresets().filter((p) => p.id !== id);
    this.game.prestigeManager.setCustomChallengePresets(presets);
    this.game.challengeManager.applyPreset('normal', this.game.phase);
    this.game.saveGame();
    this.render();
  }

  _clearModifiers() {
    if (!this._canEdit()) return;
    this.game.challengeManager.applyPreset('normal', this.game.phase);
  }
}
