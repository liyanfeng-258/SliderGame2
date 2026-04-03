// 状态提示
import { S } from '../state.js';

export function status(message) {
  if (!S.DOM?.status) return;
  S.DOM.status.textContent = message;
  setTimeout(() => {
    if (S.DOM.status.textContent === message) S.DOM.status.textContent = '—';
  }, 3000);
}
