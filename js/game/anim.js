// Animation helpers for tokens and items
import { S } from '../state.js';
import { draw } from '../render.js';

export function flyTokenFromCellToHUD(cx, cy, cls = 'paw') {
  const layer = document.getElementById('fxLayer') || document.body;
  const layerRect = layer.getBoundingClientRect();
  const { rect, size, offX, offY } = S.getCellMetrics();
  const startX = rect.left + offX + (cx + 0.5) * size - layerRect.left;
  const startY = rect.top  + offY + (cy + 0.5) * size - layerRect.top;
  const target = (S.DOM.footFound || S.DOM.footHUD || document.body);
  const hudRect = target.getBoundingClientRect();
  const endX = hudRect.left + hudRect.width / 2 - layerRect.left;
  const endY = hudRect.top  + hudRect.height / 2 - layerRect.top;
  const el = document.createElement('div');
  el.className = 'fly ' + cls;
  el.style.left = startX + 'px';
  el.style.top  = startY + 'px';
  layer.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(.6)`;
    el.style.opacity = '0';
  });
  setTimeout(() => el.remove(), 650);
}

export function flyItemToInventory(cx, cy, id, slotIndex = 0) {
  const layer = document.getElementById('fxLayer') || document.body;
  const layerRect = layer.getBoundingClientRect();
  const { rect, size, offX, offY } = S.getCellMetrics();
  const startX = rect.left + offX + (cx + 0.5) * size - layerRect.left;
  const startY = rect.top  + offY + (cy + 0.5) * size - layerRect.top;
  const inv = S.DOM.inventory || document.body;
  const target = (inv.children && inv.children[slotIndex]) ? inv.children[slotIndex] : inv;
  const tRect = target.getBoundingClientRect();
  const endX = tRect.left + tRect.width / 2 - layerRect.left;
  const endY = tRect.top  + tRect.height / 2 - layerRect.top;
  const el = document.createElement('div');
  el.className = 'fly item';
  el.style.left = startX + 'px';
  el.style.top  = startY + 'px';
  const t = S.itemTypes?.[id];
  const url = t?.imgPath || t?.img;
  if (url) {
    const img = document.createElement('img');
    img.src = url; img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'contain';
    el.style.borderRadius = '8px'; el.appendChild(img);
  }
  layer.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(.7)`;
    el.style.opacity = '0';
  });
  setTimeout(() => el.remove(), 650);
}

// 一次“跨一格”动画：从当前格到相邻格，结束时调用 onArrive(nx,ny,dx,dy)
export function runSegment(dx, dy, onArrive) {
  const dur = Math.max(16, (S.stepDurationMs | 0) || 180);
  S.anim = {
    fromX: S.player.x,
    fromY: S.player.y,
    dx, dy,
    t0: performance.now(),
    dur,
    curX: S.player.x,
    curY: S.player.y,
  };

  const tick = () => {
    const a = S.anim; if (!a) return;
    const now = performance.now();
    const t = (now - a.t0) / a.dur;
    if (t < 1) {
      a.curX = a.fromX + a.dx * t;
      a.curY = a.fromY + a.dy * t;
      draw();
      requestAnimationFrame(tick);
      return;
    }
    // 到达下一格
    const nx = a.fromX + a.dx;
    const ny = a.fromY + a.dy;
    S.anim = null; // 清理动画句柄
    // 更新玩家位置（真实落点），由回调继续后续逻辑
    S.player.x = nx; S.player.y = ny;
    try { onArrive && onArrive(nx, ny, dx, dy); } catch {}
  };
  requestAnimationFrame(tick);
}

