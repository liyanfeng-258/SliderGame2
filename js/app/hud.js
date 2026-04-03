// 顶部“关卡 i / N”简单 HUD 更新
import { S } from '../state.js';

export function updateLevelHUD() {
  const sel = S.DOM.saved; if (!sel) return;
  const total = sel.options.length || 0;
  const idx = sel.selectedIndex >= 0 ? (sel.selectedIndex + 1) : 0;
  if (S.DOM.levelIndex) S.DOM.levelIndex.textContent = String(idx);
  if (S.DOM.levelTotal) S.DOM.levelTotal.textContent = String(total);
}

