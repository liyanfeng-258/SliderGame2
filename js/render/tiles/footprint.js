import { S } from '../../state.js';

export function drawFootprint(x, y, size) {
  const ctx = S.ctx, r = size * 0.12;
  ctx.save();
  ctx.fillStyle = 'rgba(148, 163, 184, 0.12)';
  const cx = x + size * 0.5, cy = y + size * 0.55;
  ctx.beginPath(); ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2); ctx.fill();
  const offs = [[-1.2,-1.4],[0.0,-1.8],[1.2,-1.4]];
  for(const [ox,oy] of offs){ ctx.beginPath(); ctx.arc(cx + ox*r, cy + oy*r, r*0.6, 0, Math.PI*2); ctx.fill(); }
  ctx.restore();
}

