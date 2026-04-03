// 常用操作：传送、撤销、扩展背包格
import { S } from '../state.js';
import { draw, updateHUD, updateInventoryUI } from '../render.js';
import { toast } from '../ui/toast.js';

function isTeleportableAt(x, y) {
  if (x < 0 || y < 0 || x >= S.gridW || y >= S.gridH) return false;
  if (S.grid?.[y]?.[x] !== 0) return false;
  const hasItem   = !!((S.itemsPlay?.[y]?.[x]) ?? (S.itemsPlaced?.[y]?.[x]));
  const hasCoin   = !!((S.coinsPlay?.[y]?.[x]) ?? (S.coinsGrid?.[y]?.[x]));
  const hasFoot   = !!((S.footprintsPlay?.[y]?.[x]) ?? (S.footprints?.[y]?.[x]));
  const hasStop   = !! S.stops?.[y]?.[x];
  const hasPlank  = !! S.planks?.[y]?.[x];
  const hasSpike  = !! S.spikes?.[y]?.[x];
  const hasHidden = !!(S.hiddenActive?.[y]?.[x] || S.hiddenWalls?.[y]?.[x]);
  const hasTurn   = !! S.turners?.[y]?.[x];
  const hasBounce = !! S.bouncers?.[y]?.[x];
  const hasPit    = !!((S.pitActive?.[y]?.[x]) || (S.pitSpikes?.[y]?.[x]));
  const hasFrag   = !! S.fragileWalls?.[y]?.[x];
  if (hasItem || hasCoin || hasFoot || hasStop || hasPlank || hasSpike || hasHidden || hasTurn || hasBounce || hasPit || hasFrag) return false;
  return true;
}

function findRandomTeleportable(excludeX, excludeY) {
  const pool = [];
  for (let y = 0; y < S.gridH; y++) {
    for (let x = 0; x < S.gridW; x++) {
      if (isTeleportableAt(x, y) && !(x === excludeX && y === excludeY)) pool.push({ x, y });
    }
  }
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function useTeleport() {
  if (S.inputLocked || S.shuffleAnim || S.moving || isAnyModalOpen()) return false;
  if (!S.player) return false;
  const pick = findRandomTeleportable(S.player.x, S.player.y);
  if (!pick) { toast('没有可传送的位置'); return false; }
  S.player.x = pick.x; S.player.y = pick.y;
  draw(); toast('已传送');
  return true;
}

export function useUndo(){
  return undoLastAction();
}

export function useAddSlot(){
  if ((S.extraSlotsUsed|0) >= 3) { toast('本局已达上限'); return false; }
  S.extraSlotsUsed = (S.extraSlotsUsed|0) + 1;
  draw(); updateInventoryUI?.();
  if (typeof S.onAction === 'function') {
    try { S.onAction({ type: 'addslot' }); } catch {}
  }
  toast('已增加一个背包位置');
  return true;
}

function undoLastAction(){
  const stack = (S.actionStack || []);
  const a = stack.pop();
  if (!a) { toast('没有可撤销的行动'); return false; }
  S.moving = false; S.target = null; S._redirect = null; S.anim = null;
  S.player.x = a.start.x; S.player.y = a.start.y;
  (a.feet||[]).forEach(({x,y})=>{ if (S.footprintsPlay?.[y]) S.footprintsPlay[y][x] = true; });
  (a.picked||[]).forEach(({x,y,id})=>{ if (S.itemsPlay?.[y]) S.itemsPlay[y][x] = id; });
  (a.brokePlanks||[]).forEach(({x,y})=>{ if (S.plankBroken?.[y]) S.plankBroken[y][x] = false; });
  (a.brokeFragile||[]).forEach(({x,y})=>{ if (S.fragileWalls?.[y]) S.fragileWalls[y][x] = true; });
  (a.pitTriggers||[]).forEach(({x,y})=>{
    if (S.pitTimers?.[y]?.[x]?.raising)  clearTimeout(S.pitTimers[y][x].raising);
    if (S.pitTimers?.[y]?.[x]?.activeTO) clearTimeout(S.pitTimers[y][x].activeTO);
    if (S.pitActive?.[y]) S.pitActive[y][x] = false;
    if (S.pitTimers?.[y]) S.pitTimers[y][x] = null;
  });
  S.inventory = a.inventoryBefore || [];
  S.paintedCount = a.paintedBefore || 0;
  S._worldDirty = true;
  draw(); updateInventoryUI(); updateHUD();
  toast('已撤销上一次行动');
  return true;
}

function isAnyModalOpen(){
  const ids = ['winModal','loseModal','deadModal','clearModal','jsonModal'];
  return ids.some(id => S.DOM[id] && getComputedStyle(S.DOM[id]).display !== 'none');
}
