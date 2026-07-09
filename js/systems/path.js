import { CELL_SIZE, GRID_COLS, GRID_ROWS } from '../config/constants.js';

/**
 * Single enemy path defined as grid cell coordinates.
 * Enemies follow waypoints in order; extend by appending cells.
 */
const PATH_CELLS = [
  [0, 5], [1, 5], [2, 5], [3, 5], [4, 5],
  [4, 4], [4, 3], [4, 2],
  [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2],
  [10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [10, 8],
  [11, 8], [12, 8], [13, 8], [14, 8], [15, 8],
  [15, 7], [15, 6], [15, 5],
  [16, 5], [17, 5], [18, 5], [19, 5],
];

export class PathSystem {
  constructor() {
    this.pathSet = new Set(PATH_CELLS.map(([c, r]) => `${c},${r}`));
    this.waypoints = this.#buildWaypoints();
  }

  #buildWaypoints() {
    return PATH_CELLS.map(([col, row]) => ({
      x: col * CELL_SIZE + CELL_SIZE / 2,
      y: row * CELL_SIZE + CELL_SIZE / 2,
    }));
  }

  isPathCell(col, row) {
    return this.pathSet.has(`${col},${row}`);
  }

  isValidBuildCell(col, row) {
    return col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS && !this.isPathCell(col, row);
  }

  getWaypoints() {
    return this.waypoints;
  }

  getSpawnPoint() {
    return { ...this.waypoints[0] };
  }

  getEndPoint() {
    return { ...this.waypoints[this.waypoints.length - 1] };
  }

  draw(ctx) {
    ctx.save();

    for (const [col, row] of PATH_CELLS) {
      const x = col * CELL_SIZE;
      const y = row * CELL_SIZE;
      ctx.fillStyle = '#d4a574';
      ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      ctx.strokeStyle = '#c4956a';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    }

    ctx.restore();
  }
}
