import { S } from '../state.js';

export function updateToolVisibility() {
  const b = S.DOM.brush.value;
  S.DOM.turnerControls.style.display = (b === 'turner') ? '' : 'none';
  S.DOM.bouncerControls.style.display = (b === 'bouncer') ? '' : 'none';
  S.DOM.hiddenControls.style.display = (b === 'hidden') ? '' : 'none';
  S.DOM.itemControls.style.display = (b === 'item') ? '' : 'none';
  S.DOM.pitControls.style.display = (b === 'pit') ? '' : 'none';
  S.DOM.rotatorControls.style.display = (b === 'rotator') ? '' : 'none';
  S.DOM.pSwitchControls.style.display = (b === 'pSwitch') ? '' : 'none';
  S.DOM.turretControls.style.display = (b === 'turret') ? '' : 'none'; // ★ 添加这行
}