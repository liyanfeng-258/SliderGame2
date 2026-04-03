import { S } from '../../state.js';

export function drawPSwitch(x, y, size) {
  const ctx = S.ctx;
  ctx.save();
  // 金色背景
  ctx.fillStyle = '#eab308';
  ctx.fillRect(x, y, size, size);
  // 白色边框
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.strokeRect(x, y, size, size);
  // 绘制字母 P
  ctx.font = `${size * 0.6}px monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', x + size/2, y + size/2);
  ctx.restore();
}