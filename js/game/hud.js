// HUD 相关：金币显示与道具角标
import { S } from '../state.js';

export function updateCoinsHUD(){
  if (S.DOM.coinAmount) S.DOM.coinAmount.textContent = String(S.coins|0);
}

export function refreshToolBadges(){
  if (S.DOM.cntUndo)        S.DOM.cntUndo.textContent    = String(S.toolCounts.undo|0);
  if (S.DOM.cntShuffle)     S.DOM.cntShuffle.textContent = String(S.toolCounts.shuffle|0);
  if (S.DOM.cntSlot)        S.DOM.cntSlot.textContent    = String(S.toolCounts.addslot|0);
  if (S.DOM.cntTeleport)    S.DOM.cntTeleport.textContent= String(S.toolCounts.teleport|0);

  const z = (btn, zero, price)=>{ if(!btn) return; btn.classList.toggle('zero', zero); btn.title = zero ? `消耗 ${price} 金币` : ''; };
  z(S.DOM.toolUndo,     (S.toolCounts.undo|0)     <= 0, S.toolPrices.undo);
  z(S.DOM.toolShuffle,  (S.toolCounts.shuffle|0)  <= 0, S.toolPrices.shuffle);
  z(S.DOM.toolSlot,     (S.toolCounts.addslot|0)  <= 0, S.toolPrices.addslot);
  z(S.DOM.toolTeleport, (S.toolCounts.teleport|0) <= 0, S.toolPrices.teleport);
}

