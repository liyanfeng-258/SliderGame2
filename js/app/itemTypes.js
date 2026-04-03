import { S, newEmpty } from '../state.js';
import { autosave, status, saveGlobalItemTypes, saveIdMap, rebuildItemTypeSelect } from '../storage.js';
import { draw } from '../render.js';
import { renderBrushUI } from './brushUI.js';

let bound = false;

export function bindItemTypeControls() {
  if (bound) return;
  bound = true;

  S.DOM.addType.onclick = () => {
    const name = S.DOM.itemName.value.trim() || `道具${Object.keys(S.itemTypes || {}).length + 1}`;
    const file = S.DOM.itemImg.files?.[0] || null;

    const used = new Set(Object.values(S.idMap || {}).map(Number));
    Object.values(S.itemTypes || {}).forEach(t => used.add(Number(t.code)));
    let code = 1001; while (used.has(code)) code++;

    const id = 'item_' + Date.now();
    S.itemTypes = S.itemTypes || {};
    S.itemTypes[id] = { name, imgPath: '', img: '', code };
    if (file) S.itemTypes[id].imgPath = 'assets/items/' + file.name;

    saveGlobalItemTypes?.();
    rebuildItemTypeSelect?.();
    if (S.DOM.itemType) S.DOM.itemType.value = id;
    status?.('已新增道具类型');
    renderBrushUI?.();
  };

  S.DOM.removeType.onclick = () => {
    const id = S.DOM.itemType.value;
    if (!id) return;
    if (!confirm(`删除道具类型“${S.itemTypes?.[id]?.name || id}”？\n同时清除场景中该类型道具。`)) return;
    for (let y = 0; y < S.gridH; y++)
      for (let x = 0; x < S.gridW; x++)
        if (S.itemsPlaced?.[y]?.[x] === id) S.itemsPlaced[y][x] = null;
    delete S.itemTypes[id];
    rebuildItemTypeSelect?.();
    autosave?.();
    draw?.();
    status?.('已删除当前道具类型');
    renderBrushUI?.();
  };

  S.DOM.clearItems.onclick = () => {
    S.itemsPlaced = newEmpty(S.gridH, S.gridW, null);
    autosave?.(); draw?.();
    renderBrushUI?.();
    status?.('已清空场景道具');
  };
}
