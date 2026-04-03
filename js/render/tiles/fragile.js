import { S } from '../../state.js';

export function drawFragile(x, y, size) {
  const ctx = S.ctx;
  ctx.fillStyle = '#334155';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = Math.max(1, size * 0.05);
  ctx.beginPath();
  ctx.moveTo(x + size * 0.2, y + size * 0.2); ctx.lineTo(x + size * 0.5, y + size * 0.4); ctx.lineTo(x + size * 0.8, y + size * 0.2);
  ctx.moveTo(x + size * 0.3, y + size * 0.6); ctx.lineTo(x + size * 0.6, y + size * 0.8);
  ctx.stroke();
}

