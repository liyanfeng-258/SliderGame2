// 键盘输入绑定（独立于 game 模块，避免循环）
import { S, KEY } from '../state.js';
import { slide } from '../game.js';

function isAnyModalOpen(){
  const ids = ['winModal','loseModal','deadModal','clearModal','jsonModal'];
  return ids.some(id => S.DOM[id] && getComputedStyle(S.DOM[id]).display !== 'none');
}

export function bindKeys(){
  document.addEventListener('keydown',e=>{
    if(!(e.code in KEY)) return;
    if (S.inputLocked || isAnyModalOpen() || S.shuffleAnim) return;
    e.preventDefault();
    const [dx,dy]=KEY[e.code];
    slide(dx,dy);
  });
}

