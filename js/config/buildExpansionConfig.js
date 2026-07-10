import { PATH_WAYPOINTS, BUILD_SPOTS, GAME_CONFIG } from './gameConfig.js';

/** Combat and economy bonus for structures on pathside expansion tiles. */
export const PATHSIDE_EXPANSION_BONUS = {
  damageMult: 1.1,
  rangeMult: 1.08,
  farmIncomeMult: 1.12,
};

/** Build tiles unlocked via gold investment — must hug the enemy path. */
export const BUILD_EXPANSION_POOL = buildExpansionPool();

function buildPathCellData() {
  const cells = new Set();
  const order = new Map();
  let index = 0;

  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const a = PATH_WAYPOINTS[i];
    const b = PATH_WAYPOINTS[i + 1];
    if (a.x === b.x) {
      const minY = Math.min(a.y, b.y);
      const maxY = Math.max(a.y, b.y);
      for (let y = minY; y <= maxY; y++) {
        const key = `${a.x},${y}`;
        if (!cells.has(key)) {
          cells.add(key);
          order.set(key, index++);
        }
      }
    } else {
      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      for (let x = minX; x <= maxX; x++) {
        const key = `${x},${a.y}`;
        if (!cells.has(key)) {
          cells.add(key);
          order.set(key, index++);
        }
      }
    }
  }

  return { cells, order };
}

function countPathNeighbors(x, y, pathCells) {
  let count = 0;
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    if (pathCells.has(`${x + dx},${y + dy}`)) count++;
  }
  return count;
}

function nearestPathIndex(x, y, pathCells, pathOrder) {
  let best = Infinity;
  let bestIdx = 0;
  for (const key of pathCells) {
    const [px, py] = key.split(',').map(Number);
    const dist = Math.abs(px - x) + Math.abs(py - y);
    if (dist < best) {
      best = dist;
      bestIdx = pathOrder.get(key) ?? 0;
    }
  }
  return bestIdx;
}

function nameForSpot(x, y, pathAdj) {
  if (y <= 3) return pathAdj >= 2 ? 'High Bend Terrace' : 'North Outlook';
  if (x <= 4) return pathAdj >= 2 ? 'West Corner Post' : 'West Flank';
  if (x >= 19) return pathAdj >= 2 ? 'Exit Chokepoint' : 'Final Approach';
  if (x >= 14 && y >= 10) return 'South Rampart';
  if (pathAdj >= 2) return 'Serpentine Bend';
  if (y >= 9) return 'Lower Watch';
  if (x >= 11 && x <= 16) return 'Central Overlook';
  return 'Pathside Post';
}

function scoreCandidate(x, y, pathCells, baseSpots, pathOrder) {
  const key = `${x},${y}`;
  if (pathCells.has(key) || baseSpots.has(key)) return null;

  const pathAdj = countPathNeighbors(x, y, pathCells);
  if (pathAdj === 0) return null;

  let score = pathAdj * 30;
  if (pathAdj >= 2) score += 25;

  const pathIdx = nearestPathIndex(x, y, pathCells, pathOrder);
  const pathProgress = pathIdx / Math.max(1, pathCells.size);

  if (x >= 8 && x <= 16 && y >= 5 && y <= 11) score += 18;
  if (x >= 17) score += 12;
  if (y <= 4) score += 10;
  if (pathProgress >= 0.55 && pathProgress <= 0.9) score += 8;

  return {
    x,
    y,
    score,
    pathAdj,
    pathProgress,
    name: nameForSpot(x, y, pathAdj),
    description: pathAdj >= 2
      ? 'Corner pathside tile — covers two path segments (+10% dmg, +8% range)'
      : 'Prime pathside tile — strong coverage (+10% dmg, +8% range)',
  };
}

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function buildExpansionPool() {
  const { cells: pathCells, order: pathOrder } = buildPathCellData();
  const baseSpots = new Set(BUILD_SPOTS.map((s) => `${s.x},${s.y}`));
  const candidates = [];

  for (let x = 0; x < GAME_CONFIG.gridCols; x++) {
    for (let y = 0; y < GAME_CONFIG.gridRows; y++) {
      const scored = scoreCandidate(x, y, pathCells, baseSpots, pathOrder);
      if (scored) candidates.push(scored);
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.pathProgress - b.pathProgress);

  const pool = [];
  const minSpacing = 2;

  for (const cand of candidates) {
    if (pool.length >= 18) break;
    const tooClose = pool.some((p) => manhattan(p, cand) < minSpacing);
    if (tooClose) continue;
    pool.push({
      x: cand.x,
      y: cand.y,
      name: cand.name,
      description: cand.description,
      tier: pool.length < 6 ? 'prime' : pool.length < 12 ? 'strong' : 'solid',
    });
  }

  if (pool.length < 18) {
    for (const cand of candidates) {
      if (pool.length >= 18) break;
      if (pool.some((p) => p.x === cand.x && p.y === cand.y)) continue;
      pool.push({
        x: cand.x,
        y: cand.y,
        name: cand.name,
        description: cand.description,
        tier: 'solid',
      });
    }
  }

  pool.sort((a, b) => {
    const progA = scoreCandidate(a.x, a.y, pathCells, baseSpots, pathOrder)?.pathProgress ?? 0;
    const progB = scoreCandidate(b.x, b.y, pathCells, baseSpots, pathOrder)?.pathProgress ?? 0;
    return progA - progB;
  });

  pool.forEach((spot, i) => {
    spot.tier = i < 6 ? 'prime' : i < 12 ? 'strong' : 'solid';
  });

  return pool;
}

export function getPathCells() {
  return buildPathCellData().cells;
}

export function isPathAdjacent(x, y) {
  const pathCells = getPathCells();
  return countPathNeighbors(x, y, pathCells) > 0;
}

export function getExpansionSpotAt(index) {
  return BUILD_EXPANSION_POOL[index] ?? null;
}

export function getExpansionSpotKey(spot) {
  return `${spot.x},${spot.y}`;
}
