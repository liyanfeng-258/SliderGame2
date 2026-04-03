import { S } from '../../state.js';

export function drawHidden(x, y, size, active) {
  const ctx = S.ctx; ctx.save();
  ctx.fillStyle = active ? 'rgba(59,130,246,.55)' : 'rgba(59,130,246,.22)';
  ctx.fillRect(x, y, size, size);
  ctx.restore();
}

export function drawHiddenGrid(hidden, active, offX, offY, size){
  const H = hidden?.length || 0; if (!H) return;
  const W = hidden[0]?.length || 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (hidden[y]?.[x]) drawHidden(offX + x*size, offY + y*size, size, !!active?.[y]?.[x]);
}
