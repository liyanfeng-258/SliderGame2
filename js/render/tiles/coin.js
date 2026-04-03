import { S } from '../../state.js';

export function drawCoinTile(x, y, size){
  const ctx = S.ctx;
  const r = size * 0.22;
  const cx = x + size/2, cy = y + size/2;
  ctx.save();
  ctx.fillStyle = '#facc15';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#b45309'; ctx.lineWidth = Math.max(2, size*0.06);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.beginPath(); ctx.arc(cx - r*0.4, cy - r*0.4, r*0.35, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

