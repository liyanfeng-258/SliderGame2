import { S, newEmpty } from '../state.js';
import { draw } from '../render.js';
import { autosave, status } from '../storage.js';
import { clearConflicts } from './grid.js';

// 确保旋转台相关数组尺寸与网格一致
function ensureRotatorArrays() {
  const h = S.grid ? S.grid.length : S.gridH;
  const w = S.grid && S.grid[0] ? S.grid[0].length : S.gridW;
  if (!S.rotators || S.rotators.length !== h || (S.rotators[0] && S.rotators[0].length !== w)) {
    S.rotators = newEmpty(h, w, false);
    S.rotatorAngles = newEmpty(h, w, 0);
    S.rotatorTimers = newEmpty(h, w, null);
  }
}

export function isManholeBrush() {
  const v = S.DOM.brush?.value;
  return v === 'manhole' || v === 'well' || v === 'portal' || v === '井盖';
}

export function isRotatorBrush() {
  const v = S.DOM.brush?.value;
  return v === 'rotator';
}

export function brushAt(x, y) {
  if (x < 0 || y < 0 || x >= S.gridW || y >= S.gridH) return;
  const b = S.DOM.brush.value;
  const itSel = S.DOM.itemType.value;

  if (b === 'wall') {
    S.grid[y][x] = 1;
    clearConflicts(x, y);
  } else if (b === 'floor') {
    S.grid[y][x] = 0;
    clearConflicts(x, y);
  } else if (b === 'spawn') {
    if (S.grid[y][x] === 1) S.grid[y][x] = 0;
    clearConflicts(x, y);
    if (S.startPos && S.startPos.x === x && S.startPos.y === y) {
      S.startPos = null;
    } else {
      S.startPos = { x, y };
    }
  } else if (b === 'item') {
    if (S.grid[y][x] === 1) S.grid[y][x] = 0;
    if (!itSel) { alert('请先新增一个道具类型'); return; }
    clearConflicts(x, y);
    S.itemsPlaced[y][x] = (S.itemsPlaced[y][x] === itSel) ? null : itSel;
  } else if (b === 'spike') {
    if (S.grid[y][x] === 1) S.grid[y][x] = 0;
    clearConflicts(x, y);
    S.spikes[y][x] = !S.spikes[y][x];
  } else if (b === 'hidden') {
    if (S.grid[y][x] === 1) S.grid[y][x] = 0;
    clearConflicts(x, y);
    S.hiddenWalls[y][x] = !S.hiddenWalls[y][x];
  } else if (b === 'turner') {
    if (S.grid[y][x] === 1) S.grid[y][x] = 0;
    clearConflicts(x, y);
    const d = S.DOM.turnDir.value || 'U';
    S.turners[y][x] = (S.turners[y][x] === d) ? null : d;
  } else if (b === 'bouncer') {
    if (S.grid[y][x] === 1) S.grid[y][x] = 0;
    clearConflicts(x, y);
    const t = S.DOM.bounceType.value || 'LU';
    S.bouncers[y][x] = (S.bouncers[y][x] === t) ? null : t;
  } else if (b === 'plank') {
    if (S.grid[y][x] === 1) S.grid[y][x] = 0;
    clearConflicts(x, y);
    S.planks[y][x] = !S.planks[y][x];
  } else if (b === 'groundDecor') {
    if (S.grid[y][x] === 1) S.grid[y][x] = 0;
    clearConflicts(x, y);
    S.groundDecor[y][x] = !S.groundDecor[y][x];
  } else if (b === 'pit') {
    if (S.grid[y][x] === 1) S.grid[y][x] = 0;
    clearConflicts(x, y);
    S.pitSpikes[y][x] = !S.pitSpikes[y][x];
  } else if (b === 'fragile') {
    if (S.grid[y][x] === 1) S.grid[y][x] = 0;
    clearConflicts(x, y);
    S.fragilePlaced[y][x] = !S.fragilePlaced[y][x];
  } else if (b === 'stop') {
    if (S.grid[y][x] === 1) S.grid[y][x] = 0;
    clearConflicts(x, y);
    S.stops[y][x] = !S.stops[y][x];
  } else if (b === 'footprint') {
    if (S.grid[y][x] === 1) S.grid[y][x] = 0;
    clearConflicts(x, y);
    S.footprints[y][x] = !S.footprints[y][x];
  } else if (b === 'coin') {
    if (S.grid[y][x] === 1) S.grid[y][x] = 0;
    if (!S.coinsGrid) S.coinsGrid = newEmpty(S.gridH, S.gridW, false);
    clearConflicts(x, y);
    S.coinsGrid[y][x] = !S.coinsGrid[y][x];
   } else if (isManholeBrush()) {
    // 井盖逻辑（原代码）
    if (x < 0 || y < 0 || x >= S.gridW || y >= S.gridH) return;

    if (S.manholes?.[y]?.[x] != null) {
      if (S._manholeJustPlacedTs && (performance.now() - S._manholeJustPlacedTs < 200)) {
        return;
      }
      const id = S.manholes[y][x];
      for (let yy = 0; yy < S.gridH; yy++) {
        for (let xx = 0; xx < S.gridW; xx++) {
          if (S.manholes[yy][xx] === id) S.manholes[yy][xx] = null;
        }
      }
      S.manholePairs[id] = null;
      status('井盖：已删除一对');
      autosave();
      draw();
      return;
    }

    if (S.grid[y][x] === 1) S.grid[y][x] = 0;
    clearConflicts(x, y);

    if (!S.manholeGhost) {
      S.manholeGhost = { x, y };
      status('井盖：已放置第一枚');
      autosave();
      draw();
      return;
    }

    if (S.manholeGhost.x === x && S.manholeGhost.y === y) {
      S.manholeGhost = null;
      autosave();
      draw();
      return;
    }

    const a = S.manholeGhost;
    clearConflicts(a.x, a.y);
    clearConflicts(x, y);

    const id = S.nextManholeId++;
    S.manholePairs[id] = { a: { ...a }, b: { x, y } };
    S.manholes[a.y][a.x] = id;
    S.manholes[y][x] = id;
    S.manholeGhost = null;
    S._manholeJustPlacedTs = performance.now();
    status('井盖：已配对');
    autosave();
    draw();
    return;
   } else if (b === 'rotator') {
    // 防止短时间内重复放置（pointerdown 和 click 都会触发）
    const now = performance.now();
    if (S._lastRotatorPlacedTs && (now - S._lastRotatorPlacedTs < 200)) {
      return;
    }
    S._lastRotatorPlacedTs = now;

    // 检查边界
    if (x < 1 || y < 1 || x >= S.gridW - 1 || y >= S.gridH - 1) {
      status('旋转台中心需离边界至少一格');
      return;
    }
    // 确保旋转台数组尺寸匹配
    ensureRotatorArrays();

    // 清除中心及周围四格的冲突
    const arms = [[x, y-1], [x+1, y], [x, y+1], [x-1, y]];
    for (let [ax, ay] of arms) {
      if (ax >= 0 && ax < S.gridW && ay >= 0 && ay < S.gridH) {
        clearConflicts(ax, ay);
        S.grid[ay][ax] = 0; // 臂格设为地板
      }
    }
    // 中心格设为墙壁
    S.grid[y][x] = 1;
    // 如果已存在旋转台则删除，否则创建
    if (S.rotators[y][x]) {
      S.rotators[y][x] = false;
      S.rotatorAngles[y][x] = 0;
      status('已删除旋转台');
    } else {
      S.rotators[y][x] = true;
      S.rotatorAngles[y][x] = 0;
      status('已放置旋转台');
    }
    autosave();
    draw();
  } else if (b === 'pSwitch') {
    if (S.grid[y][x] === 1) S.grid[y][x] = 0;
    clearConflicts(x, y);
    if (S.pSwitchPlaced[y][x]) {
      S.pSwitchPlaced[y][x] = false;
      status('已删除 P 机关');
    } else {
      S.pSwitchPlaced[y][x] = true;
      status('已放置 P 机关');
    }
  }

  // 所有分支统一调用 autosave 和 draw
  autosave();
  draw();
}