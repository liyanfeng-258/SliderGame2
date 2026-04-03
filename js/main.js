// main.js
import { S, newEmpty } from './state.js';
import { randomMaze } from './maze.js';
import { draw, getCellMetrics, updateHUD } from './render.js';
import { setupPlay, refreshToolBadges, updateCoinsHUD } from './game.js';
import { bindEditorCanvas, updateToolVisibility } from './editor.js';
import { initCanvasAndDom } from './app/dom.js';
import { bindPlayDrag } from './app/drag.js';
import { bindParamInputs, syncParams } from './app/params.js';
import { mountBrushDynamicRow, renderBrushUI, bindBrushUIEvents } from './app/brushUI.js';
import { applyModeUI, bindModeSwitch } from './app/mode.js';
import { bindButtons } from './app/buttons.js';
import { bindTouchControls } from './app/touch.js';
import { updateLevelHUD } from './app/hud.js';
import { bindKeys } from './app/input.js';
import { bindItemTypeControls } from './app/itemTypes.js';
import { initMultiplayerMode } from './multi/main.js';
import {
  status,
  refreshSavedList,
  applyLevelObject,
  importLevelsFromObject,
  ensureGlobalsLoaded,
  saveIdMap
} from './storage.js';

const MainApp = (() => {
  initCanvasAndDom(getCellMetrics);
  bindPlayDrag();

  try {
    const qs = new URLSearchParams(location.search);
    if (qs.has('debug') || qs.has('dev') || localStorage.getItem('SP_DEBUG') === '1') {
      window.S = S;
    }
  } catch {}

  bindParamInputs();
  ensureGlobalsLoaded();
  mountBrushDynamicRow();
  bindBrushUIEvents();
  bindItemTypeControls();
  renderBrushUI();

  const multi = initMultiplayerMode();
  bindModeSwitch(syncParams, () => setupPlay(false), () => multi.enter(), () => multi.exit());
  bindButtons(syncParams, applyModeUI);
  bindEditorCanvas();
  bindKeys();
  bindTouchControls();

  const settingsBtn = document.getElementById('roomSettingsBtn');
  const settingsModal = document.getElementById('roomSettingsModal');
  const settingsClose = document.getElementById('closeRoomSettings');
  const openRoomSettings = () => { if (settingsModal) settingsModal.style.display = 'flex'; };
  const closeRoomSettings = () => { if (settingsModal) settingsModal.style.display = 'none'; };
  settingsBtn?.addEventListener('click', openRoomSettings);
  settingsClose?.addEventListener('click', closeRoomSettings);
  settingsModal?.addEventListener('click', e => { if (e.target === settingsModal) closeRoomSettings(); });

  refreshSavedList();
  updateLevelHUD();

  if (!Number.isFinite(S.coins)) S.coins = 0;
  S.toolCounts = S.toolCounts || { teleport: 30, undo: 3, shuffle: 3, addslot: 3 };
  S.toolPrices = S.toolPrices || { teleport: 10, undo: 100, shuffle: 300, addslot: 900 };
  updateCoinsHUD?.();
  refreshToolBadges?.();

  let restored = false;
  try {
    const backup = localStorage.getItem('slidepaint-autosave-v2');
    if (backup) {
      const ok = applyLevelObject(JSON.parse(backup));
      if (ok) { restored = true; status('已从自动备份恢复'); }
    }
  } catch {}

  (async function loadServerBundleFirst() {
    try {
      const res = await fetch('assets/levels.json', { cache: 'no-store' });
      if (!res.ok) return;
      const pack = await res.json();

      if (pack.idMap && typeof pack.idMap === 'object') {
        S.idMap = Object.assign({}, S.idMap || {}, pack.idMap);
        saveIdMap?.();
      }
      if (pack.itemTypes && typeof pack.itemTypes === 'object') {
        S.itemTypes = pack.itemTypes;
        bindItemTypeControls();
        renderBrushUI();
      }
      if (typeof pack.coinValue === 'number') S.coinValue = +pack.coinValue || 10;
      if (typeof pack.hiddenSec === 'number') S.hiddenDurationSec = +pack.hiddenSec || 2;
      if (typeof pack.gDelaySec === 'number') S.pitDelaySec = +pack.gDelaySec || 1;
      if (typeof pack.gStaySec === 'number') S.pitStaySec = +pack.gStaySec || 1;

      if (pack.levels) {
        importLevelsFromObject?.({ levels: pack.levels });
        refreshSavedList?.();
      }

      if (!restored) {
        const sel = S.DOM.saved;
        if (sel && sel.options.length) {
          sel.selectedIndex = 0;
          loadLevel?.(sel.value);
          S.DOM.mode.value = 'play';
          applyModeUI?.();
        }
      }
    } catch (e) {
      console.warn('loadServerBundleFirst failed:', e);
    }
  })();

  if (!restored) {
    S.gridW = 15; S.gridH = 15; S.grid = randomMaze(S.gridW, S.gridH);
    S.itemsPlaced = newEmpty(S.gridH, S.gridW, null);
    S.spikes = newEmpty(S.gridH, S.gridW, false);
    S.hiddenWalls = newEmpty(S.gridH, S.gridW, false);
    S.hiddenActive = newEmpty(S.gridH, S.gridW, false);
    S.turners = newEmpty(S.gridH, S.gridW, null);
    S.bouncers = newEmpty(S.gridH, S.gridW, null);
    S.planks = newEmpty(S.gridH, S.gridW, false);
    S.plankBroken = newEmpty(S.gridH, S.gridW, false);
    S.pitSpikes = newEmpty(S.gridH, S.gridW, false);
    S.pitActive = newEmpty(S.gridH, S.gridW, false);
    S.pitTimers = newEmpty(S.gridH, S.gridW, null);
    S.fragilePlaced = newEmpty(S.gridH, S.gridW, false);
    S.stops = newEmpty(S.gridH, S.gridW, false);
    S.footprints = newEmpty(S.gridH, S.gridW, false);
  }

  applyModeUI();
  updateToolVisibility();
  renderBrushUI();

  S.DOM.mode.value = 'play';
  applyModeUI();
  syncParams();
  setupPlay(false);

  const ro = new ResizeObserver(() => { draw(); updateHUD(); });
  ro.observe(document.getElementById('stage'));

  // 强制暴露全局变量（调试用）
  window.S = S;
  window.draw = draw;

  console.log('[main] 初始化完成，S 和 draw 已暴露');
  return {};
})();