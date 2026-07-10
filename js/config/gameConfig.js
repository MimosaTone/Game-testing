/** Global balance and layout constants. */
export const GAME_CONFIG = {
  canvasWidth: 960,
  canvasHeight: 600,
  tileSize: 40,
  gridCols: 24,
  gridRows: 15,

  startingGold: 180,
  startingLives: 25,

  /** Gold awarded per enemy kill (scaled by enemy type). */
  killGoldMultiplier: 1,

  /** Milliseconds between combat ticks. */
  combatTickMs: 50,

  /** Muted meadow palette — easy on the eyes. */
  colors: {
    background: '#b8c9c3',
    path: '#a08060',
    pathBorder: '#7d6348',
    buildSpot: '#8faa96',
    buildSpotHover: '#7a9a86',
    gridLine: '#a8bab4',
    text: '#2c3e50',
    gold: '#c9a227',
    lives: '#c0392b',
    wave: '#4a7ba7',
    income: '#3d8c5a',
    selection: '#7d6b9e',
    enemy: '#c06030',
    projectile: '#c08028',
    terrainGrass: '#a8bdb5',
    terrainMeadow: '#9cb5ac',
    terrainFlower: '#b8a0c8',
    terrainStone: '#9aa5a0',
    buildSpotRing: 'rgba(143, 170, 150, 0.55)',
    buildSpotFill: 'rgba(120, 155, 130, 0.35)',
  },
};

/** Decorative non-buildable terrain accents (grid coordinates). */
export const DECORATIVE_TILES = [
  { x: 0, y: 0, type: 'flower' }, { x: 1, y: 0, type: 'grass' },
  { x: 23, y: 0, type: 'flower' }, { x: 22, y: 1, type: 'grass' },
  { x: 0, y: 14, type: 'grass' }, { x: 23, y: 14, type: 'flower' },
  { x: 22, y: 14, type: 'stone' }, { x: 1, y: 14, type: 'meadow' },
  { x: 7, y: 0, type: 'flower' }, { x: 16, y: 0, type: 'meadow' },
  { x: 7, y: 14, type: 'grass' }, { x: 16, y: 14, type: 'flower' },
  { x: 2, y: 1, type: 'meadow' }, { x: 21, y: 1, type: 'meadow' },
  { x: 2, y: 13, type: 'flower' }, { x: 21, y: 13, type: 'grass' },
];

/** Waypoints define the single enemy path (grid coordinates). */
export const PATH_WAYPOINTS = [
  { x: 0, y: 7 },
  { x: 3, y: 7 },
  { x: 3, y: 4 },
  { x: 7, y: 4 },
  { x: 7, y: 8 },
  { x: 5, y: 8 },
  { x: 5, y: 11 },
  { x: 9, y: 11 },
  { x: 9, y: 7 },
  { x: 9, y: 3 },
  { x: 13, y: 3 },
  { x: 13, y: 7 },
  { x: 11, y: 7 },
  { x: 11, y: 10 },
  { x: 14, y: 10 },
  { x: 14, y: 13 },
  { x: 17, y: 13 },
  { x: 17, y: 9 },
  { x: 15, y: 9 },
  { x: 15, y: 6 },
  { x: 18, y: 6 },
  { x: 18, y: 3 },
  { x: 21, y: 3 },
  { x: 21, y: 7 },
  { x: 21, y: 11 },
  { x: 23, y: 11 },
];

/** Grid cells where towers and farms can be placed. */
export const BUILD_SPOTS = [
  // Upper loop — north of entry bend
  { x: 9, y: 2 }, { x: 10, y: 2 }, { x: 11, y: 2 }, { x: 12, y: 2 }, { x: 13, y: 2 },
  { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 }, { x: 7, y: 3 }, { x: 8, y: 3 },
  { x: 14, y: 3 }, { x: 19, y: 4 }, { x: 20, y: 4 }, { x: 22, y: 2 }, { x: 23, y: 3 },
  // Left flank clusters
  { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 4 }, { x: 2, y: 5 }, { x: 2, y: 6 },
  { x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 },
  { x: 0, y: 10 }, { x: 1, y: 10 }, { x: 0, y: 12 }, { x: 1, y: 12 },
  // West switchback pockets
  { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 8, y: 4 }, { x: 8, y: 5 },
  { x: 4, y: 6 }, { x: 6, y: 6 }, { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 },
  { x: 4, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 },
  { x: 4, y: 10 }, { x: 6, y: 10 }, { x: 7, y: 10 }, { x: 8, y: 10 },
  { x: 4, y: 11 }, { x: 5, y: 12 }, { x: 6, y: 12 }, { x: 7, y: 12 }, { x: 8, y: 12 }, { x: 9, y: 12 },
  // Center serpentine — between bends
  { x: 8, y: 6 }, { x: 10, y: 4 }, { x: 10, y: 5 }, { x: 10, y: 6 }, { x: 10, y: 7 },
  { x: 11, y: 4 }, { x: 12, y: 4 }, { x: 12, y: 5 }, { x: 12, y: 6 }, { x: 12, y: 8 }, { x: 13, y: 8 },
  { x: 8, y: 7 }, { x: 8, y: 8 }, { x: 10, y: 8 }, { x: 10, y: 9 }, { x: 10, y: 10 }, { x: 10, y: 11 },
  { x: 11, y: 11 }, { x: 12, y: 11 }, { x: 13, y: 11 },
  // East switchback & exit approach
  { x: 14, y: 4 }, { x: 14, y: 5 }, { x: 14, y: 6 }, { x: 14, y: 7 },
  { x: 15, y: 10 }, { x: 15, y: 11 }, { x: 15, y: 12 }, { x: 16, y: 7 }, { x: 16, y: 8 }, { x: 16, y: 10 }, { x: 16, y: 12 },
  { x: 17, y: 5 }, { x: 19, y: 4 }, { x: 20, y: 4 }, { x: 19, y: 6 }, { x: 20, y: 6 },
  // Right flank clusters
  { x: 22, y: 4 }, { x: 22, y: 5 }, { x: 22, y: 6 }, { x: 22, y: 7 }, { x: 22, y: 9 }, { x: 22, y: 10 },
  { x: 23, y: 5 }, { x: 23, y: 7 }, { x: 23, y: 9 }, { x: 23, y: 12 }, { x: 23, y: 13 },
];

/** Additional build tiles unlocked via gold investment during a run. */
export const BUILD_EXPANSION_POOL = [
  { x: 1, y: 5 }, { x: 1, y: 9 }, { x: 1, y: 11 },
  { x: 7, y: 10 }, { x: 11, y: 6 }, { x: 13, y: 4 },
  { x: 15, y: 8 }, { x: 17, y: 8 }, { x: 18, y: 8 },
  { x: 19, y: 8 }, { x: 20, y: 8 }, { x: 20, y: 12 },
  { x: 21, y: 8 }, { x: 21, y: 10 }, { x: 14, y: 2 },
  { x: 15, y: 3 }, { x: 18, y: 11 }, { x: 2, y: 11 },
];

/** Shown in UI — bump when shipping gameplay/config changes. */
export const BUILD_VERSION = '2026.07.10l';
