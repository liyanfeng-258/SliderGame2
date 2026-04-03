// 触控：快速滑动触发移动
import { S } from '../state.js';
import { slide } from '../game.js';

export function bindTouchControls(){
  const el = S.canvas; if (!el) return;
  const touches = new Map();
  const SWIPE_MIN = 24; const MAX_SWIPE_TIME = 350;

  const onDown = (e) => {
    const mode = S.DOM?.mode?.value;
    if (mode !== 'play' && mode !== 'multi') return;
    if (e.pointerType === 'touch') e.preventDefault();
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now() });
    el.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    const mode = S.DOM?.mode?.value;
    if (mode !== 'play' && mode !== 'multi') return;
    if (e.pointerType === 'touch') e.preventDefault();
  };
  const onUp = (e) => {
    const info = touches.get(e.pointerId);
    touches.delete(e.pointerId); el.releasePointerCapture?.(e.pointerId);
    const mode = S.DOM?.mode?.value;
    if (!info || (mode !== 'play' && mode !== 'multi')) return;
    const dt = performance.now() - info.t;
    const dx = e.clientX - info.x; const dy = e.clientY - info.y;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (touches.size === 0 && dt <= MAX_SWIPE_TIME && Math.max(ax, ay) >= SWIPE_MIN) {
      if (ax > ay) slide(dx > 0 ? 1 : -1, 0); else slide(0, dy > 0 ? 1 : -1);
    }
  };

  el.addEventListener('pointerdown', onDown,  { passive:false });
  el.addEventListener('pointermove', onMove,  { passive:false });
  window.addEventListener('pointerup',   onUp, { passive:false });
  window.addEventListener('pointercancel', onUp);
}
