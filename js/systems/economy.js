/**
 * Economy system — tracks gold and per-wave farm income.
 */
export class EconomySystem {
  constructor(startingGold = 0) {
    this.gold = startingGold;
    this.listeners = [];
  }

  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  #notify() {
    for (const cb of this.listeners) cb(this.gold);
  }

  canAfford(amount) {
    return this.gold >= amount;
  }

  spend(amount) {
    if (!this.canAfford(amount)) return false;
    this.gold -= amount;
    this.#notify();
    return true;
  }

  earn(amount) {
    this.gold += amount;
    this.#notify();
  }

  collectWaveIncome(income) {
    this.earn(income);
  }
}
