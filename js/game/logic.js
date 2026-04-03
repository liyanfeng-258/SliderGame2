// 核心流程：开局/重开/随机出生/失败与死亡弹窗
import { S, randInt, newEmpty, deepCopy2D } from '../state.js';
import { draw, updateHUD, updateInventoryUI } from '../render.js';
import { updateCoinsHUD, refreshToolBadges } from './hud.js';

// 旋转台相关函数
function startRotatorTimer(cx, cy) {
  if (!S.rotatorTimers) return;
  if (!S.rotatorTimers[cy]) {
    S.rotatorTimers[cy] = new Array(S.gridW).fill(null);
  }
  if (S.rotatorTimers[cy][cx]) {
    clearTimeout(S.rotatorTimers[cy][cx]);
    S.rotatorTimers[cy][cx] = null;
  }
  const interval = Math.max(0.1, S.rotatorIntervalSec) * 1000;
  S.rotatorTimers[cy][cx] = setTimeout(() => {
    rotateRotator(cx, cy);
  }, interval);
}

function rotateRotator(cx, cy) {
  if (!S.rotators || !S.rotators[cy] || !S.rotators[cy][cx]) return;

  let angle = S.rotatorAngles[cy][cx] || 0;
  angle = (angle + 1) % 4;
  S.rotatorAngles[cy][cx] = angle;

  const arms = [
    { x: cx, y: cy - 1 },
    { x: cx + 1, y: cy },
    { x: cx, y: cy + 1 },
    { x: cx - 1, y: cy }
  ];

  let playerOnRotator = false;
  let currentArmIndex = -1;
  if (S.player) {
    for (let i = 0; i < arms.length; i++) {
      if (S.player.x === arms[i].x && S.player.y === arms[i].y) {
        playerOnRotator = true;
        currentArmIndex = i;
        break;
      }
    }
  }

  if (playerOnRotator && currentArmIndex !== -1) {
    const nextIndex = (currentArmIndex + 1) % 4;
    const newPos = arms[nextIndex];
    if (newPos.x >= 0 && newPos.x < S.gridW && newPos.y >= 0 && newPos.y < S.gridH) {
      S.player.x = newPos.x;
      S.player.y = newPos.y;
      S.onRotator = true;
      S.rotatorCenter = { x: cx, y: cy };
      S.inputLocked = false;
    } else {
      S.onRotator = false;
      S.rotatorCenter = null;
      S.inputLocked = false;
    }
  } else {
    S.inputLocked = false;
  }

  draw();
  startRotatorTimer(cx, cy);
}

// P 机关激活函数
export function activatePSwitch(x, y) {
  if (!S.pSwitchPlay || !S.pSwitchPlay[y]?.[x]) return;

  // 取消已有计时器
  if (S.pSwitchTimer) {
    clearTimeout(S.pSwitchTimer);
  }

  // 记录当前所有金币的位置
  const coinsPos = [];
  for (let yy = 0; yy < S.gridH; yy++) {
    for (let xx = 0; xx < S.gridW; xx++) {
      if (S.coinsPlay[yy][xx]) {
        coinsPos.push({ x: xx, y: yy });
      }
    }
  }

  // 保存快照
  S.pSwitchSnapshot = { coins: coinsPos };

  // 将所有金币变为墙
  for (const pos of coinsPos) {
    S.grid[pos.y][pos.x] = 1;
    S.coinsPlay[pos.y][pos.x] = false;
    // 标记为 P 机关墙
    if (!S.pSwitchWalls) S.pSwitchWalls = newEmpty(S.gridH, S.gridW, false);
    S.pSwitchWalls[pos.y][pos.x] = true;
  }

  // 删除 P 机关本身
  S.pSwitchPlay[y][x] = false;
  // 机关所在格变为普通地板（确保可通行）
  S.grid[y][x] = 0;

  // 标记激活状态
  S.pSwitchActive = true;

  // 启动计时器
  const duration = Math.max(0, S.pSwitchDurationSec) * 1000;
  S.pSwitchTimer = setTimeout(() => {
    // 恢复金币
    if (S.pSwitchSnapshot) {
      for (const pos of S.pSwitchSnapshot.coins) {
        S.grid[pos.y][pos.x] = 0;
        S.coinsPlay[pos.y][pos.x] = true;
        if (S.pSwitchWalls) S.pSwitchWalls[pos.y][pos.x] = false;
      }
    }
    S.pSwitchActive = false;
    S.pSwitchTimer = null;
    S.pSwitchSnapshot = null;
    draw();
  }, duration);

  draw();
}

export function setupPlay(newRandom = false) {
  if (S.DOM.mode?.value !== 'multi') S.DOM.mode.value = 'play';
  S.moving = false; S.inputLocked = false; S.target = null;
  S.actionStack = [];
  S._worldDirty = true;

  S.plankBroken = newEmpty(S.gridH, S.gridW, false);
  S.pitActive   = newEmpty(S.gridH, S.gridW, false);
  S.pitTimers   = newEmpty(S.gridH, S.gridW, null);
  S.fragileWalls = deepCopy2D(S.fragilePlaced || newEmpty(S.gridH, S.gridW, false));

  S.itemsPlay = deepCopy2D(S.itemsPlaced || newEmpty(S.gridH, S.gridW, null));
  S.inventory = []; S.extraSlotsUsed = 0; updateInventoryUI();
  S.coinsPlay = deepCopy2D(S.coinsGrid || newEmpty(S.gridH, S.gridW, false));

  let total = 0; for (let y = 0; y < S.gridH; y++) for (let x = 0; x < S.gridW; x++) if (S.itemsPlay[y][x]) total++;
  S.totalFloor = total; S.paintedCount = 0;

  S.footprintsPlay = deepCopy2D(S.footprints || newEmpty(S.gridH, S.gridW, false));
  let footTotal = 0; for (let y = 0; y < S.gridH; y++) for (let x = 0; x < S.gridW; x++) if (S.footprintsPlay[y][x]) footTotal++;
  S.totalFootprints = footTotal; S.foundFootprints = 0;

  const s = (S.startPos && S.grid[S.startPos.y]?.[S.startPos.x] === 0) ? { ...S.startPos } : findRandomFloor();
  S.player = s;
  if (!S.camera) S.camera = { x: s.x + 0.5, y: s.y + 0.5, smooth: (S.camera?.smooth ?? 10) };
  else { S.camera.x = s.x + 0.5; S.camera.y = s.y + 0.5; }
  S._lastTs = performance.now();

  // 清理旧的旋转台计时器
  if (S.rotatorTimers) {
    for (let y = 0; y < S.gridH; y++) {
      if (S.rotatorTimers[y]) {
        for (let x = 0; x < S.gridW; x++) {
          if (S.rotatorTimers[y][x]) {
            clearTimeout(S.rotatorTimers[y][x]);
          }
        }
      }
    }
  }

  // 旋转台初始化
  if (!S.rotators) {
    S.rotators = newEmpty(S.gridH, S.gridW, false);
  }
  S.rotatorAngles = deepCopy2D(S.rotators.map(row => row.map(v => v ? 0 : 0)));
  S.rotatorTimers = newEmpty(S.gridH, S.gridW, null);
  for (let y = 0; y < S.gridH; y++) {
    for (let x = 0; x < S.gridW; x++) {
      if (S.rotators[y][x]) {
        startRotatorTimer(x, y);
      }
    }
  }
  S.onRotator = false;
  S.rotatorCenter = null;

  // P 机关初始化
  if (S.pSwitchTimer) {
    clearTimeout(S.pSwitchTimer);
  }
  S.pSwitchPlay = deepCopy2D(S.pSwitchPlaced || newEmpty(S.gridH, S.gridW, false));
  S.pSwitchActive = false;
  S.pSwitchTimer = null;
  S.pSwitchSnapshot = null;
  S.pSwitchWalls = newEmpty(S.gridH, S.gridW, false);   // 初始化标记数组

  // ====== ★ 炮台与子弹逻辑开始 ======
  // 1. 清理旧的定时器和子弹
  if (S.turretTimers) S.turretTimers.forEach(t => clearInterval(t));
  if (S.bulletTimer) clearInterval(S.bulletTimer);
  S.turretTimers = [];
  S.activeBullets = [];

  // 2. 读取 HTML 上的设定时间
  S.turretIntervalSec = parseFloat(S.DOM.turretInterval?.value || 2);
  S.bulletSpeedSec = parseFloat(S.DOM.bulletSpeed?.value || 0.2);

  // 3. 为地图上的每一个炮台启动定时发射器
  if (S.turrets) {
    for (let y = 0; y < S.gridH; y++) {
      for (let x = 0; x < S.gridW; x++) {
        if (S.turrets[y][x]) {
          const dir = S.turrets[y][x];
          const tId = setInterval(() => {
            if (S.DOM.mode?.value !== 'play' && S.DOM.mode?.value !== 'multi') return;
            if (S.inputLocked || S.gameEnded) return;
            // 在炮台位置生成一颗对应方向的子弹
            S.activeBullets.push({ x, y, dir });
            draw();
          }, Math.max(0.5, S.turretIntervalSec) * 1000);
          S.turretTimers.push(tId);
        }
      }
    }
  }

  // 4. 启动子弹飞行全局循环 (按照设定的速度，每隔几百毫秒往前挪一格)
  S.bulletTimer = setInterval(() => {
    if (S.DOM.mode?.value !== 'play' && S.DOM.mode?.value !== 'multi') return;
    if (S.inputLocked || S.gameEnded) return;
    if (!S.activeBullets || S.activeBullets.length === 0) return;

    // 倒序遍历数组，方便在飞行途中销毁子弹
    for (let i = S.activeBullets.length - 1; i >= 0; i--) {
        let b = S.activeBullets[i];
        
        // 子弹移动
        if (b.dir === 'U') b.y--;
        else if (b.dir === 'D') b.y++;
        else if (b.dir === 'L') b.x--;
        else if (b.dir === 'R') b.x++;

        // 如果越界，或者撞到了墙（不是炮台本身的墙），则销毁子弹
        if (b.x < 0 || b.y < 0 || b.x >= S.gridW || b.y >= S.gridH || (S.grid[b.y][b.x] === 1 && (!S.turrets || !S.turrets[b.y][b.x]))) {
            S.activeBullets.splice(i, 1);
            continue;
        }

        // 如果子弹碰到了玩家所在的格子 -> 玩家死亡！
        if (S.player && b.x === S.player.x && b.y === S.player.y) {
            S.moving = false;
            showDead(); // 触发死亡弹窗
            break;
        }
    }
    draw();
  }, Math.max(0.05, S.bulletSpeedSec) * 1000);
  // ====== ★ 炮台逻辑结束 ======

  refreshToolBadges();
  draw(); updateHUD();
  S.moveHistory = []; S.gameEnded = false; updateCoinsHUD();
}

export function findRandomFloor() {
  let x = 0, y = 0;
  while (true) {
    x = randInt(S.gridW); y = randInt(S.gridH);
    if (S.grid[y][x] === 0 && !isObstacleAt(x, y)) return { x, y };
  }
}

export function resetAfterLose(){
  S.DOM.loseModal.style.display='none';
  S.inputLocked = false;
  setupPlay(false);
}

export function showDead() {
  S.inputLocked = true;
  S.DOM.deadModal.style.display = 'flex';
}

export function checkWin(){
  if (S.gameEnded) return;
  if (S.paintedCount >= S.totalFloor) {
    if (hasRemainingItems()) return;
    const found = S.foundFootprints || 0;
    const total = S.totalFootprints || 0;
    const pct   = total ? Math.round(found / total * 100) : 0;
    if (typeof S.onWin === 'function') {
      S.gameEnded = true;
      S.onWin({ found, total, pct });
      return;
    }
    if (S.DOM.footResultText) S.DOM.footResultText.textContent = `${found} / ${total}（${pct}%）`;
    if (S.DOM.footResultBar)  S.DOM.footResultBar.style.width = pct + '%';
    S.gameEnded = true;
    const add = pct; S.coins = (S.coins|0) + add;
    if (S.DOM.coinSettleNum) S.DOM.coinSettleNum.textContent = String(add);
    updateCoinsHUD();
    S.inputLocked = true; S.DOM.winModal.style.display = 'flex';
  }
}

function hasRemainingItems() {
  const items = S.itemsPlay;
  if (!items) return false;
  for (let y = 0; y < items.length; y++) {
    const row = items[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      if (row[x]) return true;
    }
  }
  return false;
}

function isObstacleAt(x, y) {
  return !!(
    S.planks?.[y]?.[x] || S.spikes?.[y]?.[x] || S.hiddenActive?.[y]?.[x] || S.hiddenWalls?.[y]?.[x] ||
    S.turners?.[y]?.[x] || S.bouncers?.[y]?.[x] || S.pitSpikes?.[y]?.[x] || S.fragileWalls?.[y]?.[x]
  );
}