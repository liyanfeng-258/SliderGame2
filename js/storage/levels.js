import { S, LS_KEY, AUTOSAVE_KEY, newEmpty } from '../state.js';
import { draw } from '../render.js';
import { status } from './status.js';
import { exportCompressedLevel } from './exporters.js';
import { saveGlobalItemTypes, rebuildItemTypeSelect, saveIdMap } from './globals.js';
import { readLevels, writeJSON, updateSavedSelect } from './utils.js';

export function refreshSavedList() {
  const all = readLevels();
  const sel = S.DOM?.saved; if (!sel) return;
  sel.innerHTML = '';
  Object.keys(all).forEach(k => {
    const opt = document.createElement('option');
    opt.value = k; opt.textContent = k;
    sel.appendChild(opt);
  });
}

export function autosave() {
  try {
    const data = exportCompressedLevel();
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
  } catch {}
}

export function applyLevelObject(obj) {
  try {
    if (!obj || !(Array.isArray(obj.codes) && Array.isArray(obj.codes[0])) || obj.format !== 'codes-v1') {
      status('JSON 无效：本版本只支持 codes-v1'); return false;
    }
    const H = Number(obj.gridH), W = Number(obj.gridW);
    if (!H || !W) { status('codes 无效：gridW/H'); return false; }

    S.gridH         = H; 
    S.gridW         = W;
    S.grid          = newEmpty(H, W, 0);
    S.itemsPlaced   = newEmpty(H, W, null);
    S.spikes        = newEmpty(H, W, false);
    S.hiddenWalls   = newEmpty(H, W, false);
    S.hiddenActive  = newEmpty(H, W, false);
    S.turners       = newEmpty(H, W, null);
    S.bouncers      = newEmpty(H, W, null);
    S.planks        = newEmpty(H, W, false);
    S.plankBroken   = newEmpty(H, W, false);
    S.groundDecor   = newEmpty(H, W, false);
    S.pitSpikes     = newEmpty(H, W, false);
    S.pitActive     = newEmpty(H, W, false);
    S.pitTimers     = newEmpty(H, W, null);
    S.stops         = newEmpty(H, W, false);
    S.fragilePlaced = newEmpty(H, W, false);
    S.fragileWalls  = null;
    S.footprints    = newEmpty(H, W, false);
    S.coinsGrid     = newEmpty(H, W, false);
    S.rotators      = newEmpty(H, W, false);
    S.rotatorAngles = newEmpty(H, W, 0);
    S.rotatorTimers = newEmpty(H, W, null);
    S.pSwitchPlaced = newEmpty(H, W, false);   // P 机关编辑层
    S.manholes      = newEmpty(H, W, null);
    S.manholePairs  = [];
    S.manholeGhost  = null;
    S.nextManholeId = 1;
    if (Array.isArray(obj.manholes)) {
      for (const pr of obj.manholes) {
        if (!pr || !pr.a || !pr.b) continue;
        const id = S.nextManholeId++;
        S.manholePairs[id] = { a: {x:pr.a.x, y:pr.a.y}, b: {x:pr.b.x, y:pr.b.y} };
        if (pr.a.y>=0 && pr.a.y<H && pr.a.x>=0 && pr.a.x<W) S.manholes[pr.a.y][pr.a.x] = id;
        if (pr.b.y>=0 && pr.b.y<H && pr.b.x>=0 && pr.b.x<W) S.manholes[pr.b.y][pr.b.x] = id;
      }
    }

    const code2Item = {};
    Object.keys(S.itemTypes || {}).forEach(k => {
      const c = Number(S.itemTypes[k].code);
      if (!isNaN(c)) code2Item[c] = k;
    });

    const im = S.idMap;
    const eq = (c, k) => Number(c) === Number(im[k]);

    for (let y = 0; y < H; y++) {
      const row = obj.codes[y];
      for (let x = 0; x < W; x++) {
        const c = Number(row?.[x] ?? im.floor);

        if (eq(c,'start')) {
          S.startPos = { x, y };
        } else if (eq(c,'wall')) S.grid[y][x] = 1;
        else if (eq(c,'spike')) S.spikes[y][x] = true;
        else if (eq(c,'pit'))   S.pitSpikes[y][x] = true;
        else if (eq(c, 'plank')) S.planks[y][x] = true;
        else if (eq(c, 'hiddenWall')) S.hiddenWalls[y][x] = true;
        else if (eq(c, 'fragile')) S.fragilePlaced[y][x] = true;
        else if (eq(c, 'stop')) S.stops[y][x] = true;
        else if (eq(c, 'footprint')) S.footprints[y][x] = true;
        else if (eq(c, 'coin')) S.coinsGrid[y][x] = true;
        else if (eq(c, 'turnerU')) S.turners[y][x] = 'U';
        else if (eq(c, 'turnerD')) S.turners[y][x] = 'D';
        else if (eq(c, 'turnerL')) S.turners[y][x] = 'L';
        else if (eq(c, 'turnerR')) S.turners[y][x] = 'R';
        else if (eq(c, 'bouncerLU')) S.bouncers[y][x] = 'LU';
        else if (eq(c, 'bouncerLD')) S.bouncers[y][x] = 'LD';
        else if (eq(c, 'bouncerRU')) S.bouncers[y][x] = 'RU';
        else if (eq(c, 'bouncerRD')) S.bouncers[y][x] = 'RD';
        else if (code2Item[c]) S.itemsPlaced[y][x] = code2Item[c];
        else if (eq(c, 'groundDecor')) S.groundDecor[y][x] = true;
        else if (eq(c, 'manhole')) S.manholes[y][x] = 1;
        else if (eq(c, 'rotator')) {
          S.rotators[y][x] = true;
          S.grid[y][x] = 1;
          const arms = [[x, y-1], [x+1, y], [x, y+1], [x-1, y]];
          for (let [ax, ay] of arms) {
            if (ax>=0 && ax<W && ay>=0 && ay<H) {
              S.itemsPlaced[ay][ax] = null;
              S.spikes[ay][ax] = false;
              S.hiddenWalls[ay][ax] = false;
              S.turners[ay][ax] = null;
              S.bouncers[ay][ax] = null;
              S.planks[ay][ax] = false;
              S.groundDecor[ay][ax] = false;
              S.pitSpikes[ay][ax] = false;
              S.stops[ay][ax] = false;
              S.footprints[ay][ax] = false;
              S.coinsGrid[ay][ax] = false;
              S.manholes[ay][ax] = null;
              S.rotators[ay][ax] = false;
              S.grid[ay][ax] = 0;
            }
          }
        } else if (eq(c, 'pSwitch')) {
          S.pSwitchPlaced[y][x] = true;
          S.grid[y][x] = 0; // 机关格是地板
        }
      }
    }
    S.startPos = (obj.startPos && obj.startPos.x >= 0 && obj.startPos.y >= 0)
      ? { x: obj.startPos.x, y: obj.startPos.y } : null;

    if (S.DOM.sizeW) { S.DOM.sizeW.value = S.gridW; S.DOM.sizeH.value = S.gridH; }
    if (S.DOM.hiddenSec) S.DOM.hiddenSec.value = S.hiddenDurationSec;
    if (S.DOM.pitDelay)  S.DOM.pitDelay.value  = S.pitDelaySec;
    if (S.DOM.pitStay)   S.DOM.pitStay.value   = S.pitStaySec;

    autosave(); draw(); status('关卡已载入'); return true;
  } catch (e) {
    console.error(e);
    status('载入失败：' + e.message); return false;
  }
}

export function saveLevel() {
  const name = (S.DOM.levelName?.value.trim() || `关卡_${Date.now()}`);
  const all = readLevels();
  all[name] = exportCompressedLevel();
  writeJSON(LS_KEY, all);
  refreshSavedList();
  updateSavedSelect(name);
  status('已保存：' + name);
}

export function loadLevel(name) {
  const all = readLevels();
  const obj = all[name];
  if (!obj) return;
  applyLevelObject(obj);
  updateSavedSelect(name);
  status('已载入：' + name);
  if (S.DOM.mode?.value === 'play') {
    import('../game.js').then(m => m.setupPlay(false));
  }
}

export function deleteLevel(name) {
  const all = readLevels();
  delete all[name];
  writeJSON(LS_KEY, all);
  refreshSavedList();
  status('已删除：' + name);
}

function isLevelLike(o){
  return o && typeof o === 'object' && (o.format === 'codes-v1') &&
         Array.isArray(o.codes) && Array.isArray(o.codes[0]);
}

export function flipLevelYForImport(lv) {
  const H = Number(lv?.gridH) || (Array.isArray(lv?.codes) ? lv.codes.length : 0);
  if (!H || !Array.isArray(lv?.codes)) return lv;
  const flipPos = (p) => (p && typeof p.y === 'number')
    ? { x: p.x, y: H - 1 - p.y }
    : p;
  const codes = lv.codes.slice().reverse().map(row => Array.isArray(row) ? row.slice() : row);
  const manholes = Array.isArray(lv.manholes)
    ? lv.manholes.map(pr => (pr && pr.a && pr.b) ? { a: flipPos(pr.a), b: flipPos(pr.b) } : pr)
    : lv.manholes;
  return {
    ...lv,
    codes,
    startPos: flipPos(lv.startPos),
    manholes,
  };
}

export function importLevelsFromObject(obj){
  const all = readLevels();
  let count = 0, firstName = null;

  if (obj && typeof obj === 'object' && obj.itemTypes && typeof obj.itemTypes === 'object') {
    S.itemTypes = S.itemTypes || {};
    for (const id in obj.itemTypes) if (!S.itemTypes[id]) S.itemTypes[id] = obj.itemTypes[id];
    saveGlobalItemTypes();
    rebuildItemTypeSelect();
  }

  const saveOne = (name, lv) => {
    const safe = (name && String(name)) || `导入_${Date.now()}_${count+1}`;
    const { format, gridW, gridH, codes, startPos, manholes } = lv || {};
    const flipped = flipLevelYForImport({ format, gridW, gridH, codes, startPos, manholes });
    all[safe] = flipped;
    if (!firstName) firstName = safe;
    count++;
  };

  if (obj.idMap && typeof obj.idMap === 'object') {
    S.idMap = { ...(S.idMap||{}), ...obj.idMap };
    saveIdMap();
  }

  if (typeof obj.coinValue === 'number') {
    S.coinValue = obj.coinValue;
  }

  if (typeof obj.hiddenSec === 'number') S.hiddenDurationSec = obj.hiddenSec;
  if (typeof obj.gDelaySec === 'number') S.pitDelaySec       = obj.gDelaySec;
  if (typeof obj.gStaySec  === 'number') S.pitStaySec        = obj.gStaySec;

  if (isLevelLike(obj)) {
    saveOne(obj.name || `关卡_${Date.now()}`, obj);
  } else if (obj && typeof obj === 'object') {
    const bag = (obj.levels && typeof obj.levels === 'object') ? obj.levels : obj;
    for (const k of Object.keys(bag)) if (isLevelLike(bag[k])) saveOne(k, bag[k]);
  }

  if (count > 0) {
    writeJSON(LS_KEY, all);
    refreshSavedList();
    if (firstName) loadLevel(firstName);
    status(`已导入 ${count} 个关卡`);
    return true;
  } else {
    status('未识别的关卡 JSON（仅支持 codes-v1）');
    return false;
  }
}