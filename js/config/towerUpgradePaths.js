/**
 * Sequential upgrade paths per tower type.
 * Each tier is a meaningful power spike — not just minor stat bumps.
 */
/** Needle Tower — shared opener then one of three specialization paths. */
export const NEEDLE_SHARED_TIERS = [
  {
    id: 'calibrated',
    name: 'Calibrated Needles',
    cost: 45,
    description: '+20% damage; 18% chance to Expose foes',
    effects: {
      damageMult: 1.2,
      exposedChance: 0.18,
      exposedDuration: 3,
      exposedDamageBonus: 0.08,
      exposedArmorReduction: 0.05,
      focusComboEnabled: true,
    },
  },
];

export const NEEDLE_BRANCHES = {
  rapid_fire: {
    id: 'rapid_fire',
    name: 'Rapid Fire',
    description: 'High attack speed and crit chance — excels vs swarms.',
    projectileColor: '#5dffc8',
    tiers: [
      {
        id: 'rapid_cadence',
        name: 'Rapid Cadence',
        cost: 70,
        description: '+50% attack speed, slight damage trade-off',
        effects: { attackSpeedMult: 1.5, damageMult: 0.92, projectileSpeedMult: 1.15 },
      },
      {
        id: 'swift_darts',
        name: 'Swift Darts',
        cost: 110,
        description: '+35% speed & +8% crit chance',
        effects: { attackSpeedMult: 1.35, critChance: 0.08, projectileSpeedMult: 1.1 },
      },
      {
        id: 'needle_flurry',
        name: 'Needle Flurry',
        cost: 170,
        description: '+25% speed, +10% crit; +22% vs swarm foes',
        effects: { attackSpeedMult: 1.25, critChance: 0.1, swarmDamageMult: 1.22 },
      },
      {
        id: 'storm_ready',
        name: 'Storm Readiness',
        cost: 260,
        description: 'Capstone: +15% crit & faster projectiles',
        effects: { critChance: 0.07, critDamageMult: 0.25, projectileSpeedMult: 1.2, attackSpeedMult: 1.1 },
      },
    ],
  },
  marksman: {
    id: 'marksman',
    name: 'Marksman',
    description: 'Long-range precision with armor penetration vs elites.',
    projectileColor: '#ffd166',
    tiers: [
      {
        id: 'long_sight',
        name: 'Long Sight',
        cost: 70,
        description: '+28% range & +12% crit damage',
        effects: { rangeMult: 1.28, critDamageMult: 0.35, projectileSpeedMult: 1.2 },
      },
      {
        id: 'armor_breach',
        name: 'Armor Breach',
        cost: 110,
        description: '+10% armor pen & +18% elite damage',
        effects: { armorPen: 0.1, eliteDamageMult: 1.18, exposedChance: 0.06 },
      },
      {
        id: 'deadly_aim',
        name: 'Deadly Aim',
        cost: 170,
        description: '+20% range, +15% crit damage, +8% armor pen',
        effects: { rangeMult: 1.2, critDamageMult: 0.4, armorPen: 0.08, exposedDamageBonus: 0.04 },
      },
      {
        id: 'deadeye_ready',
        name: 'Deadeye Training',
        cost: 260,
        description: 'Capstone: +25% elite damage & sharper crits',
        effects: { eliteDamageMult: 1.25, critDamageMult: 0.35, armorPen: 0.06, rangeMult: 1.1 },
      },
    ],
  },
  hunter: {
    id: 'hunter',
    name: 'Hunter',
    description: 'Boss specialist with heavy single-target damage.',
    projectileColor: '#ff6b8a',
    tiers: [
      {
        id: 'big_game',
        name: 'Big Game',
        cost: 70,
        description: '+22% boss damage & faster bolts',
        effects: { bossDamageMult: 1.22, projectileSpeedMult: 1.25, damageMult: 1.08 },
      },
      {
        id: 'vital_strike',
        name: 'Vital Strike',
        cost: 110,
        description: '+18% boss damage & +12% single-target damage',
        effects: { bossDamageMult: 1.18, damageMult: 1.12, eliteDamageMult: 1.1 },
      },
      {
        id: 'predator_focus',
        name: 'Predator Focus',
        cost: 170,
        description: '+25% boss damage; focus stacks +1 max',
        effects: { bossDamageMult: 1.25, focusComboMaxBonus: 2, armorPen: 0.06 },
      },
      {
        id: 'execution_ready',
        name: 'Execution Ready',
        cost: 260,
        description: 'Capstone: +30% boss/elite damage & piercing shots',
        effects: { bossDamageMult: 1.3, eliteDamageMult: 1.2, damageMult: 1.1, projectileSpeedMult: 1.15 },
      },
    ],
  },
};

export const NEEDLE_MAX_UPGRADE_TIER = 5;

export function getNeedleResolvedTiers(upgradeTier, branch) {
  const tiers = [];
  if (upgradeTier >= 1) tiers.push(NEEDLE_SHARED_TIERS[0]);
  if (upgradeTier >= 2 && branch && NEEDLE_BRANCHES[branch]) {
    const branchTiers = NEEDLE_BRANCHES[branch].tiers;
    const branchCount = Math.min(upgradeTier - 1, branchTiers.length);
    tiers.push(...branchTiers.slice(0, branchCount));
  }
  return tiers;
}

export function getNeedleNextUpgrade(upgradeTier, branch) {
  if (upgradeTier >= NEEDLE_MAX_UPGRADE_TIER) return null;
  if (upgradeTier === 0) return NEEDLE_SHARED_TIERS[0];
  if (upgradeTier === 1 && !branch) return null;
  if (!branch) return null;
  const branchTiers = NEEDLE_BRANCHES[branch]?.tiers;
  if (!branchTiers) return null;
  const nextIndex = upgradeTier - 1;
  return nextIndex < branchTiers.length ? branchTiers[nextIndex] : null;
}

export function getNeedleBranchEntryUpgrade(branch) {
  return NEEDLE_BRANCHES[branch]?.tiers[0] ?? null;
}

export function getNeedlePurchasedTierNames(upgradeTier, branch) {
  const names = [];
  if (upgradeTier >= 1) names.push(NEEDLE_SHARED_TIERS[0].name);
  if (branch && upgradeTier >= 2) {
    const branchTiers = NEEDLE_BRANCHES[branch].tiers;
    const count = Math.min(upgradeTier - 1, branchTiers.length);
    for (let i = 0; i < count; i++) names.push(branchTiers[i].name);
  }
  return names;
}

export const TOWER_UPGRADE_PATHS = {
  needle: [],

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

  thorn: [
    {
      id: 'barbed_tips',
      name: 'Barbed Tips',
      cost: 52,
      description: '+8% armor pen; bolts pierce 1 foe',
      effects: { armorPen: 0.08, pierce: 1 },
    },
    {
      id: 'hunter_mark',
      name: "Hunter's Mark",
      cost: 78,
      description: '+20% boss damage & +15% elite damage',
      effects: { bossDamageMult: 1.2, eliteDamageMult: 1.15 },
    },
    {
      id: 'heavy_draw',
      name: 'Heavy Draw',
      cost: 118,
      description: '+50% bolt damage',
      effects: { damageMult: 1.5 },
    },
    {
      id: 'armor_rend',
      name: 'Armor Rend',
      cost: 178,
      description: '+10% armor pen; pierce 2 more foes',
      effects: { armorPen: 0.1, pierce: 2 },
    },
    {
      id: 'thorn_capstone',
      name: 'Bramble Lord',
      cost: 270,
      description: 'Capstone: +25% boss/elite damage, crits vs heavies',
      effects: {
        bossDamageMult: 1.25,
        eliteDamageMult: 1.2,
        critChance: 0.12,
        critDamageMult: 0.5,
        attackSpeedMult: 1.2,
      },
    },
  ],

  frost: [
    {
      id: 'deep_freeze',
      name: 'Deep Freeze',
      cost: 48,
      description: '+48% slow strength & +0.8s slow duration',
      effects: { slowPercent: 0.48, slowDuration: 2.8 },
    },
    {
      id: 'winter_field',
      name: 'Winter Field',
      cost: 72,
      description: '+35% aura slow & +20% range',
      effects: { auraSlowMult: 1.35, rangeMult: 1.2 },
    },
    {
      id: 'rime_coating',
      name: 'Rime Coating',
      cost: 110,
      description: '+25% direct damage (still low DPS)',
      effects: { damageMult: 1.25 },
    },
    {
      id: 'permafrost',
      name: 'Permafrost',
      cost: 168,
      description: '+12% aura slow; hits slow 52% for 3.2s',
      effects: { auraSlowAdd: 0.12, slowPercent: 0.52, slowDuration: 3.2 },
    },
    {
      id: 'shatter',
      name: 'Shatter',
      cost: 255,
      description: 'Capstone: +58% slow, crits vs chilled foes',
      effects: {
        slowPercent: 0.58,
        auraSlowAdd: 0.15,
        critChance: 0.18,
        critDamageMult: 0.75,
        rangeMult: 1.15,
      },
    },
  ],
};

function applyTierEffects(combat, fx, towerDef) {
  if (fx.damageMult) combat.damage *= fx.damageMult;
  if (fx.rangeMult) combat.range *= fx.rangeMult;
  if (fx.attackSpeedMult) combat.attackSpeed *= fx.attackSpeedMult;
  if (fx.splashRadiusMult) combat.splashRadius *= fx.splashRadiusMult;
  if (fx.projectileCount) combat.projectileCount = fx.projectileCount;
  if (fx.pierce) combat.pierce += fx.pierce;
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
  if (fx.armorPen) combat.armorPen += fx.armorPen;
  if (fx.bossDamageMult) combat.bossDamageMult *= fx.bossDamageMult;
  if (fx.eliteDamageMult) combat.eliteDamageMult *= fx.eliteDamageMult;
  if (fx.critChance) combat.critChance += fx.critChance;
  if (fx.critDamageMult) combat.critDamageMult += fx.critDamageMult;
  if (fx.frostPulseSlow) combat.frostPulseSlow = Math.max(combat.frostPulseSlow, fx.frostPulseSlow);
  if (fx.frostPulseInterval) combat.frostPulseInterval = fx.frostPulseInterval;
  if (fx.frostPulseDuration) combat.frostPulseDuration = fx.frostPulseDuration;
  if (fx.projectileSpeedMult) {
    combat.projectileSpeedMult = (combat.projectileSpeedMult || 1) * fx.projectileSpeedMult;
  }
  if (fx.projectileColor) combat.projectileColor = fx.projectileColor;
  if (fx.exposedChance) combat.exposedChance = (combat.exposedChance || 0) + fx.exposedChance;
  if (fx.exposedDuration) combat.exposedDuration = Math.max(combat.exposedDuration || 0, fx.exposedDuration);
  if (fx.exposedDamageBonus) combat.exposedDamageBonus = (combat.exposedDamageBonus || 0) + fx.exposedDamageBonus;
  if (fx.exposedArmorReduction) {
    combat.exposedArmorReduction = (combat.exposedArmorReduction || 0) + fx.exposedArmorReduction;
  }
  if (fx.swarmDamageMult) combat.swarmDamageMult = (combat.swarmDamageMult || 1) * fx.swarmDamageMult;
  if (fx.focusComboEnabled) combat.focusComboEnabled = true;
  if (fx.focusComboMaxBonus) combat.focusComboMax = (combat.focusComboMax || 5) + fx.focusComboMaxBonus;
  if (fx.needleStormCooldown) combat.needleStormCooldown = fx.needleStormCooldown;
  if (fx.needleStormDuration) combat.needleStormDuration = fx.needleStormDuration;
  if (fx.needleStormSpeedMult) combat.needleStormSpeedMult = fx.needleStormSpeedMult;
  if (fx.deadeyeInterval) combat.deadeyeInterval = fx.deadeyeInterval;
  if (fx.executionShotInterval) combat.executionShotInterval = fx.executionShotInterval;
  if (fx.executionShotDamageMult) combat.executionShotDamageMult = fx.executionShotDamageMult;
}

/** Merge all purchased tier effects into combat stats. */
export function computeTowerStats(towerDef, upgradeTier, path, prestigeMods = null, branch = null) {
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
    armorPen: base.armorPen || 0,
    bossDamageMult: base.bossDamageMult || 1,
    eliteDamageMult: base.eliteDamageMult || 1,
    critChance: base.critChance || 0,
    critDamageMult: base.critDamageMult || 1.5,
    frostPulseSlow: 0,
    frostPulseInterval: 0,
    frostPulseDuration: 0,
    isAuraTower: towerDef.isAuraTower || false,
    focusComboMax: 5,
    focusComboDamagePerStack: 0.03,
    focusComboCritPerStack: 0.02,
    focusComboArmorPenPerStack: 0.01,
    projectileColor: towerDef.projectileColor,
  };

  const tiers = towerDef.id === 'needle'
    ? getNeedleResolvedTiers(upgradeTier, branch)
    : path.slice(0, upgradeTier);

  for (const tier of tiers) {
    if (!tier?.effects) continue;
    applyTierEffects(combat, tier.effects, towerDef);
  }

  if (branch && towerDef.id === 'needle' && NEEDLE_BRANCHES[branch]?.projectileColor) {
    combat.projectileColor = NEEDLE_BRANCHES[branch].projectileColor;
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
  if (mods.slowDurationMult && combat.slowDuration > 0) {
    combat.slowDuration *= mods.slowDurationMult;
  }
  if (mods.chainCountAdd) combat.chainCount += Math.floor(mods.chainCountAdd);
  if (mods.chainCount) combat.chainCount += mods.chainCount;
  if (mods.splashRadiusMult) combat.splashRadius *= mods.splashRadiusMult;
  if (mods.splashFalloff !== undefined) combat.splashFalloff = mods.splashFalloff;
  if (mods.auraSlowMult) combat.auraSlow *= mods.auraSlowMult;
  if (mods.auraSlowAdd) combat.auraSlow += mods.auraSlowAdd;
  if (mods.auraSlow) combat.auraSlow = Math.max(combat.auraSlow, mods.auraSlow);
  if (mods.slowPercent) combat.slowPercent = Math.max(combat.slowPercent, mods.slowPercent);
  if (mods.slowDuration) combat.slowDuration = Math.max(combat.slowDuration, mods.slowDuration);
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
  if (mods.pierce) combat.pierce = (combat.pierce || 0) + mods.pierce;
  if (mods.bossDamageMult) combat.bossDamageMult = (combat.bossDamageMult ?? 1) * mods.bossDamageMult;
  if (mods.eliteDamageMult) combat.eliteDamageMult = (combat.eliteDamageMult ?? 1) * mods.eliteDamageMult;
  if (mods.frostPulseSlow) combat.frostPulseSlow = Math.max(combat.frostPulseSlow ?? 0, mods.frostPulseSlow);
  if (mods.frostPulseInterval) combat.frostPulseInterval = mods.frostPulseInterval;
  if (mods.frostPulseDuration) combat.frostPulseDuration = mods.frostPulseDuration;
  if (mods.exposedChance) combat.exposedChance = (combat.exposedChance || 0) + mods.exposedChance;
  if (mods.swarmDamageMult) combat.swarmDamageMult = (combat.swarmDamageMult || 1) * mods.swarmDamageMult;
  if (mods.needleStormCooldown) combat.needleStormCooldown = mods.needleStormCooldown;
  if (mods.needleStormDuration) combat.needleStormDuration = mods.needleStormDuration;
  if (mods.needleStormSpeedMult) combat.needleStormSpeedMult = mods.needleStormSpeedMult;
  if (mods.deadeyeInterval) combat.deadeyeInterval = mods.deadeyeInterval;
  if (mods.executionShotInterval) combat.executionShotInterval = mods.executionShotInterval;
  if (mods.executionShotDamageMult) combat.executionShotDamageMult = mods.executionShotDamageMult;
  if (mods.exposedChance) combat.exposedChance = (combat.exposedChance || 0) + mods.exposedChance;

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
  if (stats.armorPen > 0) labels.push(`Armor pen ${Math.round(stats.armorPen * 100)}%`);
  if (stats.bossDamageMult > 1) labels.push(`Boss dmg ×${stats.bossDamageMult.toFixed(2)}`);
  if (stats.eliteDamageMult > 1) labels.push(`Elite dmg ×${stats.eliteDamageMult.toFixed(2)}`);
  if (stats.critChance > 0) labels.push(`Crit ${Math.round(stats.critChance * 100)}%`);
  if (stats.frostPulseSlow > 0) labels.push('Frost pulse');
  if (stats.exposedChance > 0) labels.push(`Expose ${Math.round(stats.exposedChance * 100)}%`);
  if (stats.focusComboEnabled) labels.push('Focus combo');
  if (stats.swarmDamageMult > 1) labels.push(`Swarm ×${stats.swarmDamageMult.toFixed(2)}`);
  if (stats.needleStormCooldown) labels.push('Needle Storm');
  if (stats.deadeyeInterval) labels.push('Deadeye');
  if (stats.executionShotInterval) labels.push('Execution Shot');
  return labels;
}
