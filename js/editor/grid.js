import { S, newEmpty } from '../state.js';
import { draw } from '../render.js';
import { autosave } from '../storage.js';

export function setupEditorGrid(w, h) {
  S.gridW = w; S.gridH = h;
  S.grid = newEmpty(h, w, 0);
  S.itemsPlaced = newEmpty(h, w, null);
  S.spikes = newEmpty(h, w, false);
  S.hiddenWalls = newEmpty(h, w, false);
  S.hiddenActive = newEmpty(h, w, false);
  S.turners = newEmpty(h, w, null);
  S.bouncers = newEmpty(h, w, null);
  S.planks = newEmpty(h, w, false);
  S.plankBroken = newEmpty(h, w, false);
  S.groundDecor = newEmpty(h, w, false);
  S.pitSpikes = newEmpty(h, w, false);
  S.pitActive = newEmpty(h, w, false);
  S.pitTimers = newEmpty(h, w, null);
  S.fragilePlaced = newEmpty(h, w, false);
  S.fragileWalls = null;
  S.stops = newEmpty(h, w, false);
  S.footprints = newEmpty(h, w, false);
  S.startPos = null;
  S.coinsGrid = newEmpty(S.gridH, S.gridW, false);
  S.manholes = newEmpty(h, w, null);
  S.manholePairs = [];
  S.manholeGhost = null;
  S.nextManholeId = 1;
  // 旋转台
  S.rotators = newEmpty(h, w, false);
  S.rotatorAngles = newEmpty(h, w, 0);
  S.rotatorTimers = newEmpty(h, w, null);
  // P机关
  S.pSwitchPlaced = newEmpty(h, w, false);
  autosave();
  draw();
}

export function clearConflicts(x, y) {
  S.itemsPlaced[y][x] = null;
  S.spikes[y][x] = false;
  S.hiddenWalls[y][x] = false;
  S.hiddenActive[y][x] = false;
  S.turners[y][x] = null;
  S.bouncers[y][x] = null;
  S.planks[y][x] = false;
  S.plankBroken[y][x] = false;
  S.groundDecor[y][x] = false;
  S.pitSpikes[y][x] = false;
  S.pitActive[y][x] = false;
  S.pitTimers[y][x] = null;
  S.fragilePlaced[y][x] = false;
  S.stops[y][x] = false;
  S.footprints[y][x] = false;
  if (S.coinsGrid?.[y]) S.coinsGrid[y][x] = false;
  if (S.coinsPlay?.[y]) S.coinsPlay[y][x] = false;
  if (S.startPos && S.startPos.x === x && S.startPos.y === y) S.startPos = null;

  if (S.manholes?.[y]?.[x] != null) {
    const id = S.manholes[y][x];
    for (let yy = 0; yy < S.gridH; yy++) {
      for (let xx = 0; xx < S.gridW; xx++) {
        if (S.manholes[yy][xx] === id) S.manholes[yy][xx] = null;
      }
    }
    S.manholePairs[id] = null;
  }

  // 清除旋转台：如果是旋转台中心，删除整个十字
  if (S.rotators?.[y]?.[x]) {
    S.rotators[y][x] = false;
    if (S.rotatorAngles) S.rotatorAngles[y][x] = 0; // 重置角度
  }
  if (S.pSwitchPlaced?.[y]?.[x]) {
  S.pSwitchPlaced[y][x] = false;
  }
}