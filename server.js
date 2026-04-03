const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = Number(process.env.PORT || 8787);
const ROOT = __dirname;
const TIME_LIMIT_SEC = 180;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/multiplayer' || urlPath === '/multi') {
    return serveFile(path.join(ROOT, 'multiplayer.html'), res);
  }
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(ROOT, safePath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  serveFile(filePath, res);
});

const wss = new WebSocket.Server({ server });

const rooms = new Map();
let levelsBundle = null;
let levelsList = [];

function loadLevelsBundle() {
  if (levelsBundle) return;
  const file = path.join(ROOT, 'assets', 'levels.json');
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf-8');
  levelsBundle = JSON.parse(raw);
  const bag = (levelsBundle && levelsBundle.levels && typeof levelsBundle.levels === 'object')
    ? levelsBundle.levels
    : {};
  levelsList = Object.values(bag);
}

function serveFile(filePath, res) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': type });
    res.end(buf);
  });
}

function makeRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  do {
    id = '';
    for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
  } while (rooms.has(id));
  return id;
}

function safeSend(ws, payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
}

function broadcast(room, payload) {
  safeSend(room.players.A, payload);
  safeSend(room.players.B, payload);
}

function createRoom(ws) {
  const id = makeRoomId();
  rooms.set(id, {
    id,
    players: { A: ws, B: null },
    stats: { A: null, B: null },
    names: { A: ws._name || null, B: null },
    ready: { A: false, B: false },
    timer: null,
  });
  ws._roomId = id;
  ws._role = 'A';
  safeSend(ws, { type: 'room', roomId: id, role: 'A' });
  if (ws._name) safeSend(ws, { type: 'name', role: 'A', name: ws._name });
}

function joinRoom(ws, roomId) {
  const room = rooms.get(roomId);
  if (!room) {
    safeSend(ws, { type: 'error', message: '房间不存在' });
    return;
  }
  if (room.players.B) {
    safeSend(ws, { type: 'error', message: '房间已满' });
    return;
  }
  room.players.B = ws;
  ws._roomId = roomId;
  ws._role = 'B';
  safeSend(ws, { type: 'room', roomId, role: 'B' });
  safeSend(room.players.A, { type: 'room', roomId, role: 'A' });
  if (room.names?.A) safeSend(ws, { type: 'name', role: 'A', name: room.names.A });
  if (ws._name) {
    room.names.B = ws._name;
    safeSend(room.players.A, { type: 'name', role: 'B', name: ws._name });
    safeSend(ws, { type: 'name', role: 'B', name: ws._name });
  }
  startMatch(room);
}

function getRandomLevel() {
  loadLevelsBundle();
  if (!levelsList.length) return null;
  return levelsList[Math.floor(Math.random() * levelsList.length)];
}

function getBundlePayload() {
  loadLevelsBundle();
  if (!levelsBundle) return null;
  return {
    idMap: levelsBundle.idMap,
    itemTypes: levelsBundle.itemTypes,
    coinValue: levelsBundle.coinValue,
    hiddenSec: levelsBundle.hiddenSec,
    gDelaySec: levelsBundle.gDelaySec,
    gStaySec: levelsBundle.gStaySec,
  };
}

function startMatch(room) {
  clearTimeout(room.timer);
  room.stats = { A: null, B: null };
  room.ready = { A: false, B: false };
  const level = getRandomLevel();
  if (!level) {
    broadcast(room, { type: 'error', message: '没有可用关卡' });
    return;
  }
  const startAt = Date.now();
  room.timer = setTimeout(() => endMatch(room, 'time'), TIME_LIMIT_SEC * 1000);
  broadcast(room, {
    type: 'start',
    level,
    bundle: getBundlePayload(),
    timeLimit: TIME_LIMIT_SEC,
    startAt,
  });
}

function endMatch(room, reason, forcedWinner) {
  clearTimeout(room.timer);
  const statsA = room.stats.A || { found: 0, total: 0, pct: 0, painted: 0, totalPaint: 0 };
  const statsB = room.stats.B || { found: 0, total: 0, pct: 0, painted: 0, totalPaint: 0 };
  let winner = forcedWinner || 'tie';
  if (!forcedWinner && reason === 'time') {
    if (statsA.pct > statsB.pct) winner = 'A';
    else if (statsB.pct > statsA.pct) winner = 'B';
  }
  broadcast(room, { type: 'end', reason, winner, scores: { A: statsA, B: statsB } });
}

function leaveRoom(ws) {
  const roomId = ws._roomId;
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (!room) return;
  const role = ws._role;
  if (room.players[role] === ws) room.players[role] = null;
  ws._roomId = null;
  ws._role = null;
  const other = role === 'A' ? room.players.B : room.players.A;
  safeSend(other, { type: 'room_closed', message: '对手已离开房间' });
  rooms.delete(roomId);
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || typeof msg.type !== 'string') return;

    if (msg.type === 'create') return createRoom(ws);
    if (msg.type === 'join') return joinRoom(ws, String(msg.roomId || '').trim().toUpperCase());
    if (msg.type === 'leave') return leaveRoom(ws);

    const roomId = ws._roomId;
    const role = ws._role;
    if (!roomId || !role) return;
    const room = rooms.get(roomId);
    if (!room) return;

    if (msg.type === 'progress') {
      if (msg.stats) room.stats[role] = msg.stats;
      const other = role === 'A' ? 'B' : 'A';
      safeSend(room.players[other], { type: 'progress', role, stats: msg.stats, pos: msg.pos });
      return;
    }

    if (msg.type === 'win') {
      if (msg.stats) room.stats[role] = msg.stats;
      endMatch(room, 'all_items', role);
      return;
    }

    if (msg.type === 'lose') {
      if (msg.stats) room.stats[role] = msg.stats;
      const winner = role === 'A' ? 'B' : 'A';
      endMatch(room, 'bag_full', winner);
      return;
    }

    if (msg.type === 'name') {
      const name = String(msg.name || '').trim().slice(0, 12);
      if (!name) return;
      ws._name = name;
      if (!room.names) room.names = { A: null, B: null };
      room.names[role] = name;
      broadcast(room, { type: 'name', role, name });
      return;
    }

    if (msg.type === 'ready') {
      room.ready[role] = true;
      if (room.ready.A && room.ready.B) startMatch(room);
      return;
    }
  });

  ws.on('close', () => {
    leaveRoom(ws);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
