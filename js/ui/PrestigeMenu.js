import { Phase } from '../core/Game.js';
import { Events } from '../core/EventBus.js';
import { PRESTIGE_CONFIG } from '../config/prestigeConfig.js';
import {
  PRESTIGE_TAB_ORDER,
  PRESTIGE_TAB_LABELS,
  ASCENSION_PERKS,
  PRESTIGE_MILESTONES,
  LEGACY_ARTIFACTS,
  ARTIFACT_SLOT_UNLOCKS,
  PRESTIGE_SHOP_ITEMS,
  WORLD_LEGACY_STAGES,
  WORLD_EVENTS,
  PRESTIGE_RESET_LIST,
} from '../config/prestigeMenuConfig.js';
import {
  PRESTIGE_BRANCHES,
  PRESTIGE_BRANCH_ORDER,
  PRESTIGE_TREE_NODES,
} from '../config/prestigeTreeConfig.js?v=20260710c';
import { BUILD_VERSION } from '../config/gameConfig.js?v=20260710c';
import { WORLD_TIERS } from '../config/worldTierConfig.js';

/**
 * Full-screen Prestige hub — separate from gameplay sidebars.
 * Pauses the game while open and preserves the active tab between visits.
 */
export class PrestigeMenu {
  constructor(game) {
    this.game = game;
    this.activeTab = 'overview';
    this.isOpen = false;
    this._pendingPerk = null;
    this._buildDOM();
    this._bindEvents();
    this._subscribe();
  }

  _buildDOM() {
    const overlay = document.createElement('div');
    overlay.id = 'prestige-menu-overlay';
    overlay.className = 'prestige-menu-overlay hidden';
    overlay.innerHTML = `
      <div class="prestige-menu" role="dialog" aria-modal="true" aria-labelledby="prestige-menu-title">
        <header class="prestige-menu-header">
          <div class="prestige-menu-title-wrap">
            <h2 id="prestige-menu-title">✿ Prestige</h2>
            <span class="prestige-menu-subtitle">Long-term progression hub</span>
          </div>
          <button type="button" id="prestige-menu-close" class="prestige-menu-close" aria-label="Close Prestige menu">✕</button>
        </header>
        <nav id="prestige-menu-tabs" class="prestige-menu-tabs" role="tablist"></nav>
        <div id="prestige-menu-body" class="prestige-menu-body"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const confirm = document.createElement('div');
    confirm.id = 'prestige-confirm-overlay';
    confirm.className = 'prestige-confirm-overlay hidden';
    confirm.innerHTML = `
      <div class="prestige-confirm-card">
        <h3>Confirm Prestige</h3>
        <p class="prestige-confirm-warning">This will reset your current run. Permanent progress is kept.</p>
        <div class="prestige-confirm-grid">
          <div class="prestige-confirm-col">
            <h4>Will Reset</h4>
            <ul id="prestige-reset-list"></ul>
          </div>
          <div class="prestige-confirm-col remain">
            <h4>Will Remain</h4>
            <ul id="prestige-remain-list"></ul>
          </div>
        </div>
        <div id="prestige-confirm-reward" class="prestige-confirm-reward"></div>
        <div class="prestige-confirm-actions">
          <button type="button" id="prestige-confirm-yes" class="prestige-confirm-btn primary">Prestige Now</button>
          <button type="button" id="prestige-confirm-no" class="prestige-confirm-btn secondary">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(confirm);

    const perkConfirm = document.createElement('div');
    perkConfirm.id = 'perk-confirm-overlay';
    perkConfirm.className = 'prestige-confirm-overlay hidden';
    perkConfirm.innerHTML = `
      <div class="prestige-confirm-card perk-confirm-card">
        <h3>Confirm Ascension Perk</h3>
        <p id="perk-confirm-text" class="perk-confirm-text"></p>
        <p class="hint-text">This choice is permanent and cannot be changed.</p>
        <div class="prestige-confirm-actions">
          <button type="button" id="perk-confirm-yes" class="prestige-confirm-btn primary">Confirm</button>
          <button type="button" id="perk-confirm-no" class="prestige-confirm-btn secondary">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(perkConfirm);

    this.overlay = overlay;
    this.tabsEl = overlay.querySelector('#prestige-menu-tabs');
    this.bodyEl = overlay.querySelector('#prestige-menu-body');
    this.confirmOverlay = confirm;
    this.perkConfirmOverlay = perkConfirm;
  }

  _bindEvents() {
    this.overlay.querySelector('#prestige-menu-close').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    this.tabsEl.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-prestige-tab]');
      if (!tab) return;
      this.activeTab = tab.dataset.prestigeTab;
      this.render();
    });

    this.bodyEl.addEventListener('click', (e) => this._handleBodyClick(e));

    this.confirmOverlay.querySelector('#prestige-confirm-no').addEventListener('click', () => {
      this.confirmOverlay.classList.add('hidden');
    });
    this.confirmOverlay.querySelector('#prestige-confirm-yes').addEventListener('click', () => {
      this.confirmOverlay.classList.add('hidden');
      if (this.game.prestige()) {
        this.close();
        this.game.eventBus.emit(Events.SAVE_LOADED);
      }
    });

    this.perkConfirmOverlay.querySelector('#perk-confirm-no').addEventListener('click', () => {
      this._pendingPerk = null;
      this.perkConfirmOverlay.classList.add('hidden');
    });
    this.perkConfirmOverlay.querySelector('#perk-confirm-yes').addEventListener('click', () => {
      if (this._pendingPerk) {
        this.game.prestigeManager.selectPerk(this._pendingPerk);
        this._saveMeta();
        this._pendingPerk = null;
        this.perkConfirmOverlay.classList.add('hidden');
        this.render();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        if (!this.confirmOverlay.classList.contains('hidden')) {
          this.confirmOverlay.classList.add('hidden');
        } else if (!this.perkConfirmOverlay.classList.contains('hidden')) {
          this._pendingPerk = null;
          this.perkConfirmOverlay.classList.add('hidden');
        } else {
          this.close();
        }
      }
    });
  }

  _subscribe() {
    this.game.eventBus.on(Events.PRESTIGE_CHANGED, () => {
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
    this.confirmOverlay.classList.add('hidden');
    this.perkConfirmOverlay.classList.add('hidden');
    this.game.setMenuPaused(false);
  }

  _saveMeta() {
    this.game.saveManager.saveMeta(this.game);
  }

  _handleBodyClick(e) {
    const btn = e.target.closest('[data-prestige-action]');
    if (!btn) return;
    const action = btn.dataset.prestigeAction;
    const id = btn.dataset.id;
    const pm = this.game.prestigeManager;

    switch (action) {
      case 'prestige-open-confirm':
        this._openPrestigeConfirm();
        break;
      case 'buy-tree':
        if (pm.purchaseTreeNode(id)) {
          this._saveMeta();
          this.game._refreshSupportEffects();
          this.game._applyPrestigeToTowers();
          this.game._applyResearchToAllStructures();
          this.render();
        }
        break;
      case 'claim-milestone':
        if (pm.claimMilestone(id)) { this._saveMeta(); this.render(); }
        break;
      case 'buy-artifact':
        if (pm.purchaseArtifact(id)) { this._saveMeta(); this.render(); }
        break;
      case 'equip-artifact':
        if (pm.equipArtifact(id, Number(btn.dataset.slot))) { this._saveMeta(); this.render(); }
        break;
      case 'unequip-artifact':
        if (pm.unequipArtifact(Number(btn.dataset.slot))) { this._saveMeta(); this.render(); }
        break;
      case 'buy-shop':
        if (pm.purchaseShopItem(id)) { this._saveMeta(); this.render(); }
        break;
      case 'set-theme':
        if (pm.setActiveTheme(id)) { this._saveMeta(); this.render(); }
        break;
      case 'upgrade-legacy':
        if (pm.upgradeWorldLegacy(id)) { this._saveMeta(); this.render(); }
        break;
      case 'activate-event':
        if (pm.activateWorldEvent(id)) { this._saveMeta(); this.render(); }
        break;
      case 'select-perk':
        this._openPerkConfirm(id);
        break;
      case 'reset-save':
        if (confirm('Reset ALL save data? This cannot be undone.')) {
          this.close();
          this.game.clearAllSaveData();
        }
        break;
      default:
        break;
    }
  }

  _openPerkConfirm(perkId) {
    const perk = ASCENSION_PERKS[perkId];
    if (!perk) return;
    this._pendingPerk = perkId;
    this.perkConfirmOverlay.querySelector('#perk-confirm-text').textContent =
      `${perk.name}: ${perk.description}`;
    this.perkConfirmOverlay.classList.remove('hidden');
  }

  _openPrestigeConfirm() {
    const wave = this.game.waveManager.waveNumber;
    const est = this.game.prestigeManager.estimatePrestigeReward(
      wave,
      this.game.economy.crystals
    );
    this.confirmOverlay.querySelector('#prestige-reset-list').innerHTML =
      PRESTIGE_RESET_LIST.willReset.map((t) => `<li>${t}</li>`).join('');
    this.confirmOverlay.querySelector('#prestige-remain-list').innerHTML =
      PRESTIGE_RESET_LIST.willRemain.map((t) => `<li>${t}</li>`).join('');
    this.confirmOverlay.querySelector('#prestige-confirm-reward').innerHTML =
      `<strong>You will earn ${est.total} Prestige Tokens (✿)</strong>` +
      (est.crystalBonus > 0 ? `<br><span class="hint-text">Includes +${est.crystalBonus} from crystals</span>` : '');
    this.confirmOverlay.classList.remove('hidden');
  }

  render() {
    this._renderTabs();
    switch (this.activeTab) {
      case 'overview': this._renderOverview(); break;
      case 'tree': this._renderTree(); break;
      case 'perks': this._renderPerks(); break;
      case 'milestones': this._renderMilestones(); break;
      case 'artifacts': this._renderArtifacts(); break;
      case 'shop': this._renderShop(); break;
      case 'world_legacy': this._renderWorldLegacy(); break;
      case 'legacy_hall': this._renderLegacyHall(); break;
      case 'world_events': this._renderWorldEvents(); break;
      default: this._renderOverview();
    }
  }

  _renderTabs() {
    this.tabsEl.innerHTML = '';
    for (const tabId of PRESTIGE_TAB_ORDER) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'prestige-menu-tab';
      btn.dataset.prestigeTab = tabId;
      btn.setAttribute('role', 'tab');
      btn.textContent = PRESTIGE_TAB_LABELS[tabId];
      btn.classList.toggle('active', tabId === this.activeTab);
      this.tabsEl.appendChild(btn);
    }
  }

  _renderOverview() {
    const pm = this.game.prestigeManager;
    const wave = this.game.waveManager.waveNumber;
    const canPrestige = this.game.phase !== Phase.WAVE && (
      this.game.canPrestige() ||
      (this.game.phase === Phase.GAME_OVER && wave >= PRESTIGE_CONFIG.unlockWave)
    );
    const est = pm.estimatePrestigeReward(wave, this.game.economy.crystals);
    const rewardMult = this.game.getChallengeRewardMult?.() ?? 1;
    const tier = this.game.getWorldTier();
    const nextTier = pm.getNextWorldTier();
    const nextTierNote = nextTier
      ? `<p class="hint-text">Next tier at Prestige ${nextTier.minPrestiges}: <strong>Tier ${nextTier.roman} — ${nextTier.name}</strong></p>`
      : '<p class="hint-text">Maximum World Threat reached — Cataclysm tier.</p>';

    this.bodyEl.innerHTML = `
      <div class="prestige-overview">
        <div class="world-tier-banner tier-${tier.tier}">
          <div class="world-tier-head">
            <span class="world-tier-roman">Tier ${tier.roman}</span>
            <div>
              <h3 class="world-tier-name">${tier.name}</h3>
              <p class="world-tier-subtitle">${tier.subtitle}</p>
            </div>
          </div>
          <p class="world-tier-reward">Reward bonus: <strong>+${Math.round(tier.rewardBonus * 100)}%</strong> on all run rewards</p>
          <ul class="world-tier-features">${tier.features.map((f) => `<li>${f}</li>`).join('')}</ul>
          ${nextTierNote}
        </div>
        <div class="prestige-stat-grid">
          <div class="prestige-stat-card"><span class="label">Prestige Level</span><span class="value">${pm.prestigeLevel}</span></div>
          <div class="prestige-stat-card"><span class="label">World Threat</span><span class="value">Tier ${tier.roman}</span></div>
          <div class="prestige-stat-card"><span class="label">Prestige Tokens</span><span class="value gold-text">✿ ${pm.shards}</span></div>
          <div class="prestige-stat-card"><span class="label">Est. on Prestige</span><span class="value">+${est.total} ✿</span></div>
          <div class="prestige-stat-card"><span class="label">Highest Wave (Run)</span><span class="value">W${wave}</span></div>
          <div class="prestige-stat-card"><span class="label">Best Wave (All Time)</span><span class="value">W${pm.bestWave}</span></div>
          <div class="prestige-stat-card"><span class="label">Reward Multiplier</span><span class="value">${rewardMult.toFixed(2)}×</span></div>
          <div class="prestige-stat-card"><span class="label">Client Build</span><span class="value">${BUILD_VERSION}</span></div>
        </div>
        <div class="prestige-overview-panels">
          <div class="prestige-info-panel">
            <h3>World Tier Progression</h3>
            <p>Every Prestige raises the World's Threat Level. Higher tiers bring deadlier enemies, new mechanics, and bigger rewards.</p>
            <div class="world-tier-ladder">${WORLD_TIERS.map((t) => `
              <div class="world-tier-step ${t.tier === tier.tier ? 'current' : ''} ${pm.prestigeLevel >= t.minPrestiges ? 'unlocked' : 'locked'}">
                <span class="step-roman">${t.roman}</span>
                <span class="step-name">${t.name}</span>
                <span class="step-req">P${t.minPrestiges}+</span>
                <span class="step-bonus">+${Math.round(t.rewardBonus * 100)}%</span>
              </div>`).join('')}</div>
          </div>
          <div class="prestige-info-panel">
            <h3>What happens when you Prestige?</h3>
            <p>Prestige resets your <strong>current run</strong> but keeps all permanent upgrades, artifacts, and lifetime progress. The world grows more dangerous — and more rewarding — with each ascension.</p>
            <p class="hint-text">Prestige unlocks at Wave ${PRESTIGE_CONFIG.unlockWave}+.</p>
          </div>
        </div>
        <div class="prestige-overview-actions">
          <button type="button" class="prestige-action-btn primary" data-prestige-action="prestige-open-confirm"
            ${canPrestige ? '' : 'disabled'}>
            ${canPrestige ? `Prestige Now (+${est.total} ✿)` : `Reach Wave ${PRESTIGE_CONFIG.unlockWave} to Prestige`}
          </button>
          <button type="button" class="prestige-action-btn danger" data-prestige-action="reset-save">Reset All Save Data</button>
        </div>
      </div>
    `;
  }

  _renderTree() {
    const pm = this.game.prestigeManager;
    const v2Count = Object.values(PRESTIGE_TREE_NODES).filter((n) => n.row >= 3 || n.branch === 'world').length;
    let html = `
      <p class="prestige-tree-intro">
        <strong>Tier II expansion active</strong> — ${v2Count} late-game nodes.
        Scroll right for the <strong>World</strong> branch and Tier II upgrades past each capstone.
        <span class="build-tag">Build ${BUILD_VERSION}</span>
      </p>
      <div class="prestige-tree-scroll"><div class="prestige-tree-grid">`;

    for (const branchId of PRESTIGE_BRANCH_ORDER) {
      const branch = PRESTIGE_BRANCHES[branchId];
      const nodes = Object.values(PRESTIGE_TREE_NODES).filter((n) => n.branch === branchId);
      const branchClass = branchId === 'world' ? 'prestige-tree-branch branch-world' : 'prestige-tree-branch';
      html += `<div class="${branchClass}" data-branch="${branchId}">
        <h3 class="prestige-branch-title">${branch.icon} ${branch.name}${branchId === 'world' ? ' <span class="branch-new-tag">NEW</span>' : ''}</h3>
        <div class="prestige-branch-nodes">`;

      let tierRowsMarked = new Set();
      for (const node of nodes.sort((a, b) => a.row - b.row || a.col - b.col)) {
        if (node.row >= 3 && !tierRowsMarked.has(node.row)) {
          html += `<div class="prestige-tier-divider">Tier II</div>`;
          tierRowsMarked.add(node.row);
        }
        const rank = pm.getTreeRank(node.id);
        const state = pm.getNodeState(node.id);
        const canBuy = pm.canPurchaseTreeNode(node.id);
        html += `
          <div class="prestige-tree-node state-${state}" style="--row:${node.row};--col:${node.col}">
            <div class="node-header">
              <span class="node-name">${node.name}</span>
              <span class="node-rank">${rank}/${node.maxRank}</span>
            </div>
            <p class="node-desc">${node.description}</p>
            ${node.prerequisites.length ? `<p class="node-prereq">Requires: ${node.prerequisites.map((p) => PRESTIGE_TREE_NODES[p]?.name || p).join(', ')}</p>` : ''}
            ${node.requiresMaxed?.length ? `<p class="node-prereq">Requires maxed: ${node.requiresMaxed.map((p) => PRESTIGE_TREE_NODES[p]?.name || p).join(', ')}</p>` : ''}
            ${node.unlockPrestigeLevel ? `<p class="node-prereq">Unlocks at Prestige Level ${node.unlockPrestigeLevel}</p>` : ''}
            ${state !== 'maxed' && state !== 'locked'
              ? `<button type="button" class="node-buy-btn" data-prestige-action="buy-tree" data-id="${node.id}"
                  ${canBuy ? '' : 'disabled'}>${node.cost} ✿</button>`
              : `<span class="node-status">${state === 'maxed' ? 'MAX' : 'LOCKED'}</span>`}
          </div>`;
      }
      html += '</div></div>';
    }
    html += '</div></div>';
    html += `<p class="hint-text prestige-tree-hint">Scroll horizontally to browse all ${PRESTIGE_BRANCH_ORDER.length} branches. Tokens: ✿ ${pm.shards}</p>`;
    this.bodyEl.innerHTML = html;
  }

  _renderPerks() {
    const pm = this.game.prestigeManager;
    let html = '<div class="prestige-perks-grid">';
    for (const perk of Object.values(ASCENSION_PERKS)) {
      const owned = pm.hasPerk(perk.id);
      const unlocked = pm.prestigeLevel >= perk.unlockPrestigeLevel;
      html += `
        <div class="prestige-perk-card ${owned ? 'owned' : unlocked ? 'available' : 'locked'}">
          <h4>${perk.name}</h4>
          <p>${perk.description}</p>
          <span class="perk-level-req">Prestige Level ${perk.unlockPrestigeLevel}</span>
          ${owned
            ? '<span class="perk-owned-badge">Owned</span>'
            : unlocked
              ? `<button type="button" class="prestige-action-btn" data-prestige-action="select-perk" data-id="${perk.id}">Choose Perk</button>`
              : '<span class="perk-locked-badge">Locked</span>'}
        </div>`;
    }
    html += '</div>';
    this.bodyEl.innerHTML = html;
  }

  _renderMilestones() {
    const pm = this.game.prestigeManager;
    let html = '<div class="prestige-milestones-list">';
    for (const ms of PRESTIGE_MILESTONES) {
      const claimed = pm.data.milestones.claimed.includes(ms.id);
      const prog = pm.getMilestoneProgress(ms);
      const complete = pm.isMilestoneComplete(ms);
      const pct = Math.min(100, Math.round((prog.current / prog.target) * 100));
      html += `
        <div class="prestige-milestone-row ${claimed ? 'claimed' : complete ? 'complete' : ''}">
          <div class="milestone-info">
            <h4>${ms.name}</h4>
            <p>${ms.reward} ${ms.tokens ? `(+${ms.tokens} ✿)` : ''}</p>
            <div class="milestone-bar"><div class="milestone-fill" style="width:${pct}%"></div></div>
            <span class="milestone-prog">${prog.current} / ${prog.target}</span>
          </div>
          ${claimed
            ? '<span class="milestone-claimed">Claimed</span>'
            : complete
              ? `<button type="button" class="prestige-action-btn" data-prestige-action="claim-milestone" data-id="${ms.id}">Claim</button>`
              : '<span class="milestone-locked">In progress</span>'}
        </div>`;
    }
    html += '</div>';
    this.bodyEl.innerHTML = html;
  }

  _renderArtifacts() {
    const pm = this.game.prestigeManager;
    const slots = ARTIFACT_SLOT_UNLOCKS;
    let html = '<div class="prestige-artifacts-layout">';

    html += '<div class="artifact-slots"><h3>Equipped Artifacts</h3><div class="artifact-slot-grid">';
    for (const slotDef of slots) {
      const unlocked = pm.getUnlockedArtifactSlots().includes(slotDef.slot);
      const equipped = pm.data.artifacts.equipped[slotDef.slot];
      const art = equipped ? LEGACY_ARTIFACTS[equipped] : null;
      html += `
        <div class="artifact-slot ${unlocked ? '' : 'locked-slot'}">
          <span class="slot-label">Slot ${slotDef.slot + 1}</span>
          ${unlocked
            ? art
              ? `<strong>${art.name}</strong><p>${art.description}</p>
                 <button type="button" class="prestige-action-btn secondary" data-prestige-action="unequip-artifact" data-slot="${slotDef.slot}">Unequip</button>`
              : '<em>Empty</em>'
            : `<em>${slotDef.label}</em>`}
        </div>`;
    }
    html += '</div></div>';

    html += '<div class="artifact-catalog"><h3>Artifact Collection</h3><div class="artifact-list">';
    for (const art of Object.values(LEGACY_ARTIFACTS)) {
      const owned = pm.data.artifacts.owned.includes(art.id);
      const ms = PRESTIGE_MILESTONES.find((m) => m.id === art.unlockMilestone);
      const msOk = !ms || pm.data.milestones.claimed.includes(art.unlockMilestone) || pm.isMilestoneComplete(ms);
      html += `
        <div class="artifact-card ${owned ? 'owned' : ''}">
          <h4>${art.name}</h4>
          <p>${art.description}</p>
          <span class="artifact-cost">${art.cost} ✿</span>
          ${owned
            ? `<div class="artifact-equip-btns">${slots.filter((s) => pm.getUnlockedArtifactSlots().includes(s.slot)).map((s) =>
              `<button type="button" class="prestige-action-btn small" data-prestige-action="equip-artifact" data-id="${art.id}" data-slot="${s.slot}">Slot ${s.slot + 1}</button>`
            ).join('')}</div>`
            : msOk
              ? `<button type="button" class="prestige-action-btn" data-prestige-action="buy-artifact" data-id="${art.id}"
                  ${pm.canPurchaseArtifact(art.id) ? '' : 'disabled'}>Purchase</button>`
              : `<span class="artifact-locked">Complete milestone: ${ms?.name || art.unlockMilestone}</span>`}
        </div>`;
    }
    html += '</div></div></div>';
    this.bodyEl.innerHTML = html;
  }

  _renderShop() {
    const pm = this.game.prestigeManager;
    const categories = ['unlock', 'cosmetic', 'music', 'map'];
    const labels = { unlock: 'Unlocks', cosmetic: 'HUD Themes', music: 'Music', map: 'Map Themes' };
    let html = '';
    for (const cat of categories) {
      const items = Object.values(PRESTIGE_SHOP_ITEMS).filter((i) => i.category === cat);
      if (!items.length) continue;
      html += `<h3 class="shop-category-title">${labels[cat]}</h3><div class="prestige-shop-grid">`;
      for (const item of items) {
        const owned = pm.hasShopUnlock(item.id);
        const isActiveTheme = pm.data.shop.activeTheme === item.id;
        html += `
          <div class="shop-item-card ${owned ? 'owned' : ''}">
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            ${owned
              ? cat === 'cosmetic'
                ? `<button type="button" class="prestige-action-btn ${isActiveTheme ? 'active' : ''}" data-prestige-action="set-theme" data-id="${item.id}">${isActiveTheme ? 'Active' : 'Apply Theme'}</button>`
                : '<span class="shop-owned">Owned</span>'
              : `<button type="button" class="prestige-action-btn" data-prestige-action="buy-shop" data-id="${item.id}"
                  ${pm.canPurchaseShopItem(item.id) ? '' : 'disabled'}>${item.cost} ✿</button>`}
          </div>`;
      }
      html += '</div>';
    }
    this.bodyEl.innerHTML = html;
  }

  _renderWorldLegacy() {
    const pm = this.game.prestigeManager;
    const totalRank = Object.values(pm.data.worldLegacy.ranks).reduce((a, b) => a + b, 0);
    let html = `
      <div class="world-legacy-header">
        <p>Restore the meadow village, castle, and monuments. Each restoration grants +2% global farm income and tower damage per rank.</p>
        <span class="legacy-total">Total restoration rank: ${totalRank}</span>
      </div>
      <div class="world-legacy-grid">`;
    for (const stage of WORLD_LEGACY_STAGES) {
      const rank = pm.data.worldLegacy.ranks[stage.id] || 0;
      html += `
        <div class="legacy-stage-card">
          <h4>${stage.name}</h4>
          <p>${stage.description}</p>
          <span class="legacy-rank">${rank}/${stage.maxRank}</span>
          ${rank < stage.maxRank
            ? `<button type="button" class="prestige-action-btn" data-prestige-action="upgrade-legacy" data-id="${stage.id}"
                ${pm.canUpgradeWorldLegacy(stage.id) ? '' : 'disabled'}>${stage.cost} ✿</button>`
            : '<span class="legacy-maxed">Fully Restored</span>'}
        </div>`;
    }
    html += '</div>';
    this.bodyEl.innerHTML = html;
  }

  _renderLegacyHall() {
    const pm = this.game.prestigeManager;
    const lt = pm.data.lifetime;
    const stats = [
      ['Prestiges Completed', lt.prestigesCompleted],
      ['Waves Cleared', lt.wavesCleared],
      ['Gold Earned (Lifetime)', lt.goldEarned.toLocaleString()],
      ['Enemies Defeated', lt.enemiesKilled.toLocaleString()],
      ['Bosses Slain', lt.bossesDefeated],
      ['Towers Built', lt.towersBuilt],
      ['Farms Planted', lt.farmsBuilt],
      ['Crystals Mined', lt.crystalsEarned],
      ['Research Generated', lt.researchEarned],
      ['Best Wave', `W${pm.bestWave}`],
      ['Prestige Level', pm.prestigeLevel],
      ['Artifacts Owned', pm.data.artifacts.owned.length],
      ['Shop Unlocks', pm.data.shop.purchased.length],
      ['Tree Nodes Purchased', Object.values(pm.data.tree).reduce((a, b) => a + b, 0)],
      ['Ascension Perks', pm.data.perks.length],
      ['Milestones Claimed', pm.data.milestones.claimed.length],
    ];
    this.bodyEl.innerHTML = `
      <div class="legacy-hall-scroll">
        <h3>Lifetime Records</h3>
        <div class="legacy-hall-grid">
          ${stats.map(([label, val]) => `<div class="legacy-stat"><span>${label}</span><strong>${val}</strong></div>`).join('')}
        </div>
        <h3>Accomplishments</h3>
        <ul class="legacy-accomplishments">
          ${pm.bestWave >= 50 ? '<li>✓ Reached Wave 50</li>' : '<li>○ Reach Wave 50</li>'}
          ${pm.totalPrestiges >= 1 ? '<li>✓ First Prestige</li>' : '<li>○ Complete your first Prestige</li>'}
          ${pm.totalPrestiges >= 5 ? '<li>✓ Veteran Commander (5 Prestiges)</li>' : '<li>○ Veteran Commander (5 Prestiges)</li>'}
          ${pm.bestWave >= 100 ? '<li>✓ Century Guard (Wave 100)</li>' : '<li>○ Century Guard (Wave 100)</li>'}
          ${pm.data.perks.length >= 3 ? '<li>✓ Ascension Path (3 Perks)</li>' : '<li>○ Ascension Path (3 Perks)</li>'}
        </ul>
      </div>`;
  }

  _renderWorldEvents() {
    const pm = this.game.prestigeManager;
    const active = pm.data.worldEvents.active;
    const wavesLeft = pm.data.worldEvents.wavesLeft;
    let html = '';
    if (active) {
      const ev = WORLD_EVENTS[active];
      html += `<div class="world-event-active-banner">
        <strong>Active: ${ev.name}</strong> — ${wavesLeft} wave(s) remaining
        <p>${ev.description}</p>
      </div>`;
    }
    html += '<div class="world-events-grid">';
    for (const ev of Object.values(WORLD_EVENTS)) {
      const unlocked = pm.data.worldEvents.unlocked.includes(ev.id);
      html += `
        <div class="world-event-card ${unlocked ? '' : 'locked'}">
          <h4>${ev.name}</h4>
          <p>${ev.description}</p>
          <div class="event-meta">
            <span>Duration: ${ev.durationWaves} waves</span>
            <span>Cost: ${ev.activationCost} ✿</span>
          </div>
          ${unlocked
            ? `<button type="button" class="prestige-action-btn" data-prestige-action="activate-event" data-id="${ev.id}"
                ${pm.canActivateWorldEvent(ev.id) ? '' : 'disabled'}>${active ? 'Event Active' : 'Activate'}</button>`
            : `<span class="event-locked">Unlock: W${ev.unlockRequirement.bestWave || 0}+ / ${ev.unlockRequirement.totalPrestiges || 0} prestiges</span>`}
        </div>`;
    }
    html += '</div>';
    this.bodyEl.innerHTML = html;
  }
}
