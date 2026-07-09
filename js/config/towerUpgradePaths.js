/**
 * Sequential upgrade paths per tower type.
 * Each tier is a meaningful power spike — not just minor stat bumps.
 */
export const TOWER_UPGRADE_PATHS = {
  needle: [
    {
      id: 'sharpened',
      name: 'Sharpened Tips',
      cost: 45,
      description: '+60% damage',
      effects: { damageMult: 1.6 },
    },
    {
      id: 'rapid',
      name: 'Rapid Fire',
      cost: 70,
      description: '+50% attack speed',
      effects: { attackSpeedMult: 1.5 },
    },
    {
      id: 'twin',
      name: 'Twin Needles',
      cost: 110,
      description: 'Fires 2 darts per volley',
      effects: { projectileCount: 2 },
    },
    {
      id: 'pierce',
      name: 'Piercing Volley',
      cost: 170,
      description: 'Darts pierce through 3 enemies',
      effects: { pierce: 3 },
    },
    {
      id: 'storm',
      name: 'Needle Storm',
      cost: 260,
      description: 'Capstone: +100% damage & +40% speed',
      effects: { damageMult: 2.0, attackSpeedMult: 1.4 },
    },
  ],

  boulder: [
    {
      id: 'heavy',
      name: 'Heavy Stones',
      cost: 55,
      description: '+70% damage',
      effects: { damageMult: 1.7 },
    },
    {
      id: 'wide',
      name: 'Wide Blast',
      cost: 85,
      description: '+60% splash radius',
      effects: { splashRadiusMult: 1.6 },
    },
    {
      id: 'shrapnel',
      name: 'Shrapnel',
      cost: 130,
      description: 'Splash retains 80% damage at edge',
      effects: { splashFalloff: 0.2 },
    },
    {
      id: 'seismic',
      name: 'Seismic Impact',
      cost: 195,
      description: 'Slows hit foes by 45% for 2s',
      effects: { slowPercent: 0.45, slowDuration: 2 },
    },
    {
      id: 'avalanche',
      name: 'Avalanche',
      cost: 290,
      description: 'Capstone: +120% damage & +90% splash',
      effects: { damageMult: 2.2, splashRadiusMult: 1.9 },
    },
  ],

  prism: [
    {
      id: 'focus',
      name: 'Focused Beam',
      cost: 50,
      description: '+45% damage & +20% range',
      effects: { damageMult: 1.45, rangeMult: 1.2 },
    },
    {
      id: 'refract',
      name: 'Quick Refract',
      cost: 75,
      description: '+50% attack speed',
      effects: { attackSpeedMult: 1.5 },
    },
    {
      id: 'bind',
      name: 'Binding Light',
      cost: 120,
      description: 'Slows enemies 35% for 2.5s',
      effects: { slowPercent: 0.35, slowDuration: 2.5 },
    },
    {
      id: 'arc',
      name: 'Arc Split',
      cost: 180,
      description: 'Chains to 2 nearby foes (65% dmg)',
      effects: { chainCount: 2, chainDamageMult: 0.65, chainRange: 90 },
    },
    {
      id: 'cascade',
      name: 'Prism Cascade',
      cost: 275,
      description: 'Capstone: chains to 4 foes & +90% damage',
      effects: { damageMult: 1.9, chainCount: 4, chainDamageMult: 0.7, chainRange: 110 },
    },
  ],

  gust: [
    {
      id: 'breeze',
      name: 'Strong Breeze',
      cost: 48,
      description: '+30% slow aura strength',
      effects: { auraSlowMult: 1.3 },
    },
    {
      id: 'shear',
      name: 'Wind Shear',
      cost: 72,
      description: '+50% damage',
      effects: { damageMult: 1.5 },
    },
    {
      id: 'pulse',
      name: 'Gale Pulse',
      cost: 115,
      description: 'Knockback pulse every 3s in range',
      effects: { knockbackPulse: 55, knockbackInterval: 3 },
    },
    {
      id: 'cyclone',
      name: 'Cyclone',
      cost: 175,
      description: '+40% range & +35% slow',
      effects: { rangeMult: 1.4, auraSlowMult: 1.35 },
    },
    {
      id: 'tempest',
      name: 'Tempest',
      cost: 265,
      description: 'Capstone: strong knockback & 50% slow',
      effects: { auraSlowAdd: 0.25, knockbackPulse: 90, knockbackInterval: 2.5 },
    },
  ],

  ember: [
    {
      id: 'coals',
      name: 'Hot Coals',
      cost: 50,
      description: '+90% burn damage',
      effects: { burnDPSMult: 1.9 },
    },
    {
      id: 'kindle',
      name: 'Kindling',
      cost: 78,
      description: '+55% direct damage',
      effects: { damageMult: 1.55 },
    },
    {
      id: 'longburn',
      name: 'Long Burn',
      cost: 120,
      description: 'Burn lasts 5 seconds',
      effects: { burnDuration: 5 },
    },
    {
      id: 'wildfire',
      name: 'Wildfire',
      cost: 185,
      description: 'Burn spreads to nearby foes',
      effects: { burnSpread: 70, burnSpreadCount: 2 },
    },
    {
      id: 'inferno',
      name: 'Inferno',
      cost: 280,
      description: 'Capstone: burn ignores 50% armor',
      effects: { burnDPSMult: 1.5, burnIgnoresArmor: 0.5 },
    },
  ],
};

/** Merge all purchased tier effects into combat stats. */
export function computeTowerStats(towerDef, upgradeTier, path, prestigeMods = null) {
  const base = towerDef.baseStats;
  let damage = base.damage;
  let range = base.range;
  let attackSpeed = base.attackSpeed;
  let splashRadius = base.splashRadius || 0;

  const combat = {
    damage,
    range,
    attackSpeed,
    splashRadius,
    projectileCount: 1,
    pierce: 0,
    chainCount: 0,
    chainDamageMult: 0.6,
    chainRange: 80,
    slowPercent: 0,
    slowDuration: 0,
    splashFalloff: 0.5,
    auraSlow: base.auraSlow || 0,
    burnDPS: base.burnDPS || 0,
    burnDuration: base.burnDuration || 0,
    burnSpread: 0,
    burnSpreadCount: 0,
    burnIgnoresArmor: 0,
    knockbackPulse: 0,
    knockbackInterval: 0,
    isAuraTower: towerDef.isAuraTower || false,
  };

  for (let i = 0; i < upgradeTier; i++) {
    const tier = path[i];
    if (!tier) continue;
    const fx = tier.effects;

    if (fx.damageMult) combat.damage *= fx.damageMult;
    if (fx.rangeMult) combat.range *= fx.rangeMult;
    if (fx.attackSpeedMult) combat.attackSpeed *= fx.attackSpeedMult;
    if (fx.splashRadiusMult) combat.splashRadius *= fx.splashRadiusMult;
    if (fx.projectileCount) combat.projectileCount = fx.projectileCount;
    if (fx.pierce) combat.pierce = fx.pierce;
    if (fx.chainCount) combat.chainCount = fx.chainCount;
    if (fx.chainDamageMult) combat.chainDamageMult = fx.chainDamageMult;
    if (fx.chainRange) combat.chainRange = fx.chainRange;
    if (fx.slowPercent) combat.slowPercent = Math.max(combat.slowPercent, fx.slowPercent);
    if (fx.slowDuration) combat.slowDuration = Math.max(combat.slowDuration, fx.slowDuration);
    if (fx.splashFalloff !== undefined) combat.splashFalloff = fx.splashFalloff;
    if (fx.auraSlowMult) combat.auraSlow *= fx.auraSlowMult;
    if (fx.auraSlowAdd) combat.auraSlow += fx.auraSlowAdd;
    if (fx.burnDPSMult) combat.burnDPS *= fx.burnDPSMult;
    if (fx.burnDuration) combat.burnDuration = fx.burnDuration;
    if (fx.burnSpread) combat.burnSpread = fx.burnSpread;
    if (fx.burnSpreadCount) combat.burnSpreadCount = fx.burnSpreadCount;
    if (fx.burnIgnoresArmor) combat.burnIgnoresArmor = fx.burnIgnoresArmor;
    if (fx.knockbackPulse) combat.knockbackPulse = fx.knockbackPulse;
    if (fx.knockbackInterval) combat.knockbackInterval = fx.knockbackInterval;
  }

  if (prestigeMods?.towerDamageMult) {
    combat.damage *= prestigeMods.towerDamageMult;
  }

  return finalizeCombatStats(combat);
}

/** Apply support, mastery, and forge modifiers onto base combat stats. */
export function applyExternalMods(combat, mods) {
  if (!mods) return combat;

  if (mods.damageMult) combat.damage *= mods.damageMult;
  if (mods.rangeMult) combat.range *= mods.rangeMult;
  if (mods.attackSpeedMult) combat.attackSpeed *= mods.attackSpeedMult;
  if (mods.projectileSpeedMult) combat.projectileSpeedMult = mods.projectileSpeedMult;
  if (mods.critChance) combat.critChance = (combat.critChance || 0) + mods.critChance;
  if (mods.critDamageMult) combat.critDamageMult = mods.critDamageMult;
  if (mods.armorPen) combat.armorPen = (combat.armorPen || 0) + mods.armorPen;
  if (mods.burnDPSAdd) combat.burnDPS += mods.burnDPSAdd;
  if (mods.slowPercentAdd) combat.slowPercent = Math.max(combat.slowPercent, mods.slowPercentAdd);
  if (mods.chainCountAdd) combat.chainCount += Math.floor(mods.chainCountAdd);
  if (mods.chainCount) combat.chainCount += mods.chainCount;
  if (mods.splashRadiusMult) combat.splashRadius *= mods.splashRadiusMult;
  if (mods.splashFalloff !== undefined) combat.splashFalloff = mods.splashFalloff;
  if (mods.auraSlowMult) combat.auraSlow *= mods.auraSlowMult;
  if (mods.knockbackIntervalMult && combat.knockbackInterval > 0) {
    combat.knockbackInterval *= mods.knockbackIntervalMult;
  }
  if (mods.burnSpread) combat.burnSpread = mods.burnSpread;
  if (mods.burnSpreadCount) combat.burnSpreadCount = mods.burnSpreadCount;
  if (mods.burnIgnoresArmor) combat.burnIgnoresArmor = Math.max(combat.burnIgnoresArmor, mods.burnIgnoresArmor);
  if (mods.bonusShotInterval) combat.bonusShotInterval = mods.bonusShotInterval;
  if (mods.groundBurn) combat.groundBurn = mods.groundBurn;
  if (mods.burnDPS) combat.burnDPS = Math.max(combat.burnDPS, mods.burnDPS);
  if (mods.burnDuration) combat.burnDuration = Math.max(combat.burnDuration, mods.burnDuration);

  return finalizeCombatStats(combat);
}

function finalizeCombatStats(combat) {
  combat.damage = Math.round(combat.damage);
  combat.range = Math.round(combat.range * 10) / 10;
  combat.attackSpeed = Math.round(combat.attackSpeed * 100) / 100;
  combat.splashRadius = Math.round(combat.splashRadius * 10) / 10;
  combat.burnDPS = Math.round(combat.burnDPS * 10) / 10;
  combat.auraSlow = Math.min(0.65, Math.round(combat.auraSlow * 100) / 100);
  return combat;
}

/** Human-readable list of active special abilities. */
export function getTowerAbilityLabels(stats) {
  const labels = [];
  if (stats.projectileCount > 1) labels.push(`${stats.projectileCount} shots/volley`);
  if (stats.pierce > 0) labels.push(`Pierce ${stats.pierce}`);
  if (stats.chainCount > 0) labels.push(`Chain ×${stats.chainCount}`);
  if (stats.splashRadius > 0) labels.push(`Splash ${stats.splashRadius.toFixed(1)}`);
  if (stats.slowPercent > 0) labels.push(`Slow ${Math.round(stats.slowPercent * 100)}%`);
  if (stats.auraSlow > 0) labels.push(`Aura slow ${Math.round(stats.auraSlow * 100)}%`);
  if (stats.burnDPS > 0) labels.push(`Burn ${stats.burnDPS}/s`);
  if (stats.knockbackPulse > 0) labels.push('Knockback pulse');
  if (stats.burnIgnoresArmor > 0) labels.push('Burn pierces armor');
  if (stats.burnSpread > 0) labels.push('Burn spreads');
  return labels;
}
