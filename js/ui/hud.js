/**
 * HUD — displays Gold, Lives, Wave, and Income Per Wave.
 */
export class HUD {
  constructor(elements) {
    this.goldEl = elements.gold;
    this.livesEl = elements.lives;
    this.waveEl = elements.wave;
    this.incomeEl = elements.income;
  }

  update(state) {
    this.goldEl.textContent = state.gold;
    this.livesEl.textContent = state.lives;
    this.waveEl.textContent = `${state.wave} / ${state.totalWaves}`;
    this.incomeEl.textContent = `+${state.incomePerWave}`;
  }
}
