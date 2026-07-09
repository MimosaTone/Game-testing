import { Phase } from '../core/Game.js';

/**
 * Modal UI for exporting and importing Base64 save codes.
 */
export class SaveCodeModal {
  constructor(game, hud) {
    this.game = game;
    this.hud = hud;
    this.mode = 'export';

    this.exportOverlay = document.getElementById('export-save-modal');
    this.importOverlay = document.getElementById('import-save-modal');
    this.exportCodeEl = document.getElementById('export-save-code');
    this.exportSummaryEl = document.getElementById('export-save-summary');
    this.exportErrorEl = document.getElementById('export-save-error');
    this.importInputEl = document.getElementById('import-save-input');
    this.importErrorEl = document.getElementById('import-save-error');
    this.importSummaryEl = document.getElementById('import-save-summary');

    document.getElementById('export-save-btn').addEventListener('click', () => this.openExport());
    document.getElementById('import-save-btn').addEventListener('click', () => this.openImport());
    document.getElementById('copy-save-code-btn').addEventListener('click', () => this._copyCode());
    document.getElementById('close-export-save-btn').addEventListener('click', () => this.closeExport());
    document.getElementById('confirm-import-save-btn').addEventListener('click', () => this._confirmImport());
    document.getElementById('cancel-import-save-btn').addEventListener('click', () => this.closeImport());
  }

  updateButtons() {
    const canTransfer = this.game.phase === Phase.PLANNING;
    const exportBtn = document.getElementById('export-save-btn');
    const importBtn = document.getElementById('import-save-btn');
    exportBtn.disabled = !canTransfer || this.game.lives <= 0;
    importBtn.disabled = !canTransfer;
    exportBtn.title = canTransfer
      ? 'Copy your progress as a portable save code'
      : 'Export is only available between waves';
    importBtn.title = canTransfer
      ? 'Restore progress from a save code'
      : 'Import is only available between waves';
  }

  openExport() {
    this.exportErrorEl.textContent = '';
    this.exportErrorEl.classList.add('hidden');
    const result = this.game.exportSaveCode();

    if (!result.ok) {
      this.exportErrorEl.textContent = result.error;
      this.exportErrorEl.classList.remove('hidden');
      this.exportCodeEl.value = '';
      this.exportSummaryEl.innerHTML = '';
      this.exportOverlay.classList.remove('hidden');
      return;
    }

    this.exportCodeEl.value = result.code;
    this.exportSummaryEl.innerHTML = this._renderSummary(result.summary, true);
    this.exportOverlay.classList.remove('hidden');
    this.exportCodeEl.focus();
    this.exportCodeEl.select();
  }

  closeExport() {
    this.exportOverlay.classList.add('hidden');
  }

  openImport() {
    this.importErrorEl.textContent = '';
    this.importErrorEl.classList.add('hidden');
    this.importInputEl.value = '';
    this.importSummaryEl.innerHTML = '';
    this.importOverlay.classList.remove('hidden');
    this.importInputEl.focus();
  }

  closeImport() {
    this.importOverlay.classList.add('hidden');
  }

  _copyCode() {
    const code = this.exportCodeEl.value;
    if (!code) return;

    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById('copy-save-code-btn');
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = original; }, 1500);
    }).catch(() => {
      this.exportCodeEl.focus();
      this.exportCodeEl.select();
    });
  }

  _confirmImport() {
    this.importErrorEl.textContent = '';
    this.importErrorEl.classList.add('hidden');

    const parsed = this.game.importSaveCode(this.importInputEl.value);
    if (!parsed.ok) {
      this.importErrorEl.textContent = parsed.error;
      this.importErrorEl.classList.remove('hidden');
      return;
    }

    this.importSummaryEl.innerHTML = this._renderSummary(parsed.summary, false);

    const confirmed = confirm(
      'Import this save code?\n\nYour current progress will be replaced with the imported data.'
    );
    if (!confirmed) return;

    this.game.applySaveCodePayload(parsed.payload);
    this.closeImport();
    this.hud._hideUpgradePanel();
    this.hud._hideWaveSummary();
    this.hud._renderBuildPanel();
    this.hud._renderSupportPanel();
    this.hud._renderHotbar();
    this.hud._renderResearchUpgrades();
    this.hud._renderChallengePanel();
    this.hud._renderPrestigeUpgrades();
    this.hud._updateStartButton();
    this.hud._updatePrestigeUI();
    this.hud._updateBuildAffordability();
    this.hud.elements.autoStartToggle.checked = this.game.autoStartWaves;
    this.updateButtons();
  }

  _renderSummary(summary, includeCodeHint) {
    if (!summary.runIncluded) {
      return `
        <div class="start-summary-row"><span>Prestige Shards</span><strong>${summary.shards} ✿</strong></div>
        <p class="hint-text">This code contains prestige progress only. A fresh run will begin after import.</p>
      `;
    }

    return `
      <div class="start-summary-row"><span>Wave</span><strong>${summary.wave}</strong></div>
      <div class="start-summary-row"><span>Gold</span><strong>${summary.gold}g</strong></div>
      <div class="start-summary-row"><span>Lives</span><strong>${summary.lives}</strong></div>
      <div class="start-summary-row"><span>Research</span><strong>${summary.researchPoints} RP</strong></div>
      <div class="start-summary-row"><span>Crystals</span><strong>${summary.crystals} ◆</strong></div>
      <div class="start-summary-row"><span>Prestige Shards</span><strong>${summary.shards} ✿</strong></div>
      <div class="start-summary-row"><span>Structures</span><strong>${summary.towerCount} towers · ${summary.farmCount} farms · ${summary.supportCount} support</strong></div>
      ${includeCodeHint ? '<p class="hint-text">Copy this code to back up or transfer your progress on another device.</p>' : ''}
    `;
  }
}
