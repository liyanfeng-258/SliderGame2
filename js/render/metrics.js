// 视窗与单元格尺寸计算
import { S } from '../state.js';

export function getCellMetrics() {
  const isMobile = window.matchMedia('(max-width: 520px)').matches;
  const dpr = isMobile ? 1 : (window.devicePixelRatio || 1);
  const mode = S.DOM?.mode?.value;
  const inPlay   = (mode === 'play' || mode === 'multi');
  const useFixed = !!S.fixedView && inPlay;
  const viewW = useFixed ? Math.max(1, Math.floor(S.viewW || 13)) : S.gridW;
  const viewH = useFixed ? Math.max(1, Math.floor(S.viewH || 9 )) : S.gridH;

  const host = (S.DOM?.stage || document.getElementById('stage') || S.canvas.parentElement);
  const hostRect = host.getBoundingClientRect();
  const aspect = hostRect.height / Math.max(1, hostRect.width);
  const preferFill = inPlay && window.matchMedia('(max-width: 520px)').matches && aspect > 1.1;

  if (useFixed) {
    const sizeForCss = Math.floor(
      (preferFill ? Math.max(hostRect.width / viewW, hostRect.height / viewH)
                  : Math.min(hostRect.width / viewW, hostRect.height / viewH))
    );
    const cssW = Math.max(1, sizeForCss) * viewW;
    const cssH = Math.max(1, sizeForCss) * viewH;
    if (preferFill) {
      S.canvas.style.width  = hostRect.width  + 'px';
      S.canvas.style.height = hostRect.height + 'px';
    } else {
      S.canvas.style.width  = cssW + 'px';
      S.canvas.style.height = cssH + 'px';
    }
  } else {
    S.canvas.style.width  = hostRect.width  + 'px';
    S.canvas.style.height = hostRect.height + 'px';
  }

  const stageRect = S.canvas.getBoundingClientRect();
  const pxW = Math.round(stageRect.width  * dpr);
  const pxH = Math.round(stageRect.height * dpr);
  if (S.canvas.width !== pxW || S.canvas.height !== pxH) {
    S.canvas.width  = pxW;
    S.canvas.height = pxH;
  }

  S._dpr = dpr;
  S.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  let sizeFit = Math.floor(
    (preferFill ? Math.max(stageRect.width / viewW, stageRect.height / viewH)
                : Math.min(stageRect.width / viewW, stageRect.height / viewH))
  );
  let size = !useFixed ? Math.max(S.minCellSizePx || 24, sizeFit) : sizeFit;
  if (!useFixed) size = Math.max(S.minCellSizePx || 24, sizeFit);
  let offX = Math.floor((stageRect.width  - size * viewW) / 2);
  let offY = Math.floor((stageRect.height - size * viewH) / 2);

  if (useFixed) {
    const tx = (S.anim ? S.anim.curX : (S.player?.x ?? 0)) + 0.5;
    const ty = (S.anim ? S.anim.curY : (S.player?.y ?? 0)) + 0.5;
    const camW = Math.min(viewW, S.gridW);
    const camH = Math.min(viewH, S.gridH);
    const halfW = camW / 2;
    const halfH = camH / 2;
    const tclampedX = Math.max(halfW, Math.min(S.gridW - halfW, tx));
    const tclampedY = Math.max(halfH, Math.min(S.gridH - halfH, ty));
    S.camera = S.camera || {};
    if (S.camera.x == null || S.camera.y == null) { S.camera.x = tclampedX; S.camera.y = tclampedY; }
    const moving = !!S.anim;
    const lock = !!S.camera.lockDuringMove && moving;
    if (lock) { S.camera.x = tclampedX; S.camera.y = tclampedY; }
    else {
      const now  = performance.now();
      const last = S._lastTs ?? now;
      const dt   = Math.min(0.1, Math.max(0, (now - last) / 1000));
      S._lastTs  = now;
      const k = Math.max(0, S.camera.smooth ?? 10);
      const a = dt > 0 ? (1 - Math.exp(-k * dt)) : 1;
      S.camera.x += (tclampedX - S.camera.x) * a;
      S.camera.y += (tclampedY - S.camera.y) * a;
      S.camera.x = Math.max(halfW, Math.min(S.gridW - halfW, S.camera.x));
      S.camera.y = Math.max(halfH, Math.min(S.gridH - halfH, S.camera.y));
    }
    const left = (S.camera?.x ?? tclampedX) - halfW;
    const top  = (S.camera?.y ?? tclampedY) - halfH;
    const snap = (S.camera?.pixelSnap !== false);
    const pxOffX = offX - left * size;
    const pxOffY = offY - top  * size;
    offX = snap ? Math.round(pxOffX) : pxOffX;
    offY = snap ? Math.round(pxOffY) : pxOffY;
    if (useFixed) {
      const padGX = Math.max(0, (viewW - S.gridW) * size / 2);
      const padGY = Math.max(0, (viewH - S.gridH) * size / 2);
      offX += Math.round(padGX);
      offY += Math.round(padGY);
    }
  }

  if (inPlay && S.drag) {
    const viewWCells = Math.min(viewW, S.gridW);
    const viewHCells = Math.min(viewH, S.gridH);
    const maxX = Math.max(0, (S.gridW - viewWCells) * size);
    const maxY = Math.max(0, (S.gridH - viewHCells) * size);
    const panX = Math.max(-maxX, Math.min(maxX, S.drag.panX|0));
    const panY = Math.max(-maxY, Math.min(maxY, S.drag.panY|0));
    offX += panX; offY += panY;
  }

  if (!useFixed) {
    const contentW = size * S.gridW; const contentH = size * S.gridH;
    const stageRect2 = S.canvas.getBoundingClientRect();
    if (contentW > stageRect2.width || contentH > stageRect2.height) {
      const minOffX = stageRect2.width  - contentW;
      const minOffY = stageRect2.height - contentH;
      const panX = (S.editPan?.x || 0); const panY = (S.editPan?.y || 0);
      offX = Math.max(minOffX, Math.min(0, offX + panX));
      offY = Math.max(minOffY, Math.min(0, offY + panY));
    }
  }
  return { rect: S.canvas.getBoundingClientRect(), size, offX, offY, dpr };
}
