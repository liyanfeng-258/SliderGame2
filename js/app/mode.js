// 模式切换（游玩/编辑）
import { S } from '../state.js';
import { setupEditorGrid, bindEditorCanvas } from '../editor.js';
import { draw } from '../render.js';
import { status } from '../storage.js';
import { newEmpty } from '../state.js';

function ensureRotatorArrays() {
  const h = S.grid ? S.grid.length : S.gridH;
  const w = S.grid && S.grid[0] ? S.grid[0].length : S.gridW;
  if (!S.rotators || S.rotators.length !== h || (S.rotators[0] && S.rotators[0].length !== w)) {
    console.log('[mode] 旋转台数组尺寸不匹配，重新初始化');
    S.rotators = newEmpty(h, w, false);
    S.rotatorAngles = newEmpty(h, w, 0);
    S.rotatorTimers = newEmpty(h, w, null);
  } else {
    console.log('[mode] 旋转台数组尺寸匹配，保留现有数据');
  }
}

export function applyModeUI(){
  const mode = S.DOM.mode.value;
  const edit = mode === 'edit';
  const multi = mode === 'multi';
  document.body.classList.toggle('play', mode === 'play');
  document.body.classList.toggle('multi', multi);
  if (S.DOM.editControls) S.DOM.editControls.style.display = edit ? '' : 'none';
  if (S.canvas) S.canvas.style.cursor = edit ? 'crosshair' : 'default';
}

export function bindModeSwitch(syncParams, onEnterPlay, onEnterMulti, onExitMulti){
  let lastMode = S.DOM.mode.value;
  S.DOM.mode.addEventListener('change',()=>{
    const mode = S.DOM.mode.value;
    if (lastMode === 'multi' && mode !== 'multi') onExitMulti?.();
    applyModeUI();
    if (mode === 'edit') {
      if(!S.grid || !S.itemsPlaced){
        setupEditorGrid(S.gridW,S.gridH);
        status('已进入编辑模式');
      }
      ensureRotatorArrays();
      S.moving=false; S.target=null; S.paint=null; draw();
      bindEditorCanvas();
    } else if (mode === 'play') {
      console.log('[mode] 进入游玩模式前，S.rotators 数量：', S.rotators ? S.rotators.flat().filter(v=>v).length : 0);
      syncParams();
      console.log('[mode] syncParams 后，S.rotators 数量：', S.rotators ? S.rotators.flat().filter(v=>v).length : 0);
      onEnterPlay?.();
      console.log('[mode] onEnterPlay 后，S.rotators 数量：', S.rotators ? S.rotators.flat().filter(v=>v).length : 0);
      status('已进入游玩模式');
    } else if (mode === 'multi') {
      onEnterMulti?.();
      status('已进入双人模式');
    }
    lastMode = mode;
  });
}