import { COMMAND } from '../config';
import { getAbility, type AbilityType } from './types';

export interface ActiveBuff {
  type: AbilityType;
  expiresAt: number;
}

export interface AbilitySystemState {
  commandPoints: number;
  maxCommandPoints: number;
  cpRegenProgress: number;
  activeBuffs: ActiveBuff[];
  cooldowns: Partial<Record<AbilityType, number>>;
  lastFeedback: string | null;
}

export class AbilitySystem {
  private commandPoints = COMMAND.cpMax;
  private lastCpRegenAt = 0;
  private abilityCooldowns = new Map<AbilityType, number>();
  private activeBuffs: ActiveBuff[] = [];
  lastFeedback: string | null = null;

  constructor(startTime = 0) {
    this.lastCpRegenAt = startTime;
  }

  update(now: number): void {
    while (
      this.commandPoints < COMMAND.cpMax &&
      now - this.lastCpRegenAt >= COMMAND.cpRegenMs
    ) {
      this.commandPoints++;
      this.lastCpRegenAt += COMMAND.cpRegenMs;
    }
    this.activeBuffs = this.activeBuffs.filter((b) => b.expiresAt > now);
  }

  useAbility(type: AbilityType, now: number): boolean {
    const def = getAbility(type);
    const cooldownReadyAt = this.abilityCooldowns.get(type) ?? 0;
    if (now < cooldownReadyAt) {
      this.lastFeedback = `${def.label} on cooldown`;
      return false;
    }
    if (this.commandPoints < def.cpCost) {
      this.lastFeedback = `Need ${def.cpCost} CP`;
      return false;
    }

    this.commandPoints -= def.cpCost;
    if (def.cooldownMs > 0) {
      this.abilityCooldowns.set(type, now + def.cooldownMs);
    }

    let durationMs = 0;
    if (type === 'war_cry') {
      durationMs = COMMAND.abilities.warCry.durationMs;
    } else if (type === 'tactical_rally') {
      durationMs = COMMAND.abilities.tacticalRally.durationMs;
    }

    if (durationMs > 0) {
      this.activeBuffs.push({ type, expiresAt: now + durationMs });
    }

    this.lastFeedback = `${def.label} activated`;
    return true;
  }

  hasBuff(type: AbilityType, now: number): boolean {
    return this.activeBuffs.some((b) => b.type === type && b.expiresAt > now);
  }

  getDamageMultiplier(now: number): number {
    return this.hasBuff('war_cry', now) ? 1 + COMMAND.abilities.warCry.damageBonus : 1;
  }

  getDamageReduction(now: number): number {
    return this.hasBuff('tactical_rally', now) ? COMMAND.abilities.tacticalRally.damageReduction : 0;
  }

  getState(now: number): AbilitySystemState {
    const cpRegenElapsed = now - this.lastCpRegenAt;
    const cpRegenProgress =
      this.commandPoints >= COMMAND.cpMax ? 1 : cpRegenElapsed / COMMAND.cpRegenMs;

    const cooldowns: Partial<Record<AbilityType, number>> = {};
    for (const type of ['war_cry', 'tactical_rally'] as AbilityType[]) {
      const readyAt = this.abilityCooldowns.get(type) ?? 0;
      const remaining = Math.max(0, readyAt - now);
      if (remaining > 0) cooldowns[type] = remaining;
    }

    return {
      commandPoints: this.commandPoints,
      maxCommandPoints: COMMAND.cpMax,
      cpRegenProgress,
      activeBuffs: [...this.activeBuffs],
      cooldowns,
      lastFeedback: this.lastFeedback,
    };
  }
}
