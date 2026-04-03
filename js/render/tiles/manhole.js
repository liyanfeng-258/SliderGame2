import { S } from '../../state.js';

export function drawManhole(x, y, size) {
  const ctx = S.ctx; ctx.save();
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.beginPath(); ctx.arc(x + size/2, y + size/2, size * 0.34, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + size*0.25, y + size/2);
  ctx.lineTo(x + size*0.75, y + size/2);
  ctx.moveTo(x + size/2, y + size*0.25);
  ctx.lineTo(x + size/2, y + size*0.75);
  ctx.stroke(); ctx.restore();
}

export function drawManholeGhost(x, y, size) {
  const ctx = S.ctx; ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.setLineDash([size*0.2, size*0.2]);
  drawManhole(x, y, size);
  ctx.restore();
}

export function drawManholesGrid(manholes, offX, offY, size){
  const H = manholes?.length || 0; if (!H) return;
  const W = manholes[0]?.length || 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (manholes[y]?.[x] != null) drawManhole(offX + x*size, offY + y*size, size);
}

export function drawManholeGhostAt(g, offX, offY, size){
  if (!g) return; drawManholeGhost(offX + g.x*size, offY + g.y*size, size);
}
