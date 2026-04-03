// game.js 聚合层：仅转出子模块 API，避免重复实现
export { slide, computeTargetFrom } from './game/movement.js';
export { updateCoinsHUD, refreshToolBadges } from './game/hud.js';
export { setupPlay, findRandomFloor, resetAfterLose, showDead, checkWin } from './game/logic.js';
export { payOrUse, refundPay } from './game/tools.js';
export { useTeleport, useUndo, useAddSlot } from './game/actions.js';
export { useShuffle } from './game/effects.js';

