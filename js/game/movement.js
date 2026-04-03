// Movement: sliding, stepping, interactions and target computing
import { S } from '../state.js';
import { draw, updateHUD } from '../render.js';
import { updateCoinsHUD } from './hud.js';
import { showDead, checkWin } from './logic.js';
import { showCoinGainAtCell } from '../ui/toast.js';
import { flyTokenFromCellToHUD, runSegment } from './anim.js';
import { processStep } from './step-handlers.js';
import {
  isAnyModalOpen,
  getPairedEndFor,
  tryPickup,
  checkPlankAndMaybeBreakOrDie,
  triggerPitAt,
} from './move-util.js';

export function slide(dx, dy) {
  const mode = S.DOM.mode?.value;
  if ((mode !== 'play' && mode !== 'multi') || S.moving) return;
  if (S.inputLocked || isAnyModalOpen() || S.shuffleAnim) return;

  // 处理旋转台上的移动限制
  if (S.onRotator && S.rotatorCenter) {
    const { x: cx, y: cy } = S.rotatorCenter;
    let currentDir = null;
    if (S.player.x === cx && S.player.y === cy - 1) currentDir = 'up';
    else if (S.player.x === cx + 1 && S.player.y === cy) currentDir = 'right';
    else if (S.player.x === cx && S.player.y === cy + 1) currentDir = 'down';
    else if (S.player.x === cx - 1 && S.player.y === cy) currentDir = 'left';
    else {
      S.onRotator = false;
      S.rotatorCenter = null;
      S.inputLocked = false;
    }

    if (currentDir) {
      let allowed = false;
      if (currentDir === 'up' && dy === -1 && dx === 0) allowed = true;
      else if (currentDir === 'right' && dx === 1 && dy === 0) allowed = true;
      else if (currentDir === 'down' && dy === 1 && dx === 0) allowed = true;
      else if (currentDir === 'left' && dx === -1 && dy === 0) allowed = true;
      
      if (allowed) {
        S.onRotator = false;
        S.rotatorCenter = null;
        S.inputLocked = false;
      } else {
        return;
      }
    }
  }

  const { x: tx, y: ty } = computeTargetFrom(S.player.x, S.player.y, dx, dy);
  if (tx === S.player.x && ty === S.player.y) return;

  S.target = { x: tx, y: ty };
  S.moving = true;
  S._action = {
    start: { x: S.player.x, y: S.player.y },
    path: [], picked: [], feet: [], brokePlanks: [], brokeFragile: [], pitTriggers: [],
    inventoryBefore: [...(S.inventory||[])], paintedBefore: S.paintedCount || 0,
  };
  const onArrive = (nx, ny, cdx, cdy) => {
    // ⭐ 关键修复：在进入下一格前检查是否为墙（包括P机关变出的墙）
    if (S.grid[ny][nx] === 1) {
      // 目标格是墙，回退玩家位置到移动前的格子
      S.player.x = nx - cdx;
      S.player.y = ny - cdy;
      S.moving = false;
      draw();
      checkWin();
      finalizeAction('blocked_by_wall');
      return;
    }

    // 1) 特殊格：易碎墙提前终止
    if (S.fragileWalls?.[ny]?.[nx]){
      if (S._action) S._action.brokeFragile.push({x:nx,y:ny});
      S.fragileWalls[ny][nx] = false;
      stepInto(nx, ny, cdx, cdy);
      S.moving = false; draw(); checkWin(); finalizeAction('fragile'); return;
    }

    // 2) 记录路径并触发进格逻辑
    if (S._action) S._action.path && S._action.path.push({x:nx,y:ny});
    const res = stepInto(nx, ny, cdx, cdy);

    // 3) 可能因为墙刺/陷阱/中转站/旋转台等停下
    if (!S.moving) { draw(); checkWin(); finalizeAction('stopped'); return; }

    // 4) 处理转向/弹射
    let ndx = cdx, ndy = cdy;
    if (S._redirect){ ndx = S._redirect.dx; ndy = S._redirect.dy; S._redirect = null; S.target = computeTargetFrom(S.player.x, S.player.y, ndx, ndy); }

    // 5) 到达整段终点
    if (S.player.x === S.target.x && S.player.y === S.target.y){ draw(); checkWin(); S.moving=false; finalizeAction('arrived'); return; }

    // 6) 继续下一格
    runSegment(ndx, ndy, onArrive);
  };
  runSegment(dx, dy, onArrive);
}

const ACTION_STACK_LIMIT = 20;

function finalizeAction(result = 'arrived') {
  const action = S._action;
  if (!action) return;
  action.end = { x: S.player?.x ?? action.start.x, y: S.player?.y ?? action.start.y };
  action.result = result;
  S._action = null;
  if (!Array.isArray(S.actionStack)) S.actionStack = [];
  S.actionStack.push(action);
  if (S.actionStack.length > ACTION_STACK_LIMIT) S.actionStack.shift();
  if (typeof S.onAction === 'function') {
    try { S.onAction(action); } catch {}
  }
}

export function computeTargetFrom(x, y, dx, dy) {
  let nx = x, ny = y;
  while (true) {
    const tx = nx + dx, ty = ny + dy;
    if (tx < 0 || ty < 0 || tx >= S.gridW || ty >= S.gridH) break;
    if (S.grid[ty][tx] === 1) break;
    if (S.hiddenActive?.[ty]?.[tx]) break;
    if (S.fragileWalls?.[ty]?.[tx] || S.stops?.[ty]?.[tx]) { nx = tx; ny = ty; break; }
    nx = tx; ny = ty;
  }
  return { x: nx, y: ny };
}

function stepInto(x, y, dx, dy){
  if (S._action) S._action.path.push({x,y});
  S.player.x = x; S.player.y = y;
  const res = processStep(x, y, dx, dy);
  if (res.anim?.footprint) { try { flyTokenFromCellToHUD(x, y, 'paw'); } catch(e){} }
  if (res.anim?.coin) { try { flyTokenFromCellToHUD(x, y, 'coin'); } catch(e){} }
  if (res.stopped) return;
  if (res.redirect) { S.target = computeTargetFrom(S.player.x, S.player.y, res.dx, res.dy); S._redirect = { dx: res.dx, dy: res.dy }; return; }
}