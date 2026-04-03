import { S } from '../../state.js';

export function drawSpike(x, y, size) {
  const ctx = S.ctx;
  ctx.save();
  ctx.fillStyle = '#ef4444';
  const pad = size * 0.18;
  const n = 3, gap = (size - 2 * pad) / (n - 1);
  for (let i = 0; i < n; i++) {
    const cx = x + pad + i * gap;
    ctx.beginPath();
    ctx.moveTo(cx - gap * 0.25, y + size - pad);
    ctx.lineTo(cx, y + pad);
    ctx.lineTo(cx + gap * 0.25, y + size - pad);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

