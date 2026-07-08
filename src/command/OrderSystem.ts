import { getOrder, type OrderType } from './types';

export interface ActiveOrder {
  type: OrderType;
  issuedAt: number;
  rallyPoint?: { x: number; y: number };
  focusEnemyId?: string;
}

export interface OrderSystemState {
  activeOrder: ActiveOrder | null;
  cooldowns: Partial<Record<OrderType, number>>;
  lastFeedback: string | null;
  lastFeedbackAt: number;
}

export class OrderSystem {
  private cooldowns = new Map<OrderType, number>();
  private activeOrder: ActiveOrder | null = null;
  lastFeedback: string | null = null;
  private lastFeedbackAt = 0;

  issue(
    type: OrderType,
    now: number,
    options?: { rallyPoint?: { x: number; y: number }; focusEnemyId?: string },
  ): boolean {
    const readyAt = this.cooldowns.get(type) ?? 0;
    if (now < readyAt) {
      this.setFeedbackInternal(`Order cooling down`, now);
      return false;
    }

    const order = getOrder(type);
    this.cooldowns.set(type, now + order.cooldownMs);
    this.activeOrder = {
      type,
      issuedAt: now,
      rallyPoint: options?.rallyPoint,
      focusEnemyId: options?.focusEnemyId,
    };
    this.setFeedbackInternal(`${order.label} issued`, now);
    return true;
  }

  getActiveOrder(): ActiveOrder | null {
    return this.activeOrder;
  }

  getCooldownRemaining(type: OrderType, now: number): number {
    const readyAt = this.cooldowns.get(type) ?? 0;
    return Math.max(0, readyAt - now);
  }

  getState(now: number): OrderSystemState {
    const cooldowns: Partial<Record<OrderType, number>> = {};
    for (const type of ['hold', 'attack', 'defend', 'rally_point', 'focus_target'] as OrderType[]) {
      const remaining = this.getCooldownRemaining(type, now);
      if (remaining > 0) cooldowns[type] = remaining;
    }
    return {
      activeOrder: this.activeOrder,
      cooldowns,
      lastFeedback: this.lastFeedback,
      lastFeedbackAt: this.lastFeedbackAt,
    };
  }

  setFeedback(message: string, now: number): void {
    this.lastFeedback = message;
    this.lastFeedbackAt = now;
  }

  private setFeedbackInternal(message: string, now: number): void {
    this.setFeedback(message, now);
  }
}
