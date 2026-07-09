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

  /** Colors for bright, clean visuals. */
  colors: {
    background: '#e8f4f8',
    path: '#d4a574',
    pathBorder: '#b8895a',
    buildSpot: '#c8e6c9',
    buildSpotHover: '#a5d6a7',
    gridLine: '#dceef2',
    text: '#2c3e50',
    gold: '#f1c40f',
    lives: '#e74c3c',
    wave: '#3498db',
    income: '#27ae60',
    selection: '#9b59b6',
    enemy: '#e67e22',
    projectile: '#f39c12',
  },
};

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
];
