import { PRESTIGE_CONFIG, PRESTIGE_UPGRADES } from '../config/prestigeConfig.js';
import { PRESTIGE_TREE_NODES } from '../config/prestigeTreeConfig.js';
import { getWorldTier, getNextWorldTier } from '../config/worldTierConfig.js';
import {
  ASCENSION_PERKS,
  PRESTIGE_MILESTONES,
  LEGACY_ARTIFACTS,
  ARTIFACT_SLOT_UNLOCKS,
  PRESTIGE_SHOP_ITEMS,
  WORLD_LEGACY_STAGES,
  WORLD_EVENTS,
} from '../config/prestigeMenuConfig.js';
import { Events } from './EventBus.js';

const DEFAULT_LIFETIME = {
  wavesCleared: 0,
  goldEarned: 0,
  enemiesKilled: 0,
  bossesDefeated: 0,
  towersBuilt: 0,
  farmsBuilt: 0,
  prestigesCompleted: 0,
  crystalsEarned: 0,
  researchEarned: 0,
};

const DEFAULT_DATA = {
  shards: 0,
  upgrades: {},
  tree: {},
  totalPrestiges: 0,
  bestWave: 0,
  perks: [],
  milestones: { claimed: [] },
  artifacts: { owned: [], equipped: [null, null, null] },
  shop: { purchased: [], activeTheme: null },
  worldLegacy: { ranks: {} },
  lifetime: { ...DEFAULT_LIFETIME },
  worldEvents: { unlocked: [], active: null, wavesLeft: 0 },
};

const DEFAULT_SETTINGS = { autoStartWaves: false };

function mergeEffect(target, source) {
  for (const [key, val] of Object.entries(source)) {
    if (key.includes('Mult') && typeof val === 'number') {
      target[key] = (target[key] ?? 1) * val;
    } else if (typeof val === 'number') {
      target[key] = (target[key] ?? 0) + val;
    } else {
      target[key] = val;
    }
  }
}

/**
 * Manages Prestige Tokens, tree, perks, artifacts, and lifetime meta progression.
 */
export class PrestigeManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.data = structuredClone(DEFAULT_DATA);
    this.settings = { ...DEFAULT_SETTINGS };
  }

  loadFromMeta(meta) {
    if (!meta) return;
    this.data = {
      ...structuredClone(DEFAULT_DATA),
      shards: meta.shards ?? 0,
      upgrades: meta.upgrades ?? {},
      tree: meta.tree ?? {},
      totalPrestiges: meta.totalPrestiges ?? 0,
      bestWave: meta.bestWave ?? 0,
      perks: [...(meta.perks ?? [])],
      milestones: { claimed: [...(meta.milestones?.claimed ?? [])] },
      artifacts: {
        owned: [...(meta.artifacts?.owned ?? [])],
        equipped: [...(meta.artifacts?.equipped ?? [null, null, null])],
      },
      shop: {
        purchased: [...(meta.shop?.purchased ?? [])],
        activeTheme: meta.shop?.activeTheme ?? null,
      },
      worldLegacy: { ranks: { ...(meta.worldLegacy?.ranks ?? {}) } },
      lifetime: { ...DEFAULT_LIFETIME, ...(meta.lifetime ?? {}) },
      worldEvents: {
        unlocked: [...(meta.worldEvents?.unlocked ?? [])],
        active: meta.worldEvents?.active ?? null,
        wavesLeft: meta.worldEvents?.wavesLeft ?? 0,
      },
    };
    this.settings = { ...DEFAULT_SETTINGS, ...meta.settings };
    this._migrateLegacyUpgrades();
    this._autoUnlockMilestones(false);
    this._applyTheme();
  }

  toMetaExtras() {
    return {
      tree: { ...this.data.tree },
      perks: [...this.data.perks],
      milestones: { claimed: [...this.data.milestones.claimed] },
      artifacts: {
        owned: [...this.data.artifacts.owned],
        equipped: [...this.data.artifacts.equipped],
      },
      shop: {
        purchased: [...this.data.shop.purchased],
        activeTheme: this.data.shop.activeTheme,
      },
      worldLegacy: { ranks: { ...this.data.worldLegacy.ranks } },
      lifetime: { ...this.data.lifetime },
      worldEvents: {
        unlocked: [...this.data.worldEvents.unlocked],
        active: this.data.worldEvents.active,
        wavesLeft: this.data.worldEvents.wavesLeft,
      },
    };
  }

  _migrateLegacyUpgrades() {
    for (const [id, level] of Object.entries(this.data.upgrades)) {
      if (PRESTIGE_TREE_NODES[id] && !this.data.tree[id]) {
        this.data.tree[id] = level;
      }
    }
  }

  get shards() {
    return this.data.shards;
  }

  get totalPrestiges() {
    return this.data.totalPrestiges;
  }

  get bestWave() {
    return this.data.bestWave;
  }

  get prestigeLevel() {
    return this.data.totalPrestiges;
  }

  getWorldTier() {
    return getWorldTier(this.data.totalPrestiges);
  }

  getNextWorldTier() {
    return getNextWorldTier(this.data.totalPrestiges);
  }

  get autoStartWaves() {
    return this.settings.autoStartWaves;
  }

  set autoStartWaves(value) {
    this.settings.autoStartWaves = value;
    this.eventBus.emit(Events.SETTINGS_CHANGED, this.settings);
  }

  recordWave(wave) {
    if (wave > this.data.bestWave) {
      this.data.bestWave = wave;
      this._autoUnlockMilestones(true);
    }
  }

  trackLifetime(key, amount = 1) {
    if (this.data.lifetime[key] !== undefined) {
      this.data.lifetime[key] += amount;
    }
  }

  canPrestige(waveNumber) {
    return waveNumber >= PRESTIGE_CONFIG.unlockWave;
  }

  getTreeRank(nodeId) {
    return this.data.tree[nodeId] || 0;
  }

  getUpgradeLevel(id) {
    return this.getTreeRank(id) || this.data.upgrades[id] || 0;
  }

  getNodeState(nodeId) {
    const def = PRESTIGE_TREE_NODES[nodeId];
    if (!def) return 'locked';
    const rank = this.getTreeRank(nodeId);
    if (rank >= def.maxRank) return 'maxed';
    if (rank > 0) return 'owned';
    const prereqsMet = def.prerequisites.every((p) => this.getTreeRank(p) >= 1);
    if (!prereqsMet) return 'locked';
    if (this.data.shards >= def.cost) return 'available';
    return 'unaffordable';
  }

  canPurchaseTreeNode(nodeId) {
    const def = PRESTIGE_TREE_NODES[nodeId];
    if (!def) return false;
    if (this.getTreeRank(nodeId) >= def.maxRank) return false;
    if (!def.prerequisites.every((p) => this.getTreeRank(p) >= 1)) return false;
    return this.data.shards >= def.cost;
  }

  purchaseTreeNode(nodeId) {
    if (!this.canPurchaseTreeNode(nodeId)) return false;
    const def = PRESTIGE_TREE_NODES[nodeId];
    this.data.shards -= def.cost;
    this.data.tree[nodeId] = this.getTreeRank(nodeId) + 1;
    if (PRESTIGE_UPGRADES[nodeId]) {
      this.data.upgrades[nodeId] = this.data.tree[nodeId];
    }
    this.eventBus.emit(Events.PRESTIGE_CHANGED, this.data);
    return true;
  }

  /** @deprecated — use purchaseTreeNode */
  canPurchaseUpgrade(id) {
    return this.canPurchaseTreeNode(id);
  }

  /** @deprecated — use purchaseTreeNode */
  purchaseUpgrade(id) {
    return this.purchaseTreeNode(id);
  }

  getModifiers() {
    const mods = {
      farmIncomeMult: 1,
      bonusStartingGold: 0,
      bonusStartingLives: 0,
      bonusStartingRP: 0,
      towerDamageMult: 1,
      waveBonusMult: 1,
      goldEarnedMult: 1,
      attackSpeedMult: 1,
      rangeMult: 1,
      buildCostMult: 1,
      upgradeCostMult: 1,
      repairCostMult: 1,
      sellValueMult: 1,
      researchMult: 1,
      crystalMult: 1,
      bossRewardMult: 1,
      bossDamageMult: 1,
      challengeRewardMult: 1,
      structureHealthMult: 1,
      masteryXpMult: 1,
      bankInterestMult: 1,
      prestigeTokenMult: 1,
      prestigeBossShardMult: 1,
      wonderCostMult: 1,
      bonusRpPerWave: 0,
    };

    for (const [nodeId, rank] of Object.entries(this.data.tree)) {
      const def = PRESTIGE_TREE_NODES[nodeId];
      if (!def || rank <= 0) continue;
      mergeEffect(mods, def.effect(rank));
    }

    for (const perkId of this.data.perks) {
      const perk = ASCENSION_PERKS[perkId];
      if (perk?.effect) mergeEffect(mods, perk.effect());
    }

    for (const slot of this.data.artifacts.equipped) {
      if (!slot) continue;
      const art = LEGACY_ARTIFACTS[slot];
      if (art?.effect) mergeEffect(mods, art.effect());
    }

    for (const itemId of this.data.shop.purchased) {
      const item = PRESTIGE_SHOP_ITEMS[itemId];
      if (item?.effect) mergeEffect(mods, item.effect());
    }

    const legacyRank = this._getWorldLegacyTotalRank();
    if (legacyRank > 0) {
      mods.farmIncomeMult *= 1 + legacyRank * 0.02;
      mods.towerDamageMult *= 1 + legacyRank * 0.02;
    }

    const activeEvent = this.data.worldEvents.active;
    if (activeEvent && this.data.worldEvents.wavesLeft > 0) {
      const ev = WORLD_EVENTS[activeEvent];
      if (ev?.effect) mergeEffect(mods, ev.effect);
    }

    return mods;
  }

  _getWorldLegacyTotalRank() {
    return Object.values(this.data.worldLegacy.ranks).reduce((a, b) => a + b, 0);
  }

  calculateShardsForWave(waveReached) {
    let earned = PRESTIGE_CONFIG.calculateShards(waveReached);
    const mods = this.getModifiers();
    earned = Math.floor(earned * (mods.prestigeTokenMult ?? 1));
    return earned;
  }

  estimatePrestigeReward(waveReached, crystals = 0) {
    const base = this.calculateShardsForWave(waveReached);
    const crystalBonus = Math.floor(crystals * 0.25);
    return { base, crystalBonus, total: base + crystalBonus };
  }

  prestige(waveReached) {
    const prevTier = getWorldTier(this.data.totalPrestiges);
    const earned = this.calculateShardsForWave(waveReached);
    this.data.shards += earned;
    this.data.totalPrestiges++;
    this.data.lifetime.prestigesCompleted++;
    this.recordWave(waveReached);
    this._autoUnlockMilestones(true);
    const newTier = getWorldTier(this.data.totalPrestiges);
    if (newTier.tier !== prevTier.tier) {
      this.eventBus.emit(Events.WORLD_TIER_CHANGED, { prev: prevTier, next: newTier });
    }
    this.eventBus.emit(Events.PRESTIGE_COMPLETED, { earned, total: this.data.shards });
    this.eventBus.emit(Events.PRESTIGE_CHANGED, this.data);
    return earned;
  }

  canSelectPerk(perkId) {
    const perk = ASCENSION_PERKS[perkId];
    if (!perk || this.data.perks.includes(perkId)) return false;
    return this.prestigeLevel >= perk.unlockPrestigeLevel;
  }

  selectPerk(perkId) {
    if (!this.canSelectPerk(perkId)) return false;
    this.data.perks.push(perkId);
    this.eventBus.emit(Events.PRESTIGE_CHANGED, this.data);
    return true;
  }

  getMilestoneProgress(milestone) {
    const req = milestone.requirement;
    if (req.totalPrestiges) return { current: this.data.totalPrestiges, target: req.totalPrestiges };
    if (req.bestWave) return { current: this.data.bestWave, target: req.bestWave };
    return { current: 0, target: 1 };
  }

  isMilestoneComplete(milestone) {
    const { current, target } = this.getMilestoneProgress(milestone);
    return current >= target;
  }

  claimMilestone(milestoneId) {
    const milestone = PRESTIGE_MILESTONES.find((m) => m.id === milestoneId);
    if (!milestone) return false;
    if (this.data.milestones.claimed.includes(milestoneId)) return false;
    if (!this.isMilestoneComplete(milestone)) return false;
    this.data.milestones.claimed.push(milestoneId);
    if (milestone.tokens) this.data.shards += milestone.tokens;
    this._autoUnlockMilestones(true);
    this.eventBus.emit(Events.PRESTIGE_CHANGED, this.data);
    return true;
  }

  _autoUnlockMilestones(emit) {
    let changed = false;
    for (const m of PRESTIGE_MILESTONES) {
      if (this.isMilestoneComplete(m) && !this.data.milestones.claimed.includes(m.id)) {
        // milestones require manual claim — only unlock world events
      }
      if (m.id === 'wave_75' && this.isMilestoneComplete(m) && !this.data.worldEvents.unlocked.includes('harvest_festival')) {
        this.data.worldEvents.unlocked.push('harvest_festival');
        changed = true;
      }
    }
    for (const [eventId, ev] of Object.entries(WORLD_EVENTS)) {
      const req = ev.unlockRequirement;
      const tier = getWorldTier(this.data.totalPrestiges);
      const unlocked = (!req.bestWave || this.data.bestWave >= req.bestWave)
        && (!req.totalPrestiges || this.data.totalPrestiges >= req.totalPrestiges)
        && (!req.worldTier || tier.tier >= req.worldTier);
      if (unlocked && !this.data.worldEvents.unlocked.includes(eventId)) {
        this.data.worldEvents.unlocked.push(eventId);
        changed = true;
      }
    }
    if (changed && emit) this.eventBus.emit(Events.PRESTIGE_CHANGED, this.data);
  }

  getUnlockedArtifactSlots() {
    return ARTIFACT_SLOT_UNLOCKS.filter((s) => this.prestigeLevel >= s.prestigeLevel).map((s) => s.slot);
  }

  canPurchaseArtifact(artifactId) {
    const art = LEGACY_ARTIFACTS[artifactId];
    if (!art || this.data.artifacts.owned.includes(artifactId)) return false;
    if (art.unlockMilestone && !this.data.milestones.claimed.includes(art.unlockMilestone)) {
      const ms = PRESTIGE_MILESTONES.find((m) => m.id === art.unlockMilestone);
      if (!ms || !this.isMilestoneComplete(ms)) return false;
    }
    return this.data.shards >= art.cost;
  }

  purchaseArtifact(artifactId) {
    if (!this.canPurchaseArtifact(artifactId)) return false;
    const art = LEGACY_ARTIFACTS[artifactId];
    this.data.shards -= art.cost;
    this.data.artifacts.owned.push(artifactId);
    this.eventBus.emit(Events.PRESTIGE_CHANGED, this.data);
    return true;
  }

  equipArtifact(artifactId, slot) {
    if (!this.data.artifacts.owned.includes(artifactId)) return false;
    if (!this.getUnlockedArtifactSlots().includes(slot)) return false;
    const equipped = [...this.data.artifacts.equipped];
    const prevSlot = equipped.indexOf(artifactId);
    if (prevSlot >= 0) equipped[prevSlot] = null;
    equipped[slot] = artifactId;
    this.data.artifacts.equipped = equipped;
    this.eventBus.emit(Events.PRESTIGE_CHANGED, this.data);
    return true;
  }

  unequipArtifact(slot) {
    if (!this.getUnlockedArtifactSlots().includes(slot)) return false;
    this.data.artifacts.equipped[slot] = null;
    this.eventBus.emit(Events.PRESTIGE_CHANGED, this.data);
    return true;
  }

  canPurchaseShopItem(itemId) {
    const item = PRESTIGE_SHOP_ITEMS[itemId];
    if (!item || this.data.shop.purchased.includes(itemId)) return false;
    return this.data.shards >= item.cost;
  }

  purchaseShopItem(itemId) {
    if (!this.canPurchaseShopItem(itemId)) return false;
    const item = PRESTIGE_SHOP_ITEMS[itemId];
    this.data.shards -= item.cost;
    this.data.shop.purchased.push(itemId);
    if (item.category === 'cosmetic') {
      this.data.shop.activeTheme = itemId;
      this._applyTheme();
    }
    this.eventBus.emit(Events.PRESTIGE_CHANGED, this.data);
    return true;
  }

  setActiveTheme(itemId) {
    if (!this.data.shop.purchased.includes(itemId)) return false;
    this.data.shop.activeTheme = itemId;
    this._applyTheme();
    this.eventBus.emit(Events.PRESTIGE_CHANGED, this.data);
    return true;
  }

  _applyTheme() {
    document.body.classList.remove('theme-twilight', 'theme-emerald');
    const theme = this.data.shop.activeTheme;
    if (theme === 'theme_twilight') document.body.classList.add('theme-twilight');
    if (theme === 'theme_emerald') document.body.classList.add('theme-emerald');
  }

  canUpgradeWorldLegacy(stageId) {
    const stage = WORLD_LEGACY_STAGES.find((s) => s.id === stageId);
    if (!stage) return false;
    const rank = this.data.worldLegacy.ranks[stageId] || 0;
    if (rank >= stage.maxRank) return false;
    return this.data.shards >= stage.cost;
  }

  upgradeWorldLegacy(stageId) {
    if (!this.canUpgradeWorldLegacy(stageId)) return false;
    const stage = WORLD_LEGACY_STAGES.find((s) => s.id === stageId);
    this.data.shards -= stage.cost;
    this.data.worldLegacy.ranks[stageId] = (this.data.worldLegacy.ranks[stageId] || 0) + 1;
    this.eventBus.emit(Events.PRESTIGE_CHANGED, this.data);
    return true;
  }

  canActivateWorldEvent(eventId) {
    const ev = WORLD_EVENTS[eventId];
    if (!ev || !this.data.worldEvents.unlocked.includes(eventId)) return false;
    if (this.data.worldEvents.active) return false;
    return this.data.shards >= ev.activationCost;
  }

  activateWorldEvent(eventId) {
    if (!this.canActivateWorldEvent(eventId)) return false;
    const ev = WORLD_EVENTS[eventId];
    this.data.shards -= ev.activationCost;
    this.data.worldEvents.active = eventId;
    this.data.worldEvents.wavesLeft = ev.durationWaves;
    this.eventBus.emit(Events.PRESTIGE_CHANGED, this.data);
    return true;
  }

  onRunWaveComplete() {
    if (!this.data.worldEvents.active || this.data.worldEvents.wavesLeft <= 0) return;
    this.data.worldEvents.wavesLeft--;
    if (this.data.worldEvents.wavesLeft <= 0) {
      this.data.worldEvents.active = null;
      this.eventBus.emit(Events.PRESTIGE_CHANGED, this.data);
    }
  }

  hasShopUnlock(itemId) {
    return this.data.shop.purchased.includes(itemId);
  }

  hasPerk(perkId) {
    return this.data.perks.includes(perkId);
  }

  resetAll() {
    this.data = structuredClone(DEFAULT_DATA);
    this.settings = { ...DEFAULT_SETTINGS };
    this._applyTheme();
  }
}
