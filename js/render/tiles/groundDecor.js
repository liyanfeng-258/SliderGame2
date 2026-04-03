import { S } from '../../state.js';

export function drawGroundDecor(x, y, size) {
  const ctx = S.ctx;
  const cx = x + size * 0.5;
  const cy = y + size * 0.5;
  const r = size * 0.28;
  ctx.save();
  ctx.lineWidth = Math.max(1, Math.floor(size * 0.06));
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0.2 * Math.PI, 1.6 * Math.PI);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(251, 146, 60, 0.35)';
  ctx.beginPath();
  ctx.arc(cx + r * 0.2, cy - r * 0.1, r * 0.45, 0.6 * Math.PI, 1.8 * Math.PI);
  ctx.stroke();
  ctx.restore();
}
