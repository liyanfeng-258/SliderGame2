// 轻量 UI 提示与金币飘字效果（无外部依赖）
import { S } from '../state.js';

// 简单文本提示（右上角淡入/淡出）
export function toast(msg) {
  const layer = document.getElementById('fxLayer') || document.body;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  layer.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 250); }, 1000);
}

// 在指定格子中心显示“金币 +X”飘字（带小金币图标）
export function showCoinGainAtCell(cx, cy, amount = 10) {
  const layer = document.getElementById('fxLayer') || document.body;
  const layerRect = layer.getBoundingClientRect();
  const { rect, size, offX, offY } = S.getCellMetrics();
  const x = rect.left + offX + (cx + 0.5) * size - layerRect.left;
  const y = rect.top  + offY + (cy + 0.5) * size - layerRect.top;

  const el = document.createElement('div');
  el.style.position = 'absolute';
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  el.style.transform = 'translate(-50%, -50%)';
  el.style.transition = 'transform .6s ease, opacity .6s ease';
  el.style.opacity = '1';
  el.style.pointerEvents = 'none';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.gap = '6px';
  el.style.fontWeight = '700';
  el.style.fontSize = '16px';
  el.style.color = '#ffd166';
  el.style.textShadow = '0 2px 6px rgba(0,0,0,.45)';
  
  const dot = document.createElement('span');
  dot.style.width = '16px';
  dot.style.height = '16px';
  dot.style.borderRadius = '50%';
  dot.style.background = '#facc15';
  dot.style.boxShadow = 'inset 0 0 0 2px #b45309';
  dot.style.display = 'inline-block';
  dot.style.position = 'relative';
  const hl = document.createElement('span');
  hl.style.position = 'absolute'; hl.style.left = '3px'; hl.style.top  = '3px';
  hl.style.width = '6px'; hl.style.height= '6px'; hl.style.borderRadius = '50%';
  hl.style.background = 'rgba(255,255,255,.5)';
  dot.appendChild(hl);

  const txt = document.createElement('span');
  txt.textContent = `+${amount}`;
  el.appendChild(dot); el.appendChild(txt); layer.appendChild(el);

  requestAnimationFrame(() => { el.style.transform = 'translate(-50%, -110%)'; el.style.opacity = '0'; });
  setTimeout(() => el.remove(), 700);
}

