// 游玩模式：鼠标拖拽平移视图
import { S } from '../state.js';
import { draw } from '../render.js';

export function bindPlayDrag() {
  const cvs = S.canvas;
  if (!cvs) return;
  let down = false;

  cvs.addEventListener('mousedown', (e)=>{
    const mode = S.DOM.mode?.value;
    if (mode !== 'play' && mode !== 'multi') return;
    down = true;
    S.drag.active = true;
    S.drag.returning = false;
    S.drag.startX = e.clientX;
    S.drag.startY = e.clientY;
    S.drag.startPanX = S.drag.panX || 0;
    S.drag.startPanY = S.drag.panY || 0;
    cvs.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e)=>{
    const mode = S.DOM.mode?.value;
    if (!down || (mode !== 'play' && mode !== 'multi')) return;
    const dx = e.clientX - S.drag.startX;
    const dy = e.clientY - S.drag.startY;
    S.drag.panX = S.drag.startPanX + dx;
    S.drag.panY = S.drag.startPanY + dy;
    draw();
  });

  window.addEventListener('mouseup', ()=>{
    if (!down) return;
    down = false;
    S.drag.active = false;
    S.drag.returning = true;
    cvs.style.cursor = '';
    requestAnimationFrame(draw);
  });
}
