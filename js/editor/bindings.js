import { S } from '../state.js';
import { draw } from '../render.js';
import { status } from '../storage.js';
import { brushAt, isManholeBrush } from './brush.js';

export function bindEditorCanvas() {
  S.canvas.addEventListener('contextmenu', e => e.preventDefault());
  let painting = false;

  S.canvas.addEventListener('pointerdown', e => {
    if (S.DOM.mode.value !== 'edit') return;
    e.preventDefault();

    if (e.button !== 0) {
      S.editPan.dragging = true;
      S.editPan.sx = e.clientX; S.editPan.sy = e.clientY;
      S.editPan.ox = S.editPan.x; S.editPan.oy = S.editPan.y;
      S.canvas.setPointerCapture?.(e.pointerId);
      S.canvas.style.cursor = 'grabbing';
      return;
    }

    S.canvas.setPointerCapture?.(e.pointerId);
    const { rect, size, offX, offY } = S.getCellMetrics();
    const x = Math.floor((e.clientX - rect.left - offX) / size);
    const y = Math.floor((e.clientY - rect.top - offY) / size);
    if (isNaN(x) || isNaN(y)) return;

    if (S.DOM.brush.value === 'item' && (e.altKey || !S.DOM.itemType.value) && S.itemsPlaced?.[y]?.[x]) {
      S.DOM.itemType.value = S.itemsPlaced[y][x];
      status('已选中类型：' + (S.itemTypes[S.DOM.itemType.value]?.name || S.DOM.itemType.value));
      return;
    }

    if (isManholeBrush()) {
      S._mhLastDownTs = performance.now();
      S._mhSkipClickOnce = true;
      setTimeout(() => { S._mhSkipClickOnce = false; }, 400);
      brushAt(x, y);
      painting = false;
    } else {
      brushAt(x, y);
      painting = true;
    }
  });

  S.canvas.addEventListener('click', e => {
    if (S.DOM.mode.value !== 'edit') return;
    if (!isManholeBrush()) return;
    if (S.editPan.dragging) return;
    if (S._mhSkipClickOnce) { S._mhSkipClickOnce = false; return; }
    const { rect, size, offX, offY } = S.getCellMetrics();
    const x = Math.floor((e.clientX - rect.left - offX) / size);
    const y = Math.floor((e.clientY - rect.top - offY) / size);
    if (isNaN(x) || isNaN(y)) return;
    brushAt(x, y);
  }, { passive: false });

  window.addEventListener('pointerup', e => {
    if (S.editPan.dragging) {
      S.editPan.dragging = false;
      S.canvas.releasePointerCapture?.(e.pointerId);
      S.canvas.style.cursor = '';
    }
    painting = false;
  });

  S.canvas.addEventListener('pointermove', e => {
    if (S.DOM.mode.value !== 'edit') return;
    if (S.editPan.dragging) {
      S.editPan.x = S.editPan.ox + (e.clientX - S.editPan.sx);
      S.editPan.y = S.editPan.oy + (e.clientY - S.editPan.sy);
      draw();
      return;
    }
    e.preventDefault();
    const { rect, size, offX, offY } = S.getCellMetrics();
    const x = Math.floor((e.clientX - rect.left - offX) / size);
    const y = Math.floor((e.clientY - rect.top - offY) / size);
    const leftDown = (e.buttons & 1) === 1;
    if (isManholeBrush()) return;
    if (painting && leftDown) {
      brushAt(x, y);
    }
  });

  S.canvas.addEventListener('pointerleave', () => {
    if (!S.editPan.dragging) {
      painting = false;
      S.canvas.style.cursor = '';
    }
  });
}
