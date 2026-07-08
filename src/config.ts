export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

export const COMMANDER = {
  speed: 180,
  maxHealth: 80,
  radius: 14,
  color: 0x4a9eff,
  attackDamage: 4,
  attackRange: 50,
  attackCooldown: 800,
};

export const COMPANION = {
  speed: 200,
  maxHealth: 150,
  radius: 18,
  color: 0xffd166,
  attackDamage: 18,
  attackRange: 70,
  attackCooldown: 600,
  followDistance: 60,
};

export const ENEMY = {
  speed: 90,
  maxHealth: 40,
  radius: 12,
  color: 0xe63946,
  attackDamage: 8,
  attackRange: 40,
  attackCooldown: 1000,
  contactDamage: 5,
};

export const SYNERGY = {
  bondRadius: 120,
  damageBonus: 0.15,
  damageReduction: 0.1,
};

export const SURVIVAL_DURATION_MS = 90_000;

export const WAVE_CONFIG = {
  initialDelay: 3000,
  waveInterval: 12000,
  baseEnemyCount: 3,
  enemiesPerWave: 2,
  maxEnemiesAlive: 25,
  spawnRadius: 420,
};
