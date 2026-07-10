import { GAME_CONFIG } from '../config/gameConfig.js';
import { Events } from '../core/EventBus.js';
import { damageStructure } from '../entities/StructureHealth.js';

/**
 * Handles specialized enemies attacking towers, farms, and support structures.
 */
export class StructureCombatSystem {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.placementSystem = null;
    this.supportEffects = null;
    this.damageTakenMult = 1;
  }

  setDamageTakenMult(mult) {
    this.damageTakenMult = Math.max(0.5, mult ?? 1);
  }

  setPlacementSystem(ps) {
    this.placementSystem = ps;
  }

  setSupportEffects(se) {
    this.supportEffects = se;
  }

  update(dt, enemies) {
    if (!this.placementSystem) return;

    const structures = this._allStructures();
    if (structures.length === 0) return;

    for (const enemy of enemies) {
      if (!enemy.alive || enemy.reachedEnd) continue;
      const behavior = enemy.definition.attackBehavior;
      if (!behavior) continue;

      enemy.attackCooldown = (enemy.attackCooldown || 0) - dt;

      if (behavior === 'siege') {
        this._updateSiege(enemy, structures, dt);
      } else if (behavior === 'saboteur') {
        this._updateSaboteur(enemy, structures, dt);
      } else if (behavior === 'flyer') {
        this._updateFlyer(enemy, structures, dt);
      }
    }
  }

  onEnemyKilled(enemy) {
    if (enemy.definition.attackBehavior !== 'bomber') return;
    const radius = enemy.definition.explosionRadius || 80;
    const damage = enemy.definition.explosionDamage || 30;
    const structures = this._allStructures();

    for (const s of structures) {
      const pos = s.getPixelPosition(GAME_CONFIG.tileSize);
      const dist = Math.hypot(pos.x - enemy.x, pos.y - enemy.y);
      if (dist <= radius) {
        this._damageStructure(s, damage * (1 - dist / radius * 0.5));
      }
    }
  }

  _updateSiege(enemy, structures, dt) {
    const towers = structures.filter((s) => s.type === 'tower' && !s.destroyed);
    const target = this._nearest(enemy, towers, enemy.definition.attackRange || 100);
    if (!target) return;

    if (enemy.attackCooldown <= 0) {
      enemy.attackCooldown = enemy.definition.attackInterval || 2;
      this._damageStructure(target, enemy.definition.structureDamage || 12);
      enemy.siegePaused = true;
    }

    if (enemy.siegePaused) {
      enemy.distance = Math.max(0, enemy.distance - enemy.speed * dt * 0.15);
      const pos = enemy.path.getPositionAt(enemy.distance);
      enemy.x = pos.x;
      enemy.y = pos.y;
    }
  }

  _updateSaboteur(enemy, structures, dt) {
    const targets = structures.filter(
      (s) => (s.type === 'farm' || s.type === 'support') && !s.destroyed
    );
    const detect = enemy.definition.detectRange || 130;
    const target = this._nearest(enemy, targets, detect);
    if (!target) return;

    const pos = target.getPixelPosition(GAME_CONFIG.tileSize);
    const dist = Math.hypot(pos.x - enemy.x, pos.y - enemy.y);

    if (dist <= (enemy.definition.attackRange || 45)) {
      if (enemy.attackCooldown <= 0) {
        enemy.attackCooldown = enemy.definition.attackInterval || 1.5;
        this._damageStructure(target, enemy.definition.structureDamage || 15);
      }
      enemy.distance = Math.max(0, enemy.distance - enemy.speed * dt * 0.25);
      const epos = enemy.path.getPositionAt(enemy.distance);
      enemy.x = epos.x;
      enemy.y = epos.y;
    }
  }

  _updateFlyer(enemy, structures, dt) {
    const towers = structures.filter((s) => s.type === 'tower' && !s.destroyed);
    const target = this._nearest(enemy, towers, enemy.definition.attackRange || 65);
    if (!target || enemy.attackCooldown > 0) return;

    enemy.attackCooldown = enemy.definition.attackInterval || 1.8;
    this._damageStructure(target, enemy.definition.structureDamage || 8);
  }

  _nearest(enemy, structures, range) {
    let best = null;
    let bestDist = range;

    for (const s of structures) {
      const pos = s.getPixelPosition(GAME_CONFIG.tileSize);
      const dist = Math.hypot(pos.x - enemy.x, pos.y - enemy.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = s;
      }
    }
    return best;
  }

  _allStructures() {
    const ps = this.placementSystem;
    return [...ps.towers, ...ps.farms, ...ps.supports].filter((s) => !s.destroyed);
  }

  _damageStructure(structure, damage) {
    const mult = this.damageTakenMult ?? 1;
    const adjusted = damage * mult;
    const destroyed = damageStructure(structure, adjusted);
    this.eventBus.emit(Events.STRUCTURE_DAMAGED, structure);
    if (destroyed) {
      this._handleDestroyed(structure);
    }
  }

  _handleDestroyed(structure) {
    this.placementSystem.recordDestroyed(structure);
    this.eventBus.emit(Events.STRUCTURE_DESTROYED, structure);
  }

  /** Repair structures between waves and during combat via repair stations. */
  processRepairs(dt, isWave) {
    const stations = this.placementSystem.supports.filter(
      (s) => s.typeId === 'repair_station' && !s.destroyed
    );
    if (stations.length === 0) return;

    for (const station of stations) {
      const stats = this.supportEffects.getStructureRepairStats(station);
      const radiusPx = stats.radius * GAME_CONFIG.tileSize;
      const pos = station.getPixelPosition(GAME_CONFIG.tileSize);
      let repaired = 0;

      for (const s of this._allStructures()) {
        if (s.id === station.id || s.destroyed) continue;
        const spos = s.getPixelPosition(GAME_CONFIG.tileSize);
        if (Math.hypot(spos.x - pos.x, spos.y - pos.y) > radiusPx) continue;
        if (s.health >= s.maxHealth) continue;
        if (repaired >= stats.maxSimultaneous) break;

        const rate = isWave ? stats.combatRepairPerSec : stats.waveRepairAmount;
        const healed = Math.min(s.maxHealth - s.health, rate * (isWave ? dt : 1));
        if (healed > 0) {
          s.health += healed;
          repaired++;
          this.eventBus.emit(Events.STRUCTURE_REPAIRED, s);
        }
      }
    }
  }
}
