import { S } from '../../state.js';

export function drawRotatorArm(x, y, size) {
  const ctx = S.ctx;
  ctx.save();
  // 使用不透明橙色，确保明显
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x, y, size, size);
  // 绘制白色十字标记，更醒目
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.beginPath();
  ctx.moveTo(x + size/2, y + size*0.2);
  ctx.lineTo(x + size/2, y + size*0.8);
  ctx.moveTo(x + size*0.2, y + size/2);
  ctx.lineTo(x + size*0.8, y + size/2);
  ctx.stroke();
  ctx.restore();
}

export function drawRotatorCenter(x, y, size, angle) {
  const ctx = S.ctx;
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.28;
  
  ctx.save();
  // 暗色基底
  ctx.fillStyle = '#4b2e0e';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  
  // 发光圆环
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
  
  // 箭头
  const arrowLen = size * 0.28;
  const arrowW = size * 0.12;
  const angleRad = angle * Math.PI / 2;
  
  const tipX = cx + Math.sin(angleRad) * arrowLen;
  const tipY = cy - Math.cos(angleRad) * arrowLen;
  
  const backAngleLeft = angleRad + Math.PI * 0.7;
  const backAngleRight = angleRad - Math.PI * 0.7;
  const leftX = cx + Math.sin(backAngleLeft) * arrowW;
  const leftY = cy - Math.cos(backAngleLeft) * arrowW;
  const rightX = cx + Math.sin(backAngleRight) * arrowW;
  const rightY = cy - Math.cos(backAngleRight) * arrowW;
  
  ctx.fillStyle = '#fff3e0';
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(leftX, leftY);
  ctx.lineTo(rightX, rightY);
  ctx.fill();
  
  ctx.restore();
}