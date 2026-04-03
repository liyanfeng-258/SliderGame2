// 道具支付/退款统一逻辑
import { S } from '../state.js';
import { updateCoinsHUD, refreshToolBadges } from './hud.js';
import { toast } from '../ui/toast.js';

export function refundPay(stockKey, paid){
  if (paid === 'stock') {
    S.toolCounts[stockKey] = (S.toolCounts?.[stockKey]|0) + 1;
  } else if (paid === 'coin') {
    S.coins += (S.toolPrices?.[stockKey]|0) || 0;
    updateCoinsHUD?.();
  }
  refreshToolBadges?.();
}

// 成功返回 'stock' | 'coin'；失败 false
export function payOrUse(stockKey, price){
  const cnt = (S.toolCounts?.[stockKey] | 0);
  if (cnt > 0) {
    S.toolCounts[stockKey] = cnt - 1;
    refreshToolBadges?.();
    return 'stock';
  }
  const need = price | 0;
  if ((S.coins|0) < need) { toast('金币不足'); return false; }
  if (!confirm(`是否消耗 ${need} 金币使用该道具？`)) return false;
  S.coins -= need; updateCoinsHUD?.(); refreshToolBadges?.();
  return 'coin';
}

