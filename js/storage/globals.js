import { S, ITEM_TYPES_KEY } from '../state.js';
import { readObject, writeJSON } from './utils.js';

const IDMAP_KEY = 'slidepaint-idmap-v1';
const DEFAULT_IDMAP = {
  floor: 0,
  wall: 1,
  start: 2,
  spike: 10,
  plank: 11,
  hiddenWall: 12,
  fragile: 13,
  stop: 14,
  pit: 15,
  footprint: 16,
  coin: 17,
  manhole: 18,
  groundDecor: 19,
  turnerU: 20, turnerD: 21, turnerL: 22, turnerR: 23,
  bouncerLU: 30, bouncerLD: 31, bouncerRU: 32, bouncerRD: 33,
  rotator: 40,
  pSwitch: 41
};

export function saveGlobalItemTypes() {
  writeJSON(ITEM_TYPES_KEY, S.itemTypes || {});
}

export function loadGlobalItemTypes() {
  try {
    S.itemTypes = readObject(ITEM_TYPES_KEY);
    rebuildItemTypeSelect();
  } catch {}
}

export function rebuildItemTypeSelect() {
  const sel = S.DOM?.itemType; if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '';
  Object.keys(S.itemTypes || {}).forEach(id => {
    const opt = document.createElement('option');
    opt.value = id; opt.textContent = S.itemTypes[id].name || id;
    sel.appendChild(opt);
  });
  if (sel.options.length) sel.value = (cur && S.itemTypes[cur]) ? cur : sel.options[0].value;
}

export function loadIdMap() {
  try { S.idMap = { ...DEFAULT_IDMAP, ...readObject(IDMAP_KEY) }; }
  catch { S.idMap = { ...DEFAULT_IDMAP }; }
}

export function saveIdMap() {
  writeJSON(IDMAP_KEY, S.idMap || {});
}

export function ensureGlobalsLoaded() {
  loadIdMap();
  loadGlobalItemTypes();
  rebuildItemTypeSelect();
}