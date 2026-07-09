/** Health and armor defaults per structure category. */
export const STRUCTURE_HEALTH = {
  tower: { maxHealth: 220, armor: 0.12 },
  farm: { maxHealth: 130, armor: 0 },
  support: { maxHealth: 160, armor: 0.08 },
};

/** Gold cost per HP restored during planning phase. */
export const REPAIR_GOLD_PER_HP = 0.45;

/** Rebuild destroyed structure at this fraction of original cost. */
export const REBUILD_COST_MULT = 0.55;
