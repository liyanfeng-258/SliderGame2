import { S } from '../../state.js';

export function drawTurner(x, y, size, dir) {
  const ctx = S.ctx;
  const cx = x + size / 2;
  const cy = y + size / 2;
  const shaftHalf = size * 0.2;
  const shaftWidth = size * 0.14;
  const headLength = size * 0.26;
  const headWidth = size * 0.28;

  const angle = (dir === 'U') ? -Math.PI / 2
               : (dir === 'D') ? Math.PI / 2
               : (dir === 'L') ? Math.PI
               : 0; // default to right

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = '#22c55e';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(-shaftHalf, -shaftWidth / 2);
  ctx.lineTo(shaftHalf, -shaftWidth / 2);
  ctx.lineTo(shaftHalf, -headWidth / 2);
  ctx.lineTo(shaftHalf + headLength, 0);
  ctx.lineTo(shaftHalf, headWidth / 2);
  ctx.lineTo(shaftHalf, shaftWidth / 2);
  ctx.lineTo(-shaftHalf, shaftWidth / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
