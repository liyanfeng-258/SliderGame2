// Global state container and shared helpers

const DEFAULT_TOOL_COUNTS = Object.freeze({ teleport: 30, undo: 3, shuffle: 3, addslot: 3 });
const DEFAULT_TOOL_COSTS  = Object.freeze({ teleport: 10, undo: 100, shuffle: 300, addslot: 900 });
const DEFAULT_CAMERA = Object.freeze({ x: 0.5, y: 0.5, smooth: 12, lockDuringMove: true, pixelSnap: true });
const DEFAULT_EDIT_PAN = Object.freeze({ x: 0, y: 0, dragging: false, sx: 0, sy: 0, ox: 0, oy: 0 });
const DEFAULT_DRAG = Object.freeze({ active: false, panX: 0, panY: 0, startX: 0, startY: 0, startPanX: 0, startPanY: 0, returning: false });

const STORAGE_KEYS = Object.freeze({
  levels: 'slidepaint-levels-v5',
  autosave: 'slidepaint-autosave-v2',
  itemTypes: 'slidepaint-itemtypes-v1',
});

export const KEY = Object.freeze({
  ArrowUp: [0, -1],   KeyW: [0, -1],
  ArrowDown: [0, 1],  KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
});

export const LS_KEY = STORAGE_KEYS.levels;
export const AUTOSAVE_KEY = STORAGE_KEYS.autosave;
export const ITEM_TYPES_KEY = STORAGE_KEYS.itemTypes;

export const S = createState();

export function createState(overrides = {}) {
  const state = {
    gridW: 15,
    gridH: 15,
    grid: null,

    player: null,
    remotePlayer: null,
    paint: null,
    paintColor: '#f00',
    paintedCount: 0,
    totalFloor: 0,
    moving: false,
    target: null,
    startPos: null,

    itemsPlaced: null,
    itemsPlay: null,
    spikes: null,
    hiddenWalls: null,
    hiddenActive: null,
    hiddenDurationSec: 2,
    turners: null,
    bouncers: null,
    planks: null,
    plankBroken: null,
    groundDecor: null,

    pitSpikes: null,
    pitActive: null,
    pitTimers: null,
    pitDelaySec: 1,
    pitStaySec: 1,

    stops: null,
    fragilePlaced: null,
    fragileWalls: null,

    footprints: null,
    footprintsPlay: null,
    totalFootprints: 0,
    foundFootprints: 0,

    itemTypes: {},
    itemIdCounter: 1,
    inventory: [],

    canvas: null,
    ctx: null,

    minCellSizePx: 32,
    editPan: { ...DEFAULT_EDIT_PAN },

    stepDurationMs: 40,
    anim: null,

    coins: 0,
    toolCounts: { ...DEFAULT_TOOL_COUNTS },
    toolCosts: { ...DEFAULT_TOOL_COSTS },
    toolPrices: null,
    extraSlotsUsed: 0,
    maxExtraSlotsPerRun: 3,

    actionStack: [],

    coinsGrid: null,
    coinsPlay: null,
    coinValue: 10,

    moveHistory: [],
    gameEnded: false,
    shuffleAnim: null,
    inputLocked: false,
    onWin: null,
    onLose: null,
    onAction: null,

    fixedView: true,
    viewW: 13,
    viewH: 13,
    camera: { ...DEFAULT_CAMERA },

    drag: { ...DEFAULT_DRAG },

    manholes: null,
    manholePairs: [],
    manholeGhost: null,
    nextManholeId: 1,

    // 旋转台
    rotators: null,
    rotatorAngles: null,
    rotatorTimers: null,
    rotatorIntervalSec: 2.0,
    onRotator: false,
    rotatorCenter: null,

    // P 机关
    pSwitchPlaced: null,      // 编辑层
    pSwitchPlay: null,        // 游玩层
    pSwitchActive: false,
    pSwitchTimer: null,
    pSwitchSnapshot: null,
    pSwitchDurationSec: 5.0,
    pSwitchWalls: null,       // 标记哪些墙是由 P 机关变出的

    DOM: {},
  };

  Object.assign(state, overrides);
  return state;
}

export function resetState(overrides = {}) {
  const next = createState(overrides);
  for (const key of Object.keys(S)) delete S[key];
  Object.assign(S, next);
}

export const randInt = n => Math.floor(Math.random() * n);
export const randColor = () => `hsl(${randInt(360)} 75% 52%)`;
export const newEmpty = (h, w, fill = 0) => Array.from({ length: h }, () => Array(w).fill(fill));
export const deepCopy2D = a => a.map(r => r.slice());

export { STORAGE_KEYS };