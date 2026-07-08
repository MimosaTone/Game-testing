import Phaser from 'phaser';
import { COHESION, SYNERGY } from '../config';
import type { Commander, Companion } from '../entities/Unit';

export type CohesionState = 'bonded' | 'desynced' | 'resyncing';

export interface CohesionSystemState {
  state: CohesionState;
  bondActive: boolean;
  obedienceDelayMs: number;
}

export class CohesionSystem {
  private cohesionState: CohesionState = 'bonded';
  private resyncEndsAt = 0;
  private bondGfx?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.bondGfx = scene.add.graphics();
    this.bondGfx.setDepth(-2);
  }

  update(commander: Commander, companion: Companion, now: number): CohesionSystemState {
    const inRange =
      commander.isAlive &&
      companion.isAlive &&
      Phaser.Math.Distance.Between(commander.x, commander.y, companion.x, companion.y) <=
        SYNERGY.bondRadius;

    if (this.cohesionState === 'resyncing') {
      if (now >= this.resyncEndsAt) {
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

    if (bonded) {
      commander.synergyDamageBonus = SYNERGY.damageBonus;
      commander.synergyDamageReduction = SYNERGY.damageReduction;
      companion.synergyDamageBonus = SYNERGY.damageBonus;
      companion.synergyDamageReduction = SYNERGY.damageReduction;
    } else {
      commander.synergyDamageBonus = 0;
      commander.synergyDamageReduction = 0;
      companion.synergyDamageBonus = 0;
      companion.synergyDamageReduction = 0;
    }

    const lineColor =
      this.cohesionState === 'bonded' ? 0xffd166 :
      this.cohesionState === 'resyncing' ? 0x88ff88 : 0xff6666;
    const lineAlpha =
      this.cohesionState === 'bonded' ? 0.3 :
      this.cohesionState === 'resyncing' ? 0.4 : 0.15;
    this.drawBond(commander, companion, lineColor, lineAlpha, bonded);

    return {
      state: this.cohesionState,
      bondActive: bonded,
      obedienceDelayMs: bonded ? 0 : COHESION.obedienceDelayMs,
    };
  }

  private drawBond(
    commander: Commander,
    companion: Companion,
    color: number,
    alpha: number,
    bonded: boolean,
  ): void {
    if (!this.bondGfx) return;
    this.bondGfx.clear();
    this.bondGfx.lineStyle(2, color, alpha);
    this.bondGfx.beginPath();
    this.bondGfx.moveTo(commander.x, commander.y);
    this.bondGfx.lineTo(companion.x, companion.y);
    this.bondGfx.strokePath();

    if (bonded) {
      this.bondGfx.lineStyle(1, 0x4a9eff, 0.12);
      this.bondGfx.strokeCircle(commander.x, commander.y, SYNERGY.bondRadius);
    }
  }

  destroy(): void {
    this.bondGfx?.destroy();
  }
}
