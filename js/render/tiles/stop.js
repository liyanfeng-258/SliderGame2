import { S } from '../../state.js';

export function drawStop(x, y, size) {
  const ctx = S.ctx, r = size * 0.34, cx = x + size / 2, cy = y + size / 2;
  ctx.save();
  ctx.fillStyle = '#e71d1dff';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = Math.max(2, size * 0.06);
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke();
  ctx.restore();
}

