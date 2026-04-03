import { S } from '../../state.js';
import { getItemImgById } from '../images.js';

export function drawItem(id, x, y, w, h) {
  const ctx = S.ctx; const img = getItemImgById(id, S);
  if (img && img.complete) {
    ctx.drawImage(img, x, y, w, h);
  } else if (img) {
    img.onload = () => { try { ctx.drawImage(img, x, y, w, h); } catch {} };
  } else {
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(x+2, y+2, w-4, h-4);
  }
}

