// 动态画笔参数区 + 右侧道具管理行
import { S } from '../state.js';
import { autosave, status, saveGlobalItemTypes, saveIdMap } from '../storage.js';

function clear(el){ while(el.firstChild) el.removeChild(el.firstChild); }

export function mountBrushDynamicRow(){
  const panel = document.createElement('span');
  panel.id = 'brushDynamic';
  panel.style.display = 'inline-flex';
  panel.style.gap = '8px';
  panel.style.marginLeft = '8px';
  panel.style.verticalAlign = 'middle';
  panel.style.alignItems = 'center';
  panel.style.flexWrap = 'nowrap';
  S.DOM.brushDynamic = panel;
  if (S.DOM.brush && S.DOM.brush.parentElement) {
    S.DOM.brush.insertAdjacentElement('afterend', panel);
    S.DOM.brush.style.marginRight = '8px';
  } else if (S.DOM.editControls) {
    S.DOM.editControls.appendChild(panel);
  }

  const row2 = document.createElement('div');
  row2.id = 'itemManageRow';
  row2.style.display = 'none';
  row2.style.gap = '8px';
  row2.style.margin = '6px 0';
  row2.style.alignItems = 'center';
  S.DOM.itemManageRow = row2;
  if (S.DOM.editControls) S.DOM.editControls.appendChild(row2);
}

export function renderBrushUI(){
  const P = S.DOM.brushDynamic; if (!P) return;
  clear(P);
  const b = S.DOM.brush.value;
  const is = (v,...a)=>a.includes(v);
  const lab = t => { const s=document.createElement('span'); s.textContent=t; return s; };
  const makeIdInput = (getVal, setVal) => {
    const ip = document.createElement('input');
    ip.type='number'; ip.placeholder='ID'; ip.classList.add('id-input');
    ip.value = getVal() ?? '';
    ip.addEventListener('change',()=>{ const v=Number(ip.value); if(!Number.isFinite(v)) return; setVal(v); status('已更新 ID：'+v); });
    return ip;
  };

  S.DOM.itemManageRow.style.display = 'none';
  clear(S.DOM.itemManageRow);

  if (is(b,'item')) {
    P.appendChild(lab('道具类型'));
    P.appendChild(S.DOM.itemType);
    const idInput = makeIdInput(
      ()=> (S.itemTypes?.[S.DOM.itemType.value]?.code ?? ''),
      v => { const id=S.DOM.itemType.value; if(!id) return; S.itemTypes[id]=S.itemTypes[id]||{}; S.itemTypes[id].code=v; saveGlobalItemTypes(); }
    );
    P.appendChild(lab('ID')); P.appendChild(idInput);
    const r2 = S.DOM.itemManageRow;
    r2.appendChild(S.DOM.itemName);
    r2.appendChild(S.DOM.itemImg);
    const mk = el => { el.style.marginRight='6px'; return el; };
    r2.appendChild(mk(S.DOM.addType));
    r2.appendChild(mk(S.DOM.removeType));
    r2.appendChild(mk(S.DOM.clearItems));
    r2.style.display = 'flex';
  } else if (is(b,'turner')) {
    P.appendChild(lab('转向')); P.appendChild(S.DOM.turnDir);
    const idInput = makeIdInput(()=> S.idMap['turner'+S.DOM.turnDir.value], v => { S.idMap['turner'+S.DOM.turnDir.value]=v; saveIdMap(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
  } else if (is(b,'bouncer')) {
    P.appendChild(lab('类型')); P.appendChild(S.DOM.bounceType);
    const idInput = makeIdInput(()=> S.idMap['bouncer'+S.DOM.bounceType.value], v => { S.idMap['bouncer'+S.DOM.bounceType.value]=v; saveIdMap(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
  } else if (is(b,'floor')) {
    const idInput = makeIdInput(()=> S.idMap.floor, v => { S.idMap.floor=v; saveIdMap(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
  } else if (is(b,'start','spawn')) {
    const idInput = makeIdInput(()=> S.idMap.start, v => { S.idMap.start=v; saveIdMap(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
  } else if (is(b,'wall')) {
    const idInput = makeIdInput(()=> S.idMap.wall, v => { S.idMap.wall=v; saveIdMap(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
  } else if (is(b,'hidden','hiddenWall')) {
    const idInput = makeIdInput(()=> S.idMap.hiddenWall, v => { S.idMap.hiddenWall=v; saveIdMap(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
    P.appendChild(lab('停留')); P.appendChild(S.DOM.hiddenSec);
  } else if (is(b,'fragile')) {
    const idInput = makeIdInput(()=> S.idMap.fragile, v => { S.idMap.fragile=v; saveIdMap(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
  } else if (is(b,'stop','station')) {
    const idInput = makeIdInput(()=> S.idMap.stop, v => { S.idMap.stop=v; saveIdMap(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
  } else if (is(b,'spike')) {
    const idInput = makeIdInput(()=> S.idMap.spike, v => { S.idMap.spike=v; saveIdMap(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
  } else if (is(b,'pit','pitSpike','groundSpike')) {
    const idInput = makeIdInput(()=> S.idMap.pit, v => { S.idMap.pit=v; saveIdMap(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
    P.appendChild(lab('触发延时')); P.appendChild(S.DOM.pitDelay);
    P.appendChild(lab('停留'));     P.appendChild(S.DOM.pitStay);
  } else if (is(b,'foot','footprint','paw')) {
    const idInput = makeIdInput(()=> S.idMap.footprint, v => { S.idMap.footprint=v; saveIdMap(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
  } else if (is(b,'plank','board','wood')) {
    const idInput = makeIdInput(()=> S.idMap.plank, v => { S.idMap.plank=v; saveIdMap(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
  } else if (is(b,'groundDecor')) {
    const idInput = makeIdInput(()=> S.idMap.groundDecor, v => { S.idMap.groundDecor=v; saveIdMap(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
  } else if (is(b,'coin')) {
    const idInput = makeIdInput(()=> S.idMap.coin, v => { S.idMap.coin=v; saveIdMap(); autosave(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
    const val = document.createElement('input');
    val.type='number'; val.step='1'; val.min='0'; val.style.width='120px';
    val.value = (S.coinValue ?? 10);
    val.addEventListener('change',()=>{ const n=parseFloat(val.value); S.coinValue = Number.isFinite(n)?Math.max(0,n):0; val.value=S.coinValue; autosave(); status('已更新金币价值：+'+S.coinValue); });
    P.appendChild(lab('价值')); P.appendChild(val);
  } else if (is(b,'manhole','well','portal')) {
    const idInput = makeIdInput(()=> S.idMap.manhole, v => { S.idMap.manhole=v; saveIdMap(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
  } else if (is(b,'rotator')) {
    const idInput = makeIdInput(()=> S.idMap.rotator, v => { S.idMap.rotator=v; saveIdMap(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
    P.appendChild(lab('旋转间隔(s)'));
    P.appendChild(S.DOM.rotatorInterval);
  } else if (is(b,'pSwitch')) {
    const idInput = makeIdInput(()=> S.idMap.pSwitch, v => { S.idMap.pSwitch=v; saveIdMap(); });
    P.appendChild(lab('ID')); P.appendChild(idInput);
    P.appendChild(lab('持续时间(s)'));
    P.appendChild(S.DOM.pSwitchDuration);
  }
}

export function bindBrushUIEvents(){
  S.DOM.brush.addEventListener('change', renderBrushUI);
  S.DOM.turnDir?.addEventListener('change', renderBrushUI);
  S.DOM.bounceType?.addEventListener('change', renderBrushUI);
  S.DOM.itemType?.addEventListener('change', renderBrushUI);
}