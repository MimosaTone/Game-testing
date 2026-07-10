/**
 * World Threat Tier — scales danger and rewards with lifetime prestiges.
 * Players grow stronger through Prestige; the world evolves alongside them.
 */

export const WORLD_TIERS = [
  {
    tier: 1,
    minPrestiges: 0,
    roman: 'I',
    name: 'Peaceful Meadows',
    subtitle: 'The meadow rests easy.',
    rewardBonus: 0,
    enemyHealthMult: 1,
    enemySpeedMult: 1,
    eliteSpawnMult: 1,
    specialWaveOffset: 0,
    enemyTraitChance: 0,
    ancientChance: 0,
    legendaryChance: 0,
    bossExtraMechanic: false,
    bossRandomModifier: false,
    eliteBossChance: 0,
    multiPhaseBoss: false,
    coordinatedWaves: false,
    features: ['Basic enemies', 'Standard bosses', 'Normal rewards'],
  },
  {
    tier: 2,
    minPrestiges: 5,
    roman: 'II',
    name: 'Rising Threat',
    subtitle: 'The invaders learn new tricks.',
    rewardBonus: 0.15,
    enemyHealthMult: 1.08,
    enemySpeedMult: 1.04,
    eliteSpawnMult: 1.35,
    specialWaveOffset: 1,
    enemyTraitChance: 0.12,
    ancientChance: 0,
    legendaryChance: 0,
    bossExtraMechanic: true,
    bossRandomModifier: false,
    eliteBossChance: 0,
    multiPhaseBoss: false,
    coordinatedWaves: false,
    features: ['Enemies gain traits', 'More elite spawns', 'Bosses gain an extra mechanic', '+15% rewards'],
  },
  {
    tier: 3,
    minPrestiges: 10,
    roman: 'III',
    name: 'Corrupted Lands',
    subtitle: 'Dark variants stalk the path.',
    rewardBonus: 0.35,
    enemyHealthMult: 1.15,
    enemySpeedMult: 1.08,
    eliteSpawnMult: 1.6,
    specialWaveOffset: 2,
    enemyTraitChance: 0.2,
    ancientChance: 0,
    legendaryChance: 0,
    bossExtraMechanic: true,
    bossRandomModifier: true,
    eliteBossChance: 0,
    multiPhaseBoss: false,
    coordinatedWaves: false,
    features: ['More enemy variants', 'Special waves more common', 'Random boss modifiers', '+35% rewards'],
  },
  {
    tier: 4,
    minPrestiges: 20,
    roman: 'IV',
    name: 'Ancient Awakening',
    subtitle: 'Old powers stir beneath the soil.',
    rewardBonus: 0.6,
    enemyHealthMult: 1.22,
    enemySpeedMult: 1.12,
    eliteSpawnMult: 1.85,
    specialWaveOffset: 3,
    enemyTraitChance: 0.28,
    ancientChance: 0.35,
    legendaryChance: 0,
    bossExtraMechanic: true,
    bossRandomModifier: true,
    eliteBossChance: 0.2,
    multiPhaseBoss: false,
    coordinatedWaves: false,
    features: ['Ancient enemies appear', 'World Events unlock', 'Elite bosses spawn', '+60% rewards'],
  },
  {
    tier: 5,
    minPrestiges: 40,
    roman: 'V',
    name: 'Endless War',
    subtitle: 'Every wave is a siege.',
    rewardBonus: 1.0,
    enemyHealthMult: 1.3,
    enemySpeedMult: 1.16,
    eliteSpawnMult: 2.1,
    specialWaveOffset: 4,
    enemyTraitChance: 0.35,
    ancientChance: 0.5,
    legendaryChance: 0.25,
    bossExtraMechanic: true,
    bossRandomModifier: true,
    eliteBossChance: 0.35,
    multiPhaseBoss: true,
    coordinatedWaves: true,
    features: ['Multi-phase bosses', 'Coordinated formations', 'Legendary enemies', '+100% rewards'],
  },
  {
    tier: 6,
    minPrestiges: 60,
    roman: 'VI',
    name: 'Cataclysm',
    subtitle: 'Maximum danger. Maximum glory.',
    rewardBonus: 1.5,
    enemyHealthMult: 1.38,
    enemySpeedMult: 1.2,
    eliteSpawnMult: 2.5,
    specialWaveOffset: 5,
    enemyTraitChance: 0.45,
    ancientChance: 0.7,
    legendaryChance: 0.4,
    bossExtraMechanic: true,
    bossRandomModifier: true,
    eliteBossChance: 0.5,
    multiPhaseBoss: true,
    coordinatedWaves: true,
    features: ['All systems active', 'Exclusive enemies & rewards', 'Cataclysm world events', 'Maximum rewards'],
  },
];

/** Extra boss mechanics unlocked at Tier II+. */
export const BOSS_TIER_MECHANICS = ['enrage', 'armored', 'regen_burst'];

/** Random boss modifiers unlocked at Tier III+. */
export const BOSS_TIER_MODIFIERS = ['frenzy', 'armored', 'splitting'];

/** Traits applied to regular enemies at higher tiers. */
export const ENEMY_TIER_TRAITS = ['resilient', 'swift', 'armored'];

export function getWorldTier(totalPrestiges) {
  let current = WORLD_TIERS[0];
  for (const tier of WORLD_TIERS) {
    if (totalPrestiges >= tier.minPrestiges) current = tier;
    else break;
  }
  return current;
}

export function getNextWorldTier(totalPrestiges) {
  for (const tier of WORLD_TIERS) {
    if (totalPrestiges < tier.minPrestiges) return tier;
  }
  return null;
}

/** Runtime effect bundle passed to wave generation and combat. */
export function getWorldTierEffects(totalPrestiges) {
  const tier = getWorldTier(totalPrestiges);
  return {
    tier: tier.tier,
    roman: tier.roman,
    name: tier.name,
    subtitle: tier.subtitle,
    rewardBonus: tier.rewardBonus,
    enemyHealthMult: tier.enemyHealthMult,
    enemySpeedMult: tier.enemySpeedMult,
    eliteSpawnMult: tier.eliteSpawnMult,
    specialWaveOffset: tier.specialWaveOffset,
    enemyTraitChance: tier.enemyTraitChance,
    ancientChance: tier.ancientChance,
    legendaryChance: tier.legendaryChance,
    bossExtraMechanic: tier.bossExtraMechanic,
    bossRandomModifier: tier.bossRandomModifier,
    eliteBossChance: tier.eliteBossChance,
    multiPhaseBoss: tier.multiPhaseBoss,
    coordinatedWaves: tier.coordinatedWaves,
    features: tier.features,
  };
}

export function getWorldTierRewardMult(totalPrestiges) {
  return 1 + getWorldTier(totalPrestiges).rewardBonus;
}
