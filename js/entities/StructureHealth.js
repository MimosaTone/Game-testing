import {
  STRUCTURE_HEALTH,
  REPAIR_GOLD_PER_HP,
} from '../config/structureHealthConfig.js';

/**
 * Shared health/armor mechanics for placeable structures.
 */
export function initStructureHealth(entity, category) {
  const cfg = STRUCTURE_HEALTH[category];
  entity.maxHealth = cfg.maxHealth;
  entity.health = cfg.maxHealth;
  entity.armor = cfg.armor;
  entity.destroyed = false;
}

export function restoreStructureHealth(entity, health, maxHealth, destroyed) {
  entity.maxHealth = maxHealth ?? entity.maxHealth;
  entity.health = health ?? entity.maxHealth;
  entity.destroyed = !!destroyed;
  if (entity.health <= 0) {
    entity.health = 0;
    entity.destroyed = true;
  }
}

export function damageStructure(entity, rawDamage) {
  if (entity.destroyed) return false;
  const actual = rawDamage * (1 - (entity.armor || 0));
  entity.health = Math.max(0, entity.health - actual);
  if (entity.health <= 0) {
    entity.health = 0;
    entity.destroyed = true;
    return true;
  }
  return false;
}

export function repairStructure(entity, amount) {
  if (entity.destroyed) return 0;
  const before = entity.health;
  entity.health = Math.min(entity.maxHealth, entity.health + amount);
  return entity.health - before;
}

export function getRepairCost(entity) {
  if (entity.destroyed) return null;
  const missing = entity.maxHealth - entity.health;
  if (missing <= 0) return 0;
  return Math.ceil(missing * REPAIR_GOLD_PER_HP);
}

export function getHealthPct(entity) {
  if (!entity.maxHealth) return 1;
  return entity.health / entity.maxHealth;
}

export function isDamaged(entity) {
  return !entity.destroyed && entity.health < entity.maxHealth;
}
