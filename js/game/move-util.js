// Movement utilities: status checks and interactions broken out from movement
import { S, newEmpty } from '../state.js';
import { draw, updateHUD, updateInventoryUI } from '../render.js';
import { updateCoinsHUD } from './hud.js';
import { showDead } from './logic.js';
import { flyItemToInventory } from './anim.js';

export const isAnyModalOpen = () => {
  const ids = ['winModal','loseModal','deadModal','clearModal','jsonModal'];
  return ids.some(id => S.DOM[id] && getComputedStyle(S.DOM[id]).display !== 'none');
};

export function getPairedEndFor(id, x, y) {
  const p = S.manholePairs?.[id]; if (!p) return null;
  if (p.a && p.a.x === x && p.a.y === y) return p.b;
  if (p.b && p.b.x === x && p.b.y === y) return p.a;
  return null;
}

export function tryPickup(x, y) {
  const id = S.itemsPlay?.[y]?.[x];
  if (!id) return;
  if (S._action) S._action.picked.push({x,y,id});
  const slotIndex = S.inventory.length;
  try { flyItemToInventory(x, y, id, slotIndex); } catch {}
  S.itemsPlay[y][x] = null;
  S._worldDirty = true;
  addToInventory(id);
  updateInventoryUI();
  S.paintedCount++; updateHUD();
}

export function checkPlankAndMaybeBreakOrDie(x, y) {
  if (!S.planks?.[y]?.[x]) return false;
  if (S.plankBroken?.[y]?.[x]) { S.moving = false; showDead(); draw(); return true; }
  if (S._action) S._action.brokePlanks.push({x,y});
  S.plankBroken[y][x] = true;
  S._worldDirty = true;
  return false;
}

export function triggerPitAt(x, y) {
  if (!S.pitSpikes?.[y]?.[x]) return;
  if (!S.pitTimers) S.pitTimers = newEmpty(S.gridH, S.gridW, null);
  const cell = S.pitTimers[y][x] || {};
  if (cell.raising || cell.activeTO) return;
  if (S._action) S._action.pitTriggers.push({x, y});
  cell.raising = setTimeout(() => {
    if (!S.pitActive) S.pitActive = newEmpty(S.gridH, S.gridW, false);
    S.pitActive[y][x] = true; draw();
    S._worldDirty = true;
    if (S.player && S.player.x === x && S.player.y === y) { S.moving = false; showDead(); draw(); }
    cell.activeTO = setTimeout(() => {
      S.pitActive[y][x] = false;
      S.pitTimers[y][x] = null;
      S._worldDirty = true;
      draw();
    }, Math.max(0, S.pitStaySec) * 1000);
  }, Math.max(0, S.pitDelaySec) * 1000);
  S.pitTimers[y][x] = cell;
}

export function addToInventory(id){
  S.inventory.push(id);
  const cnt = {}; for (const k of S.inventory) cnt[k] = (cnt[k] || 0) + 1;
  for (const k in cnt) {
    const trios = Math.floor(cnt[k] / 3);
    if (trios > 0) {
      let need = trios * 3;
      for (let i = 0; i < S.inventory.length && need > 0; ) {
        if (S.inventory[i] === k) { S.inventory.splice(i, 1); need--; }
        else i++;
      }
    }
  }
  updateInventoryUI();
  const cap = Math.min(5 + (S.extraSlotsUsed|0), 8);
  if (S.inventory.length >= cap) {
    S.inputLocked = true;
    S.gameEnded = true;
    S.DOM.loseModal.style.display = 'flex';
    if (typeof S.onLose === 'function') {
      try { S.onLose(); } catch {}
    }
  }
}