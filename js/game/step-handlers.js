// Step handlers for tile interactions executed when entering a cell
import { S } from '../state.js';
import { updateCoinsHUD } from './hud.js';
import { showDead } from './logic.js';
import { showCoinGainAtCell } from '../ui/toast.js';
import { tryPickup, checkPlankAndMaybeBreakOrDie, triggerPitAt, getPairedEndFor } from './move-util.js';
import { activatePSwitch } from './logic.js';

// 标准化返回结构
export const STEP = Object.freeze({ CONTINUE: 'continue', STOP: 'stop', REDIRECT: 'redirect' });
export const REASON = Object.freeze({ spike:'spike', plank:'plank', pit:'pit', fragile:'fragile', stop:'stop', manhole:'manhole', rotator:'rotator' });

const R_CONT = { kind: STEP.CONTINUE, stopped: false };
const rStop = (reason) => ({ kind: STEP.STOP, stopped: true, reason });
const rRedirect = (dx, dy) => ({ kind: STEP.REDIRECT, redirect: true, dx, dy });

// --- 小型处理器 ---
function handleFootprint(x, y) {
  if (!S.footprintsPlay?.[y]?.[x]) return false;
  if (S._action) S._action.feet.push({ x, y });
  S.footprintsPlay[y][x] = false;
  S.foundFootprints++;
  S._worldDirty = true;
  return true;
}

function handlePickup(x, y) {
  tryPickup(x, y);
}

function handleSpike(x, y) {
  if (!S.spikes?.[y]?.[x]) return R_CONT;
  S.moving = false; showDead(); return rStop(REASON.spike);
}

function handlePlank(x, y) {
  if (!checkPlankAndMaybeBreakOrDie(x, y)) return R_CONT;
  return rStop(REASON.plank);
}

function handlePit(x, y) {
  if (S.pitActive?.[y]?.[x]) { S.moving = false; showDead(); return rStop(REASON.pit); }
  triggerPitAt(x, y); return R_CONT;
}

function handleHiddenWall(x, y) {
  if (S.hiddenWalls?.[y]?.[x] && !S.hiddenActive?.[y]?.[x]) {
    S.hiddenActive[y][x] = true;
    S._worldDirty = true;
    setTimeout(() => {
      if (S.hiddenActive) {
        S.hiddenActive[y][x] = false;
        S._worldDirty = true;
      }
    }, Math.max(0, S.hiddenDurationSec) * 1000);
  }
}

function handleFragile(x, y) {
  if (!S.fragileWalls?.[y]?.[x]) return R_CONT;
  S.fragileWalls[y][x] = false; S.moving = false; S.target = { x, y };
  S._worldDirty = true;
  return rStop(REASON.fragile);
}

function handleStop(x, y) {
  if (!S.stops?.[y]?.[x]) return R_CONT;
  S.moving = false; S.target = { x, y }; return rStop(REASON.stop);
}

function handleTurner(x, y) {
  if (!S.turners?.[y]?.[x]) return null;
  const d = S.turners[y][x];
  let ndx = 0, ndy = 0;
  if (d === 'U') { ndx = 0; ndy = -1; }
  else if (d === 'D') { ndx = 0; ndy = 1; }
  else if (d === 'L') { ndx = -1; ndy = 0; }
  else { ndx = 1; ndy = 0; }
  S._redirect = { dx: ndx, dy: ndy };
  return rRedirect(ndx, ndy);
}

function handleBouncer(x, y, dx, dy) {
  if (!S.bouncers?.[y]?.[x]) return null;
  const b = S.bouncers[y][x]; let ndx = dx, ndy = dy;
  if (b === 'LU') { if (dx === -1) { ndx = 0; ndy = 1; } else if (dy === -1) { ndx = 1; ndy = 0; } }
  else if (b === 'LD') { if (dx === -1) { ndx = 0; ndy = -1; } else if (dy === 1) { ndx = 1; ndy = 0; } }
  else if (b === 'RU') { if (dx === 1) { ndx = 0; ndy = 1; } else if (dy === -1) { ndx = -1; ndy = 0; } }
  else if (b === 'RD') { if (dx === 1) { ndx = 0; ndy = -1; } else if (dy === 1) { ndx = -1; ndy = 0; } }
  if (ndx !== dx || ndy !== dy) { S._redirect = { dx: ndx, dy: ndy }; return rRedirect(ndx, ndy); }
  return null;
}

function handleCoin(x, y) {
  if (!S.coinsPlay?.[y]?.[x]) return false;
  S.coinsPlay[y][x] = false;
  S._worldDirty = true;
  const gain = Number.isFinite(+S.coinValue) ? +S.coinValue : 10;
  S.coins = (S.coins || 0) + gain; updateCoinsHUD(); showCoinGainAtCell(x, y, gain);
  return true;
}

function handleManhole(x, y) {
  const mid = S.manholes?.[y]?.[x];
  if (mid == null) return R_CONT;
  const dst = getPairedEndFor(mid, x, y);
  if (dst) { S.player.x = dst.x; S.player.y = dst.y; S.moving = false; S.target = { x: dst.x, y: dst.y }; return rStop(REASON.manhole); }
  return R_CONT;
}

function isRotatorArm(x, y) {
  if (!S.rotators) return null;
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  for (let [dx, dy] of dirs) {
    const cx = x + dx;
    const cy = y + dy;
    if (cx >= 0 && cx < S.gridW && cy >= 0 && cy < S.gridH && S.rotators[cy]?.[cx]) {
      return { centerX: cx, centerY: cy };
    }
  }
  return null;
}

function handleRotator(x, y) {
  const rot = isRotatorArm(x, y);
  if (!rot) return R_CONT;
  S.onRotator = true;
  S.rotatorCenter = { x: rot.centerX, y: rot.centerY };
  S.inputLocked = true;
  S.moving = false;
  return rStop(REASON.rotator);
}

function handlePSwitch(x, y) {
  if (S.pSwitchPlay?.[y]?.[x]) {
    activatePSwitch(x, y);
    // 机关已消失，不停止移动
    return { stopped: false, anim: {} };
  }
  return null;
}

function handleBullet(x, y) {
  if (!S.activeBullets) return R_CONT;
  for (let i = 0; i < S.activeBullets.length; i++) {
    const b = S.activeBullets[i];
    // 如果玩家进入的格子，正好有一颗子弹在这里
    if (b.x === x && b.y === y) {
      S.moving = false; 
      showDead(); 
      return rStop('bullet');
    }
  }
  return R_CONT;
}

export function processStep(x, y, dx, dy) {
  const anim = { footprint: false, coin: false };
  if (handleFootprint(x, y)) anim.footprint = true;
  handlePickup(x, y);
  const resSpike = handleSpike(x, y); if (resSpike.stopped) return resSpike;
  const resPlank = handlePlank(x, y); if (resPlank.stopped) return resPlank;
  const resPit = handlePit(x, y); if (resPit.stopped) return resPit;
  handleHiddenWall(x, y);
  const resFragile = handleFragile(x, y); if (resFragile.stopped) return resFragile;
  const resStop = handleStop(x, y); if (resStop.stopped) return resStop;
  const resTurn = handleTurner(x, y); if (resTurn) return resTurn;
  const resBounce = handleBouncer(x, y, dx, dy); if (resBounce) return resBounce;
  if (handleCoin(x, y)) anim.coin = true;
  const endRes = handleManhole(x, y);
  if (endRes.stopped || endRes.redirect) return endRes;

  const rotRes = handleRotator(x, y);
  if (rotRes.stopped) return rotRes;

  const pSwitchRes = handlePSwitch(x, y);
  if (pSwitchRes) return pSwitchRes;

  const resSpike = handleSpike(x, y); if (resSpike.stopped) return resSpike;
  
  // ★ 添加子弹碰撞检测
  const resBullet = handleBullet(x, y); if (resBullet.stopped) return resBullet;

  return { ...R_CONT, anim };
}