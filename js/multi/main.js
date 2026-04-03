import { S } from '../state.js';
import { initCanvasAndDom } from '../app/dom.js';
import { bindPlayDrag } from '../app/drag.js';
import { bindKeys } from '../app/input.js';
import { bindTouchControls } from '../app/touch.js';
import { getCellMetrics, draw, updateHUD } from '../render.js';
import { setupPlay } from '../game.js';
import { applyLevelObject, ensureGlobalsLoaded, flipLevelYForImport } from '../storage.js';

const GRID_CELLS = 8;
const GRID_BASE = 5;
const TIME_LIMIT_SEC = 180;

const ui = {
  wsUrl: document.getElementById('wsUrl'),
  roomCode: document.getElementById('roomCode'),
  myName: document.getElementById('myName'),
  setName: document.getElementById('setName'),
  createRoom: document.getElementById('createRoom'),
  joinRoom: document.getElementById('joinRoom'),
  leaveRoom: document.getElementById('leaveRoom'),
  roomStatus: document.getElementById('roomStatus'),
  timeLeft: document.getElementById('timeLeft'),
  pctA: document.getElementById('pctA'),
  pctB: document.getElementById('pctB'),
  footA: document.getElementById('footA'),
  footB: document.getElementById('footB'),
  itemsCountA: document.getElementById('itemsCountA'),
  itemsCountB: document.getElementById('itemsCountB'),
  gridA: document.getElementById('gridA'),
  gridB: document.getElementById('gridB'),
  cardA: document.getElementById('cardA'),
  cardB: document.getElementById('cardB'),
  nameA: document.getElementById('nameA'),
  nameB: document.getElementById('nameB'),
  matchModal: document.getElementById('matchModal'),
  matchTitle: document.getElementById('matchTitle'),
  matchDesc: document.getElementById('matchDesc'),
  rematch: document.getElementById('rematch'),
  exitMatch: document.getElementById('exitMatch'),
};

const net = {
  socket: null,
  roomId: null,
  role: null,
  matchActive: false,
  endAt: 0,
  ready: false,
  lastSent: null,
  progressTimer: null,
  timeTimer: null,
  pending: [],
  stats: {
    A: { found: 0, total: 0, pct: 0, painted: 0, totalPaint: 0 },
    B: { found: 0, total: 0, pct: 0, painted: 0, totalPaint: 0 },
  },
};

let initialized = false;
let gameBound = false;
let rafId = 0;
let lastNameSent = '';

function setStatus(text) {
  if (ui.roomStatus) ui.roomStatus.textContent = text;
}

function formatTime(ms) {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function buildGrid(el, count = GRID_CELLS) {
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const cell = document.createElement('span');
    cell.className = 'cell';
    el.appendChild(cell);
  }
}

function renderItems(el, items, slotCount = GRID_BASE) {
  if (!el) return;
  const maxSlots = Math.max(GRID_BASE, Math.min(GRID_CELLS, slotCount || GRID_BASE));
  if (el.dataset.slots !== String(maxSlots)) {
    buildGrid(el, maxSlots);
    el.dataset.slots = String(maxSlots);
  }
  el.style.setProperty('--slots', String(maxSlots));
  const cells = el.querySelectorAll('.cell');
  const list = Array.isArray(items) ? items.slice(0, maxSlots) : [];
  cells.forEach((cell, idx) => {
    cell.textContent = '';
    cell.style.backgroundImage = '';
    cell.style.backgroundSize = '';
    cell.style.backgroundPosition = '';
    const id = list[idx];
    if (!id) return;
    const info = S.itemTypes?.[id];
    const path = info?.imgPath;
    if (path) {
      cell.style.backgroundImage = `url(${path})`;
      cell.style.backgroundSize = 'cover';
      cell.style.backgroundPosition = 'center';
    }
  });
}

function applyStats(role, stats) {
  if (!role || !stats) return;
  const pct = stats.pct || 0;
  const slots = Math.max(GRID_BASE, Math.min(GRID_CELLS, stats.slotCount || GRID_BASE));
  if (role === 'A') {
    if (ui.pctA) ui.pctA.textContent = `${pct}%`;
    if (ui.footA) ui.footA.textContent = `${stats.found}/${stats.total}`;
    if (ui.itemsCountA) ui.itemsCountA.textContent = `${stats.painted}/${stats.totalPaint}`;
    renderItems(ui.gridA, stats.items, slots);
  } else {
    if (ui.pctB) ui.pctB.textContent = `${pct}%`;
    if (ui.footB) ui.footB.textContent = `${stats.found}/${stats.total}`;
    if (ui.itemsCountB) ui.itemsCountB.textContent = `${stats.painted}/${stats.totalPaint}`;
    renderItems(ui.gridB, stats.items, slots);
  }
}

function refreshCards() {
  ui.cardA?.classList.toggle('active', net.role === 'A');
  ui.cardB?.classList.toggle('active', net.role === 'B');
}

function enableRoomControls(inRoom) {
  ui.leaveRoom.disabled = !inRoom;
  ui.createRoom.disabled = inRoom;
  ui.joinRoom.disabled = inRoom;
}

function ensureSocket() {
  if (net.socket && net.socket.readyState === WebSocket.OPEN) return Promise.resolve();
  if (net.socket && net.socket.readyState === WebSocket.CONNECTING) {
    return new Promise(resolve => {
      const timer = setInterval(() => {
        if (net.socket && net.socket.readyState === WebSocket.OPEN) {
          clearInterval(timer);
          resolve();
        }
      }, 80);
    });
  }
  const url = ui.wsUrl?.value.trim();
  if (!url) {
    setStatus('请输入服务器地址');
    return Promise.reject(new Error('missing url'));
  }

  net.socket = new WebSocket(url);
  net.socket.addEventListener('open', () => {
    setStatus('已连接服务器');
    while (net.pending.length) {
      net.socket.send(JSON.stringify(net.pending.shift()));
    }
  });
  net.socket.addEventListener('close', () => {
    setStatus('连接已断开');
    enableRoomControls(false);
    net.roomId = null;
    net.role = null;
    net.matchActive = false;
  });
  net.socket.addEventListener('error', () => setStatus('连接异常'));
  net.socket.addEventListener('message', onMessage);
  return new Promise(resolve => {
    net.socket.addEventListener('open', resolve, { once: true });
  });
}

function send(payload) {
  if (net.socket && net.socket.readyState === WebSocket.OPEN) {
    net.socket.send(JSON.stringify(payload));
  } else {
    net.pending.push(payload);
  }
}

function onMessage(event) {
  let msg;
  try { msg = JSON.parse(event.data); } catch { return; }
  if (!msg || typeof msg.type !== 'string') return;

  if (msg.type === 'room') {
    net.roomId = msg.roomId;
    net.role = msg.role;
    if (ui.roomCode && msg.roomId) ui.roomCode.value = msg.roomId;
    refreshCards();
    enableRoomControls(true);
    setStatus(`已进入房间 ${msg.roomId}（玩家${msg.role}）`);
    sendNameIfNeeded(true);
    return;
  }

  if (msg.type === 'start') {
    startMatch(msg);
    return;
  }

  if (msg.type === 'progress') {
    const role = msg.role;
    if (role && msg.stats) {
      net.stats[role] = msg.stats;
      applyStats(role, msg.stats);
    }
    if (msg.pos) {
      S.remotePlayer = {
        x: msg.pos.x,
        y: msg.pos.y,
        curX: msg.pos.curX,
        curY: msg.pos.curY,
      };
      draw();
    }
    return;
  }

  if (msg.type === 'name') {
    const role = msg.role;
    if (!role || !msg.name) return;
    if (role === 'A' && ui.nameA) ui.nameA.textContent = msg.name;
    if (role === 'B' && ui.nameB) ui.nameB.textContent = msg.name;
    return;
  }

  if (msg.type === 'end') {
    endMatch(msg);
    return;
  }

  if (msg.type === 'room_closed') {
    setStatus(msg.message || '房间已关闭');
    enableRoomControls(false);
    net.roomId = null;
    net.role = null;
    return;
  }

  if (msg.type === 'error') {
    setStatus(msg.message || '服务器错误');
  }
}

function applyBundle(bundle) {
  if (!bundle) return;
  if (bundle.idMap && typeof bundle.idMap === 'object') {
    S.idMap = { ...(S.idMap || {}), ...bundle.idMap };
  }
  if (bundle.itemTypes && typeof bundle.itemTypes === 'object') {
    S.itemTypes = bundle.itemTypes;
  }
  if (typeof bundle.coinValue === 'number') S.coinValue = +bundle.coinValue || 10;
  if (typeof bundle.hiddenSec === 'number') S.hiddenDurationSec = +bundle.hiddenSec || 2;
  if (typeof bundle.gDelaySec === 'number') S.pitDelaySec = +bundle.gDelaySec || 1;
  if (typeof bundle.gStaySec === 'number') S.pitStaySec = +bundle.gStaySec || 1;
}

function getLocalStats() {
  const found = S.foundFootprints || 0;
  const total = S.totalFootprints || 0;
  const pct = total ? Math.round(found / total * 100) : 0;
  const painted = S.paintedCount || 0;
  const totalPaint = S.totalFloor || 0;
  const items = Array.isArray(S.inventory) ? S.inventory.slice(0, GRID_CELLS) : [];
  const slotCount = Math.max(GRID_BASE, Math.min(GRID_CELLS, 5 + (S.extraSlotsUsed || 0)));
  return { found, total, pct, painted, totalPaint, items, slotCount };
}

function getLocalPos() {
  if (!S.player) return { x: 0, y: 0, curX: 0, curY: 0 };
  if (S.anim) {
    return { x: S.player.x, y: S.player.y, curX: S.anim.curX, curY: S.anim.curY };
  }
  return { x: S.player.x, y: S.player.y, curX: S.player.x, curY: S.player.y };
}

function sendProgress(force = false) {
  if (!net.matchActive || !net.roomId || !net.role) return;
  const stats = getLocalStats();
  const pos = getLocalPos();
  applyStats(net.role, stats);
  const last = net.lastSent;
  const changed = force || !last ||
    last.found !== stats.found ||
    last.total !== stats.total ||
    last.painted !== stats.painted ||
    last.totalPaint !== stats.totalPaint ||
    Math.abs((last.pos?.curX ?? 0) - pos.curX) > 0.01 ||
    Math.abs((last.pos?.curY ?? 0) - pos.curY) > 0.01;
  if (changed) {
    net.lastSent = { ...stats, pos };
    send({ type: 'progress', roomId: net.roomId, stats, pos });
  }
}

function startProgressLoop() {
  clearInterval(net.progressTimer);
  net.progressTimer = setInterval(() => {
    sendProgress(false);
  }, 80);
}

function startTimer(startAt, limitSec) {
  clearInterval(net.timeTimer);
  const base = Number.isFinite(startAt) ? startAt : Date.now();
  net.endAt = base + limitSec * 1000;
  ui.timeLeft.textContent = formatTime(net.endAt - Date.now());
  net.timeTimer = setInterval(() => {
    const left = net.endAt - Date.now();
    ui.timeLeft.textContent = formatTime(left);
  }, 250);
}

function handleLocalWin() {
  if (!net.matchActive) return;
  S.inputLocked = true;
  send({
    type: 'win',
    roomId: net.roomId,
    stats: getLocalStats(),
  });
  setStatus('已完成所有道具，等待对手结算');
}

function startMatch(msg) {
  net.matchActive = true;
  net.lastSent = null;
  net.ready = false;
  S.remotePlayer = null;
  net.stats.A = { found: 0, total: 0, pct: 0, painted: 0, totalPaint: 0, items: [], slotCount: GRID_BASE };
  net.stats.B = { found: 0, total: 0, pct: 0, painted: 0, totalPaint: 0, items: [], slotCount: GRID_BASE };
  applyStats('A', net.stats.A);
  applyStats('B', net.stats.B);
  applyBundle(msg.bundle);
  applyLevelObject(flipLevelYForImport(msg.level));
  S.onWin = handleLocalWin;
  S.onAction = () => sendProgress(true);
  S.onLose = handleLocalLose;
  setupPlay(false);
  draw();
  updateHUD();
  startTimer(msg.startAt || Date.now(), msg.timeLimit || TIME_LIMIT_SEC);
  startProgressLoop();
  startPosLoop();
  ui.matchModal.style.display = 'none';
  setStatus('对局开始');
}

function endMatch(msg) {
  net.matchActive = false;
  clearInterval(net.timeTimer);
  clearInterval(net.progressTimer);
  stopPosLoop();
  S.inputLocked = true;
  if (S.DOM.loseModal) S.DOM.loseModal.style.display = 'none';
  const scores = msg.scores || {};
  if (scores.A) applyStats('A', scores.A);
  if (scores.B) applyStats('B', scores.B);

  let title = '本局结束';
  if (msg.winner === 'tie') title = '平局';
  else if (msg.winner === net.role) title = '你赢了';
  else title = '你输了';

  const reasonMap = {
    time: '时间到，按脚印百分比判定',
    all_items: '有玩家完成所有道具',
    bag_full: '有玩家背包已满',
  };
  const reason = reasonMap[msg.reason] || '结算完成';
  ui.matchTitle.textContent = title;
  ui.matchDesc.textContent = reason;
  ui.matchModal.style.display = 'flex';
  setStatus('等待下一局');
}

function handleLocalLose() {
  if (!net.matchActive) return;
  if (S.DOM.loseModal) S.DOM.loseModal.style.display = 'none';
  S.inputLocked = false;
  S.gameEnded = false;
  setupPlay(false);
  setStatus('背包已满，已重来');
}

function posTick() {
  if (!net.matchActive) { rafId = 0; return; }
  if (S.anim || S.moving) sendProgress(false);
  rafId = requestAnimationFrame(posTick);
}

function startPosLoop() {
  if (!rafId) rafId = requestAnimationFrame(posTick);
}

function stopPosLoop() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
}

function initUI() {
  if (ui.wsUrl && !ui.wsUrl.value) ui.wsUrl.value = `ws://${location.host}`;
  buildGrid(ui.gridA, GRID_BASE);
  buildGrid(ui.gridB, GRID_BASE);
  ui.timeLeft.textContent = formatTime(TIME_LIMIT_SEC * 1000);

  ui.setName?.addEventListener('click', () => sendNameIfNeeded(true));
  ui.myName?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendNameIfNeeded(true);
  });

  ui.createRoom.addEventListener('click', async () => {
    try {
      await ensureSocket();
      send({ type: 'create' });
    } catch {}
  });
  ui.joinRoom.addEventListener('click', async () => {
    const code = ui.roomCode?.value.trim().toUpperCase();
    if (!code) {
      setStatus('请输入房间号');
      return;
    }
    try {
      await ensureSocket();
      send({ type: 'join', roomId: code });
    } catch {}
  });
  ui.leaveRoom.addEventListener('click', () => {
    if (net.roomId) send({ type: 'leave', roomId: net.roomId });
    enableRoomControls(false);
    net.roomId = null;
    net.role = null;
    setStatus('已离开房间');
  });
  ui.rematch.addEventListener('click', () => {
    if (!net.roomId) return;
    net.ready = true;
    send({ type: 'ready', roomId: net.roomId });
    ui.matchDesc.textContent = '已准备，等待对手';
  });
  ui.exitMatch.addEventListener('click', () => {
    if (net.roomId) send({ type: 'leave', roomId: net.roomId });
    ui.matchModal.style.display = 'none';
    enableRoomControls(false);
    setStatus('已退出房间');
  });
}

function initGame() {
  if (!S.canvas) initCanvasAndDom(getCellMetrics);
  if (!gameBound) {
    bindPlayDrag();
    bindKeys();
    bindTouchControls();
    gameBound = true;
  }
  ensureGlobalsLoaded();
  refreshCards();
  draw();
}

export function initMultiplayerMode() {
  if (!initialized) {
    initUI();
    initGame();
    initialized = true;
  }
  return {
    enter() {
      if (ui.nameA) ui.nameA.textContent = '玩家A';
      if (ui.nameB) ui.nameB.textContent = '玩家B';
      refreshCards();
      S.inputLocked = true;
      setStatus('双人模式：创建或加入房间');
    },
    exit() {
      S.onWin = null;
      S.onAction = null;
      S.onLose = null;
      S.remotePlayer = null;
      S.inputLocked = false;
      clearInterval(net.timeTimer);
      clearInterval(net.progressTimer);
      stopPosLoop();
      if (net.socket) {
        try { net.socket.close(); } catch {}
      }
      net.socket = null;
      net.roomId = null;
      net.role = null;
      net.matchActive = false;
      enableRoomControls(false);
      setStatus('—');
      ui.matchModal.style.display = 'none';
    },
  };
}

function sendNameIfNeeded(force) {
  const name = (ui.myName?.value || '').trim();
  if (!name) return;
  if (!force && name === lastNameSent) return;
  lastNameSent = name;
  if (net.roomId) send({ type: 'name', roomId: net.roomId, name });
  if (net.role === 'A' && ui.nameA) ui.nameA.textContent = name;
  if (net.role === 'B' && ui.nameB) ui.nameB.textContent = name;
}
