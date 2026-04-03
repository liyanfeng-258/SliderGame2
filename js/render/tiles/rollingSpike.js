import { S } from '../../state.js';

/**
 * 绘制刺球（静态图标，用于编辑模式或游玩模式静态显示）
 * @param {number} x 左上角X
 * @param {number} y 左上角Y
 * @param {number} size 格子尺寸
 */
export function drawRollingSpike(x, y, size) {
  const ctx = S.ctx;
  ctx.save();
  // 暗红色球形基底
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.arc(x + size/2, y + size/2, size * 0.4, 0, Math.PI * 2);
  ctx.fill();
  // 刺的线条
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = Math.max(2, size * 0.08);
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const dx = Math.cos(angle) * size * 0.5;
    const dy = Math.sin(angle) * size * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + size/2, y + size/2);
    ctx.lineTo(x + size/2 + dx, y + size/2 + dy);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 绘制刺球（根据像素坐标，用于游玩模式平滑动画）
 * @param {number} px 左上角X像素
 * @param {number} py 左上角Y像素
 * @param {number} size 格子尺寸
 */
export function drawRollingSpikeAt(px, py, size) {
  const ctx = S.ctx;
  ctx.save();
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.arc(px + size/2, py + size/2, size * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = Math.max(2, size * 0.08);
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const dx = Math.cos(angle) * size * 0.5;
    const dy = Math.sin(angle) * size * 0.5;
    ctx.beginPath();
    ctx.moveTo(px + size/2, py + size/2);
    ctx.lineTo(px + size/2 + dx, py + size/2 + dy);
    ctx.stroke();
  }
  ctx.restore();
}