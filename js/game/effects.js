// 群体动画与打乱逻辑
import { S } from '../state.js';
import { draw } from '../render.js';
import { toast } from '../ui/toast.js';

const easeInOut = t => (t<.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2);

function _collectPets(){
  const list = [];
  for (let y=0; y<S.gridH; y++){
    for (let x=0; x<S.gridW; x++){
      const id = S.itemsPlay?.[y]?.[x];
      if (id) list.push({x,y,id});
    }
  }
  return list;
}

function _shuffle(arr){
  for (let i=arr.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}

export function useShuffle(){
  if (S.inputLocked || S.shuffleAnim || S.moving || isAnyModalOpen()) return;
  const pets = _collectPets();
  if (pets.length <= 1){ toast('没有可打乱的宠物'); return; }
  const targets = pets.map(p => ({x:p.x, y:p.y}));
  _shuffle(targets);
  for (const p of pets) S.itemsPlay[p.y][p.x] = null;
  S._worldDirty = true;
  const moving = pets.map((p,i)=>({ id:p.id, fromX:p.x, fromY:p.y, toX:targets[i].x, toY:targets[i].y }));
  S.shuffleAnim = { moving, t0: performance.now(), dur: 500, progress: 0 };
  S.inputLocked = true;
  requestAnimationFrame(tickShuffleAnim);
}

export function tickShuffleAnim(){
  const A = S.shuffleAnim; if (!A) return;
  const now = performance.now();
  let t = (now - A.t0) / A.dur;
  if (t < 1){
    A.progress = easeInOut(Math.max(0, Math.min(1,t)));
    draw(); requestAnimationFrame(tickShuffleAnim); return;
  }
  for (const m of A.moving) S.itemsPlay[m.toY][m.toX] = m.id;
  S.shuffleAnim = null; S.inputLocked = false; S._worldDirty = true; draw(); toast('已随机打乱宠物位置');
}

function isAnyModalOpen(){
  const ids = ['winModal','loseModal','deadModal','clearModal','jsonModal'];
  return ids.some(id => S.DOM[id] && getComputedStyle(S.DOM[id]).display !== 'none');
}
