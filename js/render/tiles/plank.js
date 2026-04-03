import { S } from '../../state.js';

export function drawPlank(x, y, size) {
  const ctx = S.ctx, pad = size * 0.08, h = (size - 2 * pad) / 3;
  ctx.save(); ctx.fillStyle = '#c89b63'; ctx.strokeStyle = '#8b6b3e'; ctx.lineWidth = Math.max(1, size * 0.04);
  for (let i = 0; i < 3; i++) { const yy = y + pad + i * h; ctx.fillRect(x + pad, yy + 2, size - 2 * pad, h - 6); ctx.strokeRect(x + pad, yy + 2, size - 2 * pad, h - 6); }
  ctx.restore();
}

export function drawPlankBroken(x, y, size) {
  const ctx = S.ctx; const pad = size * 0.08; const h = (size - 2 * pad) / 3; const gap = size * 0.12; const segW = (size - 2 * pad - gap) / 2;
  ctx.save(); ctx.fillStyle = '#a07d4b'; ctx.strokeStyle = '#6f5430'; ctx.lineWidth = Math.max(1, size * 0.04);
  for (let i = 0; i < 3; i++) { const yy = y + pad + i * h + 2; const hh = h - 6; ctx.fillRect(x + pad, yy, segW, hh); ctx.strokeRect(x + pad, yy, segW, hh); const rx = x + pad + segW + gap; ctx.fillRect(rx, yy, segW, hh); ctx.strokeRect(rx, yy, segW, hh); }
  ctx.restore();
}

