// 面板参数绑定与同步
import { S } from '../state.js';
import { autosave } from '../storage.js';

const f = v => {
  const x = parseFloat(v);
  return Number.isFinite(x) ? Math.max(0, x) : 0;
};

export function bindParamInputs() {
  ['hiddenSec','pitDelay','pitStay','rotatorInterval','pSwitchDuration'].forEach(k=>{
    const el = S.DOM[k];
    if (!el) return;
    el.type = 'number'; el.step = '0.1'; el.min = '0';
  });

  const bindFloat = (el, setter)=>{
    if (!el) return;
    const h = ()=>{ const v = f(el.value); setter(v); el.value = v; autosave(); };
    el.addEventListener('input', h);
    el.addEventListener('change', h);
  };

  bindFloat(S.DOM.hiddenSec, v => S.hiddenDurationSec = v);
  bindFloat(S.DOM.pitDelay,  v => S.pitDelaySec = v);
  bindFloat(S.DOM.pitStay,   v => S.pitStaySec  = v);
  bindFloat(S.DOM.rotatorInterval, v => S.rotatorIntervalSec = v);
  bindFloat(S.DOM.pSwitchDuration, v => S.pSwitchDurationSec = v);
}

export function syncParams(){
  if (S.DOM.hiddenSec) S.hiddenDurationSec = f(S.DOM.hiddenSec.value);
  if (S.DOM.pitDelay)  S.pitDelaySec       = f(S.DOM.pitDelay.value);
  if (S.DOM.pitStay)   S.pitStaySec        = f(S.DOM.pitStay.value);
  if (S.DOM.rotatorInterval) S.rotatorIntervalSec = f(S.DOM.rotatorInterval.value);
  if (S.DOM.pSwitchDuration) S.pSwitchDurationSec = f(S.DOM.pSwitchDuration.value);
}