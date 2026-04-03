import { S, randInt } from '../state.js';
import { setupEditorGrid } from './grid.js';
import { autosave, status } from '../storage.js';
import { draw } from '../render.js';

const DIRS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

const clampInt = (v, min, max) => {
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
};

const pickCell = (cells) => {
  if (!cells.length) return null;
  const idx = randInt(cells.length);
  const cell = cells[idx];
  cells[idx] = cells[cells.length - 1];
  cells.pop();
  return cell;
};

const isDeathCell = (x, y) => !!(
  S.spikes?.[y]?.[x] ||
  S.pitSpikes?.[y]?.[x] ||
  S.planks?.[y]?.[x]
);

const isStopCell = (x, y) => !!(
  S.stops?.[y]?.[x] ||
  S.fragilePlaced?.[y]?.[x]
);

const getManholePair = (x, y) => {
  const id = S.manholes?.[y]?.[x];
  if (id == null) return null;
  const pair = S.manholePairs?.[id];
  if (!pair || !pair.a || !pair.b) return null;
  if (pair.a.x === x && pair.a.y === y) return pair.b;
  if (pair.b.x === x && pair.b.y === y) return pair.a;
  return null;
};

const simulateMove = (start, dx, dy) => {
  let x = start.x, y = start.y;
  const path = [];
  const seen = new Set();
  let guard = 0;

  while (guard++ < 5000) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= S.gridW || ny >= S.gridH) {
      return { ok: true, stop: { x, y }, path };
    }
    if (S.grid[ny][nx] === 1) {
      return { ok: true, stop: { x, y }, path };
    }
    if (isDeathCell(nx, ny)) {
      return { ok: false, path };
    }

    x = nx; y = ny;
    path.push({ x, y });

    if (isStopCell(x, y)) {
      return { ok: true, stop: { x, y }, path };
    }

    const man = getManholePair(x, y);
    if (man) {
      path.push({ x: man.x, y: man.y });
      return { ok: true, stop: { x: man.x, y: man.y }, path };
    }

    const t = S.turners?.[y]?.[x];
    if (t) {
      if (t === 'U') { dx = 0; dy = -1; }
      else if (t === 'D') { dx = 0; dy = 1; }
      else if (t === 'L') { dx = -1; dy = 0; }
      else { dx = 1; dy = 0; }
    }

    const b = S.bouncers?.[y]?.[x];
    if (b) {
      let ndx = dx, ndy = dy;
      if (b === 'LU') { if (dx === -1) { ndx = 0; ndy = 1; } else if (dy === -1) { ndx = 1; ndy = 0; } }
      else if (b === 'LD') { if (dx === -1) { ndx = 0; ndy = -1; } else if (dy === 1) { ndx = 1; ndy = 0; } }
      else if (b === 'RU') { if (dx === 1) { ndx = 0; ndy = 1; } else if (dy === -1) { ndx = -1; ndy = 0; } }
      else if (b === 'RD') { if (dx === 1) { ndx = 0; ndy = -1; } else if (dy === 1) { ndx = -1; ndy = 0; } }
      dx = ndx; dy = ndy;
    }

    const key = `${x},${y},${dx},${dy}`;
    if (seen.has(key)) return { ok: false, path };
    seen.add(key);
  }
  return { ok: false, path };
};

const allReachableByRules = (start) => {
  if (!start) return false;
  const reachable = Array.from({ length: S.gridH }, () => Array(S.gridW).fill(false));
  const stopped = Array.from({ length: S.gridH }, () => Array(S.gridW).fill(false));
  const queue = [start];
  reachable[start.y][start.x] = true;
  stopped[start.y][start.x] = true;

  while (queue.length) {
    const cur = queue.shift();
    for (const d of DIRS) {
      const res = simulateMove(cur, d.dx, d.dy);
      if (!res.ok) continue;
      for (const p of res.path) reachable[p.y][p.x] = true;
      const s = res.stop;
      if (!stopped[s.y][s.x]) {
        stopped[s.y][s.x] = true;
        queue.push(s);
      }
    }
  }

  for (let y = 0; y < S.gridH; y++) {
    for (let x = 0; x < S.gridW; x++) {
      if (S.itemsPlaced?.[y]?.[x] && !reachable[y][x]) return false;
      if (S.footprints?.[y]?.[x] && !reachable[y][x]) return false;
    }
  }
  return true;
};

const copy2D = (arr) => Array.isArray(arr) ? arr.map(r => Array.isArray(r) ? r.slice() : r) : arr;

const snapshotState = () => ({
  gridW: S.gridW,
  gridH: S.gridH,
  grid: copy2D(S.grid),
  itemsPlaced: copy2D(S.itemsPlaced),
  spikes: copy2D(S.spikes),
  hiddenWalls: copy2D(S.hiddenWalls),
  hiddenActive: copy2D(S.hiddenActive),
  turners: copy2D(S.turners),
  bouncers: copy2D(S.bouncers),
  planks: copy2D(S.planks),
  plankBroken: copy2D(S.plankBroken),
  groundDecor: copy2D(S.groundDecor),
  pitSpikes: copy2D(S.pitSpikes),
  pitActive: copy2D(S.pitActive),
  pitTimers: copy2D(S.pitTimers),
  fragilePlaced: copy2D(S.fragilePlaced),
  stops: copy2D(S.stops),
  footprints: copy2D(S.footprints),
  startPos: S.startPos ? { x: S.startPos.x, y: S.startPos.y } : null,
  coinsGrid: copy2D(S.coinsGrid),
  manholes: copy2D(S.manholes),
  manholePairs: Array.isArray(S.manholePairs)
    ? S.manholePairs.map(p => p ? { a: p.a ? { x: p.a.x, y: p.a.y } : null, b: p.b ? { x: p.b.x, y: p.b.y } : null } : p)
    : S.manholePairs,
  nextManholeId: S.nextManholeId,
});

const restoreState = (snap) => {
  if (!snap) return;
  S.gridW = snap.gridW;
  S.gridH = snap.gridH;
  S.grid = copy2D(snap.grid);
  S.itemsPlaced = copy2D(snap.itemsPlaced);
  S.spikes = copy2D(snap.spikes);
  S.hiddenWalls = copy2D(snap.hiddenWalls);
  S.hiddenActive = copy2D(snap.hiddenActive);
  S.turners = copy2D(snap.turners);
  S.bouncers = copy2D(snap.bouncers);
  S.planks = copy2D(snap.planks);
  S.plankBroken = copy2D(snap.plankBroken);
  S.groundDecor = copy2D(snap.groundDecor);
  S.pitSpikes = copy2D(snap.pitSpikes);
  S.pitActive = copy2D(snap.pitActive);
  S.pitTimers = copy2D(snap.pitTimers);
  S.fragilePlaced = copy2D(snap.fragilePlaced);
  S.stops = copy2D(snap.stops);
  S.footprints = copy2D(snap.footprints);
  S.startPos = snap.startPos ? { x: snap.startPos.x, y: snap.startPos.y } : null;
  S.coinsGrid = copy2D(snap.coinsGrid);
  S.manholes = copy2D(snap.manholes);
  S.manholePairs = Array.isArray(snap.manholePairs)
    ? snap.manholePairs.map(p => p ? { a: p.a ? { x: p.a.x, y: p.a.y } : null, b: p.b ? { x: p.b.x, y: p.b.y } : null } : p)
    : snap.manholePairs;
  S.nextManholeId = snap.nextManholeId;
};

const fillFootprints = () => {
  for (let y = 0; y < S.gridH; y++) {
    for (let x = 0; x < S.gridW; x++) {
      if (S.grid[y][x] !== 0) continue;
      if (S.startPos && S.startPos.x === x && S.startPos.y === y) continue;
      S.footprints[y][x] = true;
    }
  }
};

const tryGenerateOnce = (w, h) => {
  setupEditorGrid(w, h);

  // border walls
  for (let x = 0; x < w; x++) {
    S.grid[0][x] = 1;
    S.grid[h - 1][x] = 1;
  }
  for (let y = 0; y < h; y++) {
    S.grid[y][0] = 1;
    S.grid[y][w - 1] = 1;
  }

  // fill interior with walls first
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) S.grid[y][x] = 1;
  }

  // carve a random path
  const innerCells = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) innerCells.push({ x, y });
  }
  const start = pickCell(innerCells);
  if (!start) return false;

  const target = Math.max(6, Math.floor(innerCells.length * (0.55 + Math.random() * 0.25)));
  const visited = new Set([`${start.x},${start.y}`]);
  const stack = [start];
  S.grid[start.y][start.x] = 0;

  while (stack.length && visited.size < target) {
    const cur = stack[stack.length - 1];
    const neighbors = [];
    for (const d of DIRS) {
      const nx = cur.x + d.dx, ny = cur.y + d.dy;
      if (nx <= 0 || ny <= 0 || nx >= w - 1 || ny >= h - 1) continue;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      neighbors.push({ x: nx, y: ny });
    }
    if (!neighbors.length) {
      stack.pop();
      continue;
    }
    const next = neighbors[randInt(neighbors.length)];
    visited.add(`${next.x},${next.y}`);
    S.grid[next.y][next.x] = 0;
    stack.push(next);
  }

  S.startPos = start;
  fillFootprints();
  return allReachableByRules(start);
};

export function generateRandomLevelFromInputs() {
  const SAFE_MAX = 99;
  const w = clampInt(S.DOM.sizeW?.value, 5, SAFE_MAX);
  const h = clampInt(S.DOM.sizeH?.value, 5, SAFE_MAX);
  if (S.DOM.sizeW) S.DOM.sizeW.value = w;
  if (S.DOM.sizeH) S.DOM.sizeH.value = h;

  const MAX_TRIES = 80;
  const backup = snapshotState();
  let ok = false;
  for (let i = 0; i < MAX_TRIES; i++) {
    if (tryGenerateOnce(w, h)) { ok = true; break; }
  }

  if (ok) {
    autosave();
    draw();
    status('已随机生成关卡');
  } else {
    restoreState(backup);
    draw();
    status('生成失败：当前参数无法满足可达性');
  }
  return ok;
}
