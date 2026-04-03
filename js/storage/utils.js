// storage 公共工具：localStorage 读写与下拉框同步
import { S, LS_KEY } from '../state.js';

export function readObject(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch {
    return {};
  }
}

export function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function readLevels() {
  return readObject(LS_KEY);
}

export function updateSavedSelect(name) {
  const sel = S.DOM?.saved; if (!sel) return;
  if (name != null) sel.value = name;
  sel.dispatchEvent(new Event('change'));
}

