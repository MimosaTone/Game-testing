import { Phase } from '../core/Game.js';
import {
  GLOBAL_UPGRADES,
  ENDLESS_INVESTMENTS,
  COMMANDER_ABILITIES,
  HQ_UPGRADES,
  ECONOMIC_INVESTMENTS,
  WORLD_WONDERS,
  BUILD_EXPANSION,
  INVESTMENT_CATEGORY_ORDER,
} from '../config/investmentConfig.js';

const CATEGORY_LABELS = {
  commander: 'Commander',
  global: 'Global',
  endless: 'Endless',
  hq: 'Headquarters',
  economy: 'Economy',
  wonder: 'World Wonder',
  expansion: 'Expansion',
};

/**
 * Gold sink investment shop — global upgrades, commander buffs, wonders, etc.
 */
export class InvestmentPanel {
  constructor(game) {
    this.game = game;
    this.category = 'commander';
    this.tabsEl = document.getElementById('investment-tabs');
    this.listEl = document.getElementById('investment-list');
    this.hintEl = document.getElementById('investment-hint');

    this.tabsEl.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-invest-cat]');
      if (!tab) return;
      this.category = tab.dataset.investCat;
      this.render();
    });

    this.listEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-invest-buy]');
      if (!btn || this.game.phase !== Phase.PLANNING) return;
      if (btn.disabled) return;
      this._purchase(btn.dataset.investBuy, btn.dataset.investId);
    });

    this.render();
  }

  render() {
    this._renderTabs();
    const canBuy = this.game.phase === Phase.PLANNING;
    this.hintEl.textContent = canBuy
      ? 'Invest gold for run-wide power — choose strength now or economy for later.'
      : 'Investments can only be purchased between waves.';

    const im = this.game.investmentManager;
    const items = this._itemsForCategory(this.category);
    this.listEl.innerHTML = '';

    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'investment-row';
      const cost = item.cost;
      const affordable = cost !== null && this.game.economy.canAfford(cost);
      const disabled = !canBuy || cost === null || !affordable || item.locked;

      row.innerHTML = `
        <div class="investment-info">
          <span class="investment-name">${item.name}${item.levelText ? ` ${item.levelText}` : ''}</span>
          <span class="investment-desc">${item.description}</span>
        </div>
      `;

      if (!item.maxed && !item.locked) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'investment-buy-btn';
        btn.dataset.investBuy = this.category;
        btn.dataset.investId = item.id;
        btn.textContent = cost !== null ? `${cost}g` : 'MAX';
        btn.disabled = disabled;
        row.appendChild(btn);
      } else if (item.maxed) {
        const max = document.createElement('span');
        max.className = 'investment-maxed';
        max.textContent = 'MAX';
        row.appendChild(max);
      } else if (item.locked) {
        const lock = document.createElement('span');
        lock.className = 'investment-locked';
        lock.textContent = item.lockText || 'Locked';
        row.appendChild(lock);
      }

      this.listEl.appendChild(row);
    }
  }

  _renderTabs() {
    this.tabsEl.innerHTML = '';
    for (const cat of INVESTMENT_CATEGORY_ORDER) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'investment-tab';
      btn.dataset.investCat = cat;
      btn.textContent = CATEGORY_LABELS[cat] || cat;
      btn.classList.toggle('active', cat === this.category);
      this.tabsEl.appendChild(btn);
    }
  }

  _itemsForCategory(cat) {
    const im = this.game.investmentManager;
    const wave = this.game.waveManager.waveNumber;

    switch (cat) {
      case 'commander':
        if (im.commanderBuff) {
          return [{
            id: 'active',
            name: 'Active: ' + (COMMANDER_ABILITIES[im.commanderBuff]?.name || im.commanderBuff),
            description: 'Buff applies to the next wave you start.',
            cost: null,
            maxed: true,
          }];
        }
        return Object.values(COMMANDER_ABILITIES).map((def) => ({
          id: def.id,
          name: def.name,
          description: def.description,
          cost: def.cost > 0 ? def.cost : def.instantGold ? 0 : def.cost,
        }));

      case 'global':
        return Object.values(GLOBAL_UPGRADES).map((def) => {
          const level = im.global[def.id] || 0;
          return {
            id: def.id,
            name: def.name,
            description: def.description,
            cost: im.getGlobalUpgradeCost(def.id),
            levelText: `(${level}/${def.maxLevel})`,
            maxed: level >= def.maxLevel,
          };
        });

      case 'endless':
        return Object.values(ENDLESS_INVESTMENTS).map((def) => {
          const level = im.endless[def.id] || 0;
          return {
            id: def.id,
            name: def.name,
            description: def.description,
            cost: im.getEndlessCost(def.id),
            levelText: `(Lv ${level})`,
          };
        });

      case 'hq':
        return Object.values(HQ_UPGRADES).map((def) => {
          const level = im.hq[def.id] || 0;
          return {
            id: def.id,
            name: def.name,
            description: def.description,
            cost: im.getHqCost(def.id),
            levelText: `(${level}/${def.maxLevel})`,
            maxed: level >= def.maxLevel,
          };
        });

      case 'economy':
        return Object.values(ECONOMIC_INVESTMENTS).map((def) => {
          const level = im.economic[def.id] || 0;
          return {
            id: def.id,
            name: def.name,
            description: def.description,
            cost: im.getEconomicCost(def.id),
            levelText: `(${level}/${def.maxLevel})`,
            maxed: level >= def.maxLevel,
          };
        });

      case 'wonder':
        if (im.wonder) {
          const w = WORLD_WONDERS[im.wonder];
          return [{
            id: im.wonder,
            name: w?.name || im.wonder,
            description: w?.description || 'Wonder built.',
            cost: null,
            maxed: true,
          }];
        }
        return Object.values(WORLD_WONDERS).map((def) => ({
          id: def.id,
          name: def.name,
          description: def.description + ` (Wave ${def.unlockWave}+)`,
          cost: def.cost,
          locked: wave < def.unlockWave,
          lockText: `Wave ${def.unlockWave}`,
        }));

      case 'expansion': {
        const cost = im.getExpansionCost();
        const remaining = BUILD_EXPANSION.maxPurchases - im.buildExpansions;
        return [{
          id: 'expand',
          name: 'Unlock Build Tile',
          description: `Reveal a new placement spot (${remaining} remaining)`,
          cost,
          maxed: cost === null,
        }];
      }

      default:
        return [];
    }
  }

  _purchase(category, id) {
    const g = this.game;
    const im = g.investmentManager;
    let ok = false;

    switch (category) {
      case 'commander': ok = im.purchaseCommander(g, id); break;
      case 'global': ok = im.purchaseGlobal(g, id); break;
      case 'endless': ok = im.purchaseEndless(g, id); break;
      case 'hq': ok = im.purchaseHq(g, id); break;
      case 'economy': ok = im.purchaseEconomic(g, id); break;
      case 'wonder': ok = im.purchaseWonder(g, id); break;
      case 'expansion': ok = im.purchaseExpansion(g); break;
      default: break;
    }

    if (ok) {
      g.saveGame();
      this.render();
    }
  }
}
