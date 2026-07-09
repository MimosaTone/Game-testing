import { PATH_WAYPOINTS, GAME_CONFIG } from '../config/gameConfig.js';

/**
 * Converts grid waypoints to pixel coordinates and provides path utilities.
 */
export class Path {
  constructor() {
    this.waypoints = PATH_WAYPOINTS.map((wp) => this.gridToPixel(wp));
    this.segments = this._buildSegments();
    this.totalLength = this.segments.reduce((sum, s) => sum + s.length, 0);
  }

  gridToPixel({ x, y }) {
    const half = GAME_CONFIG.tileSize / 2;
    return {
      x: x * GAME_CONFIG.tileSize + half,
      y: y * GAME_CONFIG.tileSize + half,
    };
  }

  pixelToGrid(px, py) {
    return {
      x: Math.floor(px / GAME_CONFIG.tileSize),
      y: Math.floor(py / GAME_CONFIG.tileSize),
    };
  }

  _buildSegments() {
    const segments = [];
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const from = this.waypoints[i];
      const to = this.waypoints[i + 1];
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy);
      segments.push({ from, to, length, dx, dy });
    }
    return segments;
  }

  /** Get pixel position at distance along path (0 to totalLength). */
  getPositionAt(distance) {
    let remaining = distance;
    for (const seg of this.segments) {
      if (remaining <= seg.length) {
        const t = remaining / seg.length;
        return {
          x: seg.from.x + seg.dx * t,
          y: seg.from.y + seg.dy * t,
        };
      }
      remaining -= seg.length;
    }
    const last = this.waypoints[this.waypoints.length - 1];
    return { x: last.x, y: last.y };
  }

  /** Get path cells for rendering. */
  getPathCells() {
    const cells = new Set();
    for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
      const a = PATH_WAYPOINTS[i];
      const b = PATH_WAYPOINTS[i + 1];
      if (a.x === b.x) {
        const minY = Math.min(a.y, b.y);
        const maxY = Math.max(a.y, b.y);
        for (let y = minY; y <= maxY; y++) {
          cells.add(`${a.x},${y}`);
        }
      } else {
        const minX = Math.min(a.x, b.x);
        const maxX = Math.max(a.x, b.x);
        for (let x = minX; x <= maxX; x++) {
          cells.add(`${x},${a.y}`);
        }
      }
    }
    return cells;
  }
}
