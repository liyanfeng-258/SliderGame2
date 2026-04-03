import { S } from '../state.js';
import { readLevels } from './utils.js';

function flipLevelYForExport(level) {
  const H = Number(level?.gridH);
  if (!H || !Array.isArray(level?.codes)) return level;
  const flipPos = (p) => (p && typeof p.y === 'number')
    ? { x: p.x, y: H - 1 - p.y }
    : p;
  const codes = level.codes.slice().reverse().map(row => Array.isArray(row) ? row.slice() : row);
  const manholes = Array.isArray(level.manholes)
    ? level.manholes.map(pr => (pr && pr.a && pr.b) ? { a: flipPos(pr.a), b: flipPos(pr.b) } : pr)
    : level.manholes;
  return {
    ...level,
    codes,
    startPos: flipPos(level.startPos),
    manholes,
  };
}

export function exportCompressedLevel() {
  const H = S.gridH, W = S.gridW;
  const codes = new Array(H);

  const itemCode = {};
  Object.keys(S.itemTypes || {}).forEach(k => {
    const c = Number(S.itemTypes[k].code);
    if (!isNaN(c)) itemCode[k] = c;
  });

  for (let y = 0; y < H; y++) {
    const row = new Array(W);
    for (let x = 0; x < W; x++) {
      let code = S.idMap.floor;

      if (S.startPos && S.startPos.x === x && S.startPos.y === y) {
        code = S.idMap.start;
      } else if (S.rotators?.[y]?.[x]) {
        code = S.idMap.rotator;
      } else if (S.pSwitchPlaced?.[y]?.[x]) {
        code = S.idMap.pSwitch;
      } else if (S.grid[y][x] === 1) code = S.idMap.wall;
      else if (S.turners?.[y]?.[x]) { const d=S.turners[y][x]; code = S.idMap['turner'+d]; }
      else if (S.bouncers?.[y]?.[x]) { const b=S.bouncers[y][x]; code = S.idMap['bouncer'+b]; }
      else if (S.spikes?.[y]?.[x])            code = S.idMap.spike;
      else if (S.pitSpikes?.[y]?.[x])         code = S.idMap.pit;
      else if (S.planks?.[y]?.[x])            code = S.idMap.plank;
      else if (S.hiddenWalls?.[y]?.[x])       code = S.idMap.hiddenWall;
      else if (S.fragilePlaced?.[y]?.[x])     code = S.idMap.fragile;
      else if (S.stops?.[y]?.[x])             code = S.idMap.stop;
      else if (S.manholes?.[y]?.[x] != null)  code = S.idMap.manhole;
      else if (S.footprints?.[y]?.[x])        code = S.idMap.footprint;
      else if (S.coinsGrid?.[y]?.[x])         code = S.idMap.coin; 
      else if (S.itemsPlaced?.[y]?.[x])       code = itemCode[S.itemsPlaced[y][x]] ?? S.idMap.floor;
      else if (S.groundDecor?.[y]?.[x])       code = S.idMap.groundDecor;
      
      row[x] = code;
    }
    codes[y] = row;
  }
  return {
    format: 'codes-v1',
    startPos: S.startPos || null,
    gridW: W, gridH: H,
    codes,
    manholes: (() => {
      const H = S.gridH, W = S.gridW;
      const cells = [];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const id = S.manholes?.[y]?.[x];
          if (id != null) cells.push({ x, y, id: Number(id) || 0 });
        }
      }
      if (!cells.length) return [];

      const out = [];
      if (S.manholePairs && S.manholePairs.length) {
        const seen = new Set();
        for (const c of cells) {
          const id = c.id;
          if (id == null || seen.has(id)) continue;
          const p = S.manholePairs[id];
          if (p && p.a && p.b) {
            out.push({ a: { x: p.a.x, y: p.a.y }, b: { x: p.b.x, y: p.b.y } });
            seen.add(id);
          }
        }
        if (out.length) return out;
      }
      cells.sort((a,b) => (a.y-b.y) || (a.x-b.x));
      for (let i = 0; i + 1 < cells.length; i += 2) {
        const A = cells[i], B = cells[i + 1];
        out.push({ a: { x: A.x, y: A.y }, b: { x: B.x, y: B.y } });
      }
      return out;
    })(),
  };
}

function _cleanItemTypesForExport(src){
  const out = {};
  for (const k in (src||{})) {
    const t = src[k] || {};
    out[k] = { name: t.name || '', code: t.code || 0, imgPath: t.imgPath || '' };
  }
  return out;
}

export function stringifyLevelsBundlePretty(bundle) {
  const markers = [];
  const MK = i => `__CODES_${i}__`;

  let json = JSON.stringify(bundle, (k, v) => {
    if (k === 'codes' && Array.isArray(v) && v.length && Array.isArray(v[0])) {
      const i = markers.push(v) - 1;
      return MK(i);
    }
    return v;
  }, 2);

  for (let i = 0; i < markers.length; i++) {
    const quoted = `"${MK(i)}"`;
    let pos = json.indexOf(quoted);
    while (pos !== -1) {
      const lineStart = json.lastIndexOf('\n', pos) + 1;
      const propIndent = json.slice(lineStart).match(/^\s*/)[0] || '';
      const rowIndent  = propIndent + '  ';

      const rows = markers[i];
      const block =
        '[\n' +
        rows.map(r => `${rowIndent}[${r.join(',')}]`).join(',\n') +
        `\n${propIndent}]`;

      json = json.slice(0, pos) + block + json.slice(pos + quoted.length);
      pos = json.indexOf(quoted, pos + block.length);
    }
  }
  return json;
}

export function exportAllLevelsBundle(includeCurrent=false){
  const all = readLevels();
  if (includeCurrent && S.grid) {
    const name = (S.DOM.levelName?.value?.trim()) || `未命名_${Date.now()}`;
    try { all[name] = exportCompressedLevel(); } catch {}
  }

  const cleaned = {};
  for (const k in all) {
    const lv = all[k] || {};
    const { format, gridW, gridH, codes, startPos, manholes  } = lv;
    cleaned[k] = flipLevelYForExport({ format, gridW, gridH, codes, startPos, manholes });
  }  

  return {
    version: 2,
    idMap: S.idMap || {}, 
    coinValue: S.coinValue ?? 10,
    hiddenSec: S.hiddenDurationSec ?? 2,
    gDelaySec: S.pitDelaySec ?? 1,
    gStaySec:  S.pitStaySec  ?? 1,
    itemTypes: _cleanItemTypesForExport(S.itemTypes),
    levels: cleaned
  };
}