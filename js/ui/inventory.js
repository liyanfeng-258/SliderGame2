// 背包 UI 渲染（与渲染主循环解耦）
import { S } from '../state.js';

export function updateInventoryUI() {
  const root = S.DOM.inventory; if (!root) return;
  root.innerHTML = '';
  const max = Math.min(5 + (S.extraSlotsUsed||0), 8);
  for (let i = 0; i < max; i++) {
    const div = document.createElement('div');
    div.className = 'slot';
    if (i < (S.inventory?.length || 0)) {
      const id = S.inventory[i];
      const t = S.itemTypes?.[id];
      const url = t?.imgPath || t?.img;
      if (url) {
        const img = document.createElement('img');
        img.src = url;
        div.appendChild(img);
      } else {
        div.textContent = t ? (t.name || '道具') : '道具';
      }
      let cnt = 1;
      for (let j = i + 1; j < S.inventory.length && S.inventory[j] === id; j++) cnt++;
      if (cnt > 1) {
        const b = document.createElement('div');
        b.className = 'cnt';
        b.textContent = cnt;
        div.appendChild(b);
      }
    }
    root.appendChild(div);
  }
}

