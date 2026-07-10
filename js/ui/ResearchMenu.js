import { Phase } from '../core/Game.js';
import { Events } from '../core/EventBus.js';
import {
  RESEARCH_BRANCHES,
  RESEARCH_BRANCH_ORDER,
  RESEARCH_TAB_LABELS,
  RESEARCH_TREE_NODES,
  ENDLESS_RESEARCH_NODES,
  ENDLESS_UNLOCK_RANKS,
} from '../config/researchTreeConfig.js';

/**
 * Full-screen Research Tree hub — branch specialization for each run.
 */
export class ResearchMenu {
  constructor(game) {
    this.game = game;
    this.activeTab = 'economy';
    this.isOpen = false;
    this._buildDOM();
    this._bindEvents();
    this._subscribe();
  }

  _buildDOM() {
    const overlay = document.createElement('div');
    overlay.id = 'research-menu-overlay';
    overlay.className = 'research-menu-overlay hidden';
    overlay.innerHTML = `
      <div class="research-menu" role="dialog" aria-modal="true">
        <header class="research-menu-header">
          <div>
            <h2 id="research-menu-title">⚗ Research Tree</h2>
            <span class="research-menu-subtitle">Specialize your run — choose your path</span>
          </div>
          <div class="research-menu-rp">
            <span id="research-menu-rp">0 RP</span>
          </div>
          <button type="button" id="research-menu-close" class="research-menu-close" aria-label="Close">✕</button>
        </header>
        <nav id="research-menu-tabs" class="research-menu-tabs" role="tablist"></nav>
        <div id="research-menu-body" class="research-menu-body"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.tabsEl = overlay.querySelector('#research-menu-tabs');
    this.bodyEl = overlay.querySelector('#research-menu-body');
    this.rpEl = overlay.querySelector('#research-menu-rp');
  }

  _bindEvents() {
    this.overlay.querySelector('#research-menu-close').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    this.tabsEl.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-research-tab]');
      if (!tab) return;
      this.activeTab = tab.dataset.researchTab;
      this.render();
    });
    this.bodyEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-research-buy]');
      if (!btn || btn.disabled) return;
      if (this.game.phase !== Phase.PLANNING) return;
      this._purchase(btn.dataset.researchBuy);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }

  _subscribe() {
    this.game.eventBus.on(Events.RESEARCH_CHANGED, () => {
      if (this.isOpen) this.render();
    });
  }

  open(tab = null) {
    if (tab) this.activeTab = tab;
    this.isOpen = true;
    this.overlay.classList.remove('hidden');
    this.game.setMenuPaused(true);
    this.render();
  }

  close() {
    this.isOpen = false;
    this.overlay.classList.add('hidden');
    this.game.setMenuPaused(false);
  }

  _purchase(id) {
    const result = this.game.researchManager.purchase(id, this.game);
    if (!result) return;
    if (result.instantGold > 0) {
      this.game.economy.earn(result.instantGold, { skipMultiplier: true });
    }
    this.game._refreshSupportEffects();
    this.game._applyResearchToAllStructures();
    this.game._applyPrestigeToTowers();
    if (!result.meta) this.game.saveGame();
    this.render();
  }

  render() {
    const rm = this.game.researchManager;
    this.rpEl.textContent = `${rm.points} RP`;
    this._renderTabs();
    if (this.activeTab === 'endless') {
      this._renderEndless();
    } else {
      this._renderBranch(this.activeTab);
    }
  }

  _renderTabs() {
    this.tabsEl.innerHTML = '';
    const rm = this.game.researchManager;
    for (const branchId of RESEARCH_BRANCH_ORDER) {
      if (branchId === 'endless' && !rm.isEndlessUnlocked()) continue;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'research-menu-tab';
      btn.dataset.researchTab = branchId;
      btn.textContent = `${RESEARCH_BRANCHES[branchId]?.icon || ''} ${RESEARCH_TAB_LABELS[branchId]}`;
      btn.classList.toggle('active', branchId === this.activeTab);
      if (branchId === 'endless') btn.classList.add('endless-tab');
      this.tabsEl.appendChild(btn);
    }
  }

  _renderBranch(branchId) {
    const rm = this.game.researchManager;
    const branch = RESEARCH_BRANCHES[branchId];
    const nodes = Object.values(RESEARCH_TREE_NODES)
      .filter((n) => n.branch === branchId)
      .sort((a, b) => a.row - b.row || a.col - b.col);

    const canBuy = this.game.phase === Phase.PLANNING;
    let html = `
      <div class="research-branch-header">
        <h3>${branch.icon} ${branch.name}</h3>
        <p class="hint-text">${this._branchHint(branchId)}</p>
      </div>
      <div class="research-node-grid">
    `;

    for (const node of nodes) {
      const level = rm.getNodeLevel(node.id);
      const state = rm.getNodeState(node.id);
      const cost = rm.getNodeCost(node.id);
      const metaOwned = node.metaPersistent && node.unlockFlag && rm.metaUnlocks[node.unlockFlag];

      html += `
        <div class="research-node-card state-${state}">
          <div class="research-node-head">
            <span class="research-node-name">${node.name}</span>
            <span class="research-node-rank">${metaOwned ? 'UNLOCKED' : `${level}/${node.maxLevel}`}</span>
          </div>
          <p class="research-node-desc">${node.description}</p>
          ${node.prerequisites.length ? `<p class="research-node-prereq">Requires: ${node.prerequisites.map((p) => RESEARCH_TREE_NODES[p]?.name || p).join(', ')}</p>` : ''}
          ${node.metaPersistent ? '<span class="research-meta-badge">Permanent unlock</span>' : ''}
          ${state !== 'maxed' && state !== 'locked'
            ? `<button type="button" class="research-buy-btn" data-research-buy="${node.id}"
                ${!canBuy || state !== 'available' ? 'disabled' : ''}>${cost} RP</button>`
            : `<span class="research-node-status">${state === 'maxed' || metaOwned ? 'MAX' : 'LOCKED'}</span>`}
        </div>`;
    }

    html += '</div>';
    if (branchId !== 'world' && branchId !== 'endless' && !rm.isEndlessUnlocked()) {
      html += `<p class="research-endless-hint">Endless Research unlocks at ${ENDLESS_UNLOCK_RANKS} main-tree ranks or via World → Infinite Inquiry.</p>`;
    }
    this.bodyEl.innerHTML = html;
  }

  _renderEndless() {
    const rm = this.game.researchManager;
    const canBuy = this.game.phase === Phase.PLANNING;
    let html = `
      <div class="research-branch-header">
        <h3>∞ Endless Research</h3>
        <p class="hint-text">Infinite late-game scaling — each level costs more RP.</p>
      </div>
      <div class="research-node-grid">
    `;

    for (const node of Object.values(ENDLESS_RESEARCH_NODES)) {
      const level = rm.getEndlessLevel(node.id);
      const state = rm.getNodeState(node.id);
      const cost = rm.getNodeCost(node.id);
      html += `
        <div class="research-node-card state-${state}">
          <div class="research-node-head">
            <span class="research-node-name">${node.name}</span>
            <span class="research-node-rank">Lv ${level}</span>
          </div>
          <p class="research-node-desc">${node.description}</p>
          <button type="button" class="research-buy-btn" data-research-buy="${node.id}"
            ${!canBuy || state !== 'available' ? 'disabled' : ''}>${cost} RP</button>
        </div>`;
    }
    html += '</div>';
    this.bodyEl.innerHTML = html;
  }

  _branchHint(branchId) {
    const hints = {
      economy: 'Invest in farms, banks, gold generation, and building efficiency.',
      military: 'Boost tower damage, speed, range, and critical strikes.',
      defensive: 'Strengthen structures, armor, and repair capabilities.',
      engineering: 'Reduce costs, expand build space, and boost mastery.',
      elemental: 'Unlock fire, ice, lightning, and poison effects.',
      boss_hunter: 'Specialize in bosses, crystals, and challenge rewards.',
      world: 'Permanent unlocks that persist across all future runs.',
      qol: 'Quality-of-life improvements for faster, smoother play.',
      endless: 'Uncapped scaling for dedicated researchers.',
    };
    return hints[branchId] || '';
  }
}
