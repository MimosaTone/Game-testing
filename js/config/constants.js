/** Shared game constants and grid layout. */
export const CELL_SIZE = 48;
export const GRID_COLS = 20;
export const GRID_ROWS = 12;
export const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
export const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;

export const STARTING_GOLD = 120;
export const STARTING_LIVES = 20;

/** Game phases — between waves is unlimited planning time. */
export const Phase = {
  PLANNING: 'planning',
  WAVE: 'wave',
  GAME_OVER: 'game_over',
  VICTORY: 'victory',
};

/** Building categories for the placement system. */
export const BuildingCategory = {
  TOWER: 'tower',
  FARM: 'farm',
};
