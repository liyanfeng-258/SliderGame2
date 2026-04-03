import { S } from '../../state.js';

export function drawBouncer(x, y, size, type) {
  const ctx = S.ctx;
  ctx.save();
  ctx.fillStyle = '#60a5fa';
  ctx.beginPath();

  if (type === 'LU') {
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
  } else if (type === 'LD') {
    ctx.moveTo(x, y + size);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x, y);
  } else if (type === 'RU') {
    ctx.moveTo(x + size, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x + size, y + size);
  } else if (type === 'RD') {
    ctx.moveTo(x + size, y + size);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x + size, y);
  } else {
    ctx.restore();
    return;
  }

  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
