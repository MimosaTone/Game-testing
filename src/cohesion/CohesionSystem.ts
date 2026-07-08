import Phaser from 'phaser';
import { COHESION, SYNERGY } from '../config';
import type { Commander, Companion } from '../entities/Unit';
import { PALETTE } from '../presentation/palette';

export type CohesionState = 'bonded' | 'desynced' | 'resyncing';

export interface CohesionSystemState {
  state: CohesionState;
  bondActive: boolean;
  obedienceDelayMs: number;
  bondTension: number;
}

export class CohesionSystem {
  private cohesionState: CohesionState = 'bonded';
  private resyncEndsAt = 0;
  private bondGfx?: Phaser.GameObjects.Graphics;
  private pulsePhase = 0;

  constructor(scene: Phaser.Scene) {
    this.bondGfx = scene.add.graphics();
    this.bondGfx.setDepth(2);
  }

  update(commander: Commander, companion: Companion, now: number, delta: number): CohesionSystemState {
    const dist = Phaser.Math.Distance.Between(commander.x, commander.y, companion.x, companion.y);
    const inRange = commander.isAlive && companion.isAlive && dist <= SYNERGY.bondRadius;
    const tension = Phaser.Math.Clamp((dist - SYNERGY.bondRadius * 0.7) / (SYNERGY.bondRadius * 0.3), 0, 1);

    if (this.cohesionState === 'resyncing') {
      if (!inRange) {
        this.cohesionState = 'desynced';
        companion.finishResync();
      } else if (now >= this.resyncEndsAt) {
        this.cohesionState = 'bonded';
        companion.finishResync();
      }
    } else if (inRange) {
      if (this.cohesionState === 'desynced') {
        this.cohesionState = 'resyncing';
        this.resyncEndsAt = now + COHESION.resyncDurationMs;
        companion.beginResync(commander);
      } else {
        this.cohesionState = 'bonded';
      }
    } else {
      this.cohesionState = 'desynced';
    }

    const bonded = this.cohesionState === 'bonded';
    companion.cohesionState = this.cohesionState;
    companion.bondActive = bonded;
    commander.setBondVisual(bonded, this.cohesionState, tension);
    companion.setBondVisual(bonded, this.cohesionState, tension);

    if (bonded) {
      commander.synergyDamageBonus = 0.15;
      commander.synergyDamageReduction = 0.1;
      companion.synergyDamageBonus = 0.15;
      companion.synergyDamageReduction = 0.1;
    } else {
      commander.synergyDamageBonus = 0;
      commander.synergyDamageReduction = 0;
      companion.synergyDamageBonus = 0;
      companion.synergyDamageReduction = 0;
    }

    this.pulsePhase += delta * 0.004;
    this.drawBond(commander, companion, dist, tension);

    return {
      state: this.cohesionState,
      bondActive: bonded,
      obedienceDelayMs: bonded ? 0 : 1750,
      bondTension: tension,
    };
  }

  private drawBond(
    commander: Commander,
    companion: Companion,
    _dist: number,
    tension: number,
  ): void {
    if (!this.bondGfx || !commander.isAlive || !companion.isAlive) {
      this.bondGfx?.clear();
      return;
    }

    this.bondGfx.clear();

    let color: number = PALETTE.bondAmber;
    let alpha = 0.55;
    let width = 3;

    if (this.cohesionState === 'desynced') {
      color = PALETTE.bondBroken;
      alpha = 0.2;
      width = 1;
    } else if (this.cohesionState === 'resyncing') {
      color = PALETTE.bondAmber;
      alpha = 0.7;
      width = 3;
    } else if (tension > 0.3) {
      color = PALETTE.bondFray;
      alpha = 0.35 + tension * 0.2;
    }

    const pulse = this.cohesionState === 'bonded' ? 0.85 + Math.sin(this.pulsePhase) * 0.15 : 1;
    this.bondGfx.lineStyle(width, color, alpha * pulse);
    this.bondGfx.beginPath();
    this.bondGfx.moveTo(commander.x, commander.y);
    this.bondGfx.lineTo(companion.x, companion.y);
    this.bondGfx.strokePath();

    if (this.cohesionState === 'bonded' && tension > 0.5) {
      this.bondGfx.lineStyle(1, PALETTE.bondFray, 0.4);
      const midX = (commander.x + companion.x) / 2;
      const midY = (commander.y + companion.y) / 2;
      this.bondGfx.strokeCircle(midX, midY, 6 + tension * 4);
    }
  }

  destroy(): void {
    this.bondGfx?.destroy();
  }
}
