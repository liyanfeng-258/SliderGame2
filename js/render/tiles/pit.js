import { S } from '../../state.js';

export function drawPit(x, y, size, active) {
  const pad = size * 0.18, ctx = S.ctx;
  ctx.fillStyle = active ? '#0f1a2d' : '#152036';
  ctx.fillRect(x + pad, y + pad, size - 2 * pad, size - 2 * pad);
  const n = 4, gap = (size - 2 * pad) / (n + 1), base = y + size - pad * 1.2;
  ctx.fillStyle = active ? '#14b8a6' : 'rgba(20,184,166,.35)';
  for (let i = 1; i <= n; i++) {
    const cx = x + pad + gap * i, w = gap * 0.45, h = active ? (size * 0.5) : (size * 0.2);
    ctx.beginPath(); ctx.moveTo(cx - w / 2, base); ctx.lineTo(cx, base - h); ctx.lineTo(cx + w / 2, base); ctx.closePath(); ctx.fill();
  }
}

export function drawPitGrid(pitSpikes, pitActive, offX, offY, size){
  const H = pitSpikes?.length || 0; if (!H) return;
  const W = pitSpikes[0]?.length || 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (pitSpikes[y]?.[x]) drawPit(offX + x*size, offY + y*size, size, !!pitActive?.[y]?.[x]);
}

