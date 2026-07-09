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
  { x: 4, y: 7 },
  { x: 4, y: 3 },
  { x: 10, y: 3 },
  { x: 10, y: 11 },
  { x: 16, y: 11 },
  { x: 16, y: 5 },
  { x: 23, y: 5 },
];

/** Grid cells where towers and farms can be placed. */
export const BUILD_SPOTS = [
  { x: 2, y: 5 }, { x: 2, y: 9 }, { x: 3, y: 6 }, { x: 3, y: 8 },
  { x: 5, y: 2 }, { x: 5, y: 4 }, { x: 6, y: 2 }, { x: 6, y: 4 },
  { x: 7, y: 5 }, { x: 8, y: 2 }, { x: 8, y: 5 }, { x: 9, y: 5 },
  { x: 11, y: 9 }, { x: 11, y: 13 }, { x: 12, y: 9 }, { x: 12, y: 13 },
  { x: 13, y: 10 }, { x: 14, y: 13 }, { x: 15, y: 7 }, { x: 15, y: 13 },
  { x: 17, y: 3 }, { x: 17, y: 7 }, { x: 18, y: 3 }, { x: 18, y: 7 },
  { x: 19, y: 5 }, { x: 20, y: 3 }, { x: 20, y: 7 }, { x: 21, y: 5 },
  // Additional placement locations
  { x: 1, y: 7 }, { x: 3, y: 4 }, { x: 3, y: 10 }, { x: 5, y: 6 },
  { x: 7, y: 3 }, { x: 7, y: 8 }, { x: 9, y: 2 }, { x: 9, y: 8 },
  { x: 11, y: 5 }, { x: 11, y: 11 }, { x: 13, y: 7 }, { x: 13, y: 12 },
  { x: 15, y: 4 }, { x: 15, y: 10 }, { x: 17, y: 5 }, { x: 17, y: 9 },
  { x: 19, y: 3 }, { x: 19, y: 7 }, { x: 21, y: 3 }, { x: 21, y: 7 },
  { x: 6, y: 9 }, { x: 8, y: 11 }, { x: 14, y: 5 }, { x: 16, y: 8 },
  // Flank clusters — left and right of path (path unchanged)
  { x: 0, y: 2 }, { x: 0, y: 4 }, { x: 0, y: 10 }, { x: 0, y: 12 },
  { x: 1, y: 2 }, { x: 1, y: 11 }, { x: 1, y: 13 },
  { x: 22, y: 2 }, { x: 22, y: 8 }, { x: 22, y: 12 },
  { x: 23, y: 2 }, { x: 23, y: 9 }, { x: 23, y: 13 },
  { x: 5, y: 8 }, { x: 5, y: 10 }, { x: 6, y: 7 },
  { x: 18, y: 6 }, { x: 18, y: 9 }, { x: 21, y: 9 },
  { x: 12, y: 2 }, { x: 13, y: 2 }, { x: 12, y: 6 },
  { x: 14, y: 8 }, { x: 14, y: 11 }, { x: 8, y: 8 },
  { x: 9, y: 11 }, { x: 20, y: 11 }, { x: 20, y: 9 },
];
