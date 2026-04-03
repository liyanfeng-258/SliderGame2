// DOM 引用与画布初始化
import { S } from '../state.js';

export function initCanvasAndDom(getCellMetrics) {
  // canvas 与绘图上下文
  S.canvas = document.getElementById('game');
  S.ctx = S.canvas?.getContext('2d') || null;
  S.getCellMetrics = getCellMetrics;

  // 常用 DOM 引用集中收集
  S.DOM = {
    stage:document.getElementById('stage'),
    mode:document.getElementById('mode'),
    editControls:document.getElementById('editControls'),
    sizeW:document.getElementById('sizeW'), sizeH:document.getElementById('sizeH'), resize:document.getElementById('resize'),
    brush:document.getElementById('brush'),
    itemType:document.getElementById('itemType'), itemName:document.getElementById('itemName'), itemImg:document.getElementById('itemImg'),
    turnDir:document.getElementById('turnDir'), bounceType:document.getElementById('bounceType'),
    turnerControls:document.getElementById('turnerControls'), bouncerControls:document.getElementById('bouncerControls'),
    hiddenControls:document.getElementById('hiddenControls'), itemControls:document.getElementById('itemControls'),
    hiddenSec:document.getElementById('hiddenSec'),
    pitControls:document.getElementById('pitControls'), pitDelay:document.getElementById('pitDelay'), pitStay:document.getElementById('pitStay'),
    rotatorControls:document.getElementById('rotatorControls'), rotatorInterval:document.getElementById('rotatorInterval'),
    pSwitchControls:document.getElementById('pSwitchControls'), pSwitchDuration:document.getElementById('pSwitchDuration'),
    addType:document.getElementById('addType'), clearItems:document.getElementById('clearItems'), removeType:document.getElementById('removeType'),
    levelName:document.getElementById('levelName'), save:document.getElementById('save'), saved:document.getElementById('saved'),
    load:document.getElementById('load'), del:document.getElementById('del'), exportBtn:document.getElementById('export'),
    importBtn:document.getElementById('importBtn'), importFile:document.getElementById('importFile'),
    clearCache:document.getElementById('clearCache'),
    rngObstacles:document.getElementById('rngObstacles'),
    rngItemTotal:document.getElementById('rngItemTotal'),
    rngItemTypes:document.getElementById('rngItemTypes'),
    restart:document.getElementById('restart'), next:document.getElementById('next'),
    painted:document.getElementById('painted'), total:document.getElementById('total'), inventory:document.getElementById('inventory'),
    jsonModal:document.getElementById('jsonModal'), jsonText:document.getElementById('jsonText'), copyJson:document.getElementById('copyJson'),
    loadFromText:document.getElementById('loadFromText'), downloadJson:document.getElementById('downloadJson'), closeJson:document.getElementById('closeJson'),
    loseModal:document.getElementById('loseModal'), retry:document.getElementById('retry'),
    deadModal:document.getElementById('deadModal'), deadOk:document.getElementById('deadOk'),
    clearModal:document.getElementById('clearModal'), clearOk:document.getElementById('clearOk'),
    winModal:document.getElementById('winModal'), winOk:document.getElementById('winOk'),
    status:document.getElementById('status'),
    fxLayer:document.getElementById('fxLayer'),
    footHUD:document.getElementById('footHUD'),
    footFound:document.getElementById('footFound'), footTotal:document.getElementById('footTotal'),
    footResultText:document.getElementById('footResultText'),
    footResultBar:document.getElementById('footResultBar'),
    coinAmount: document.getElementById('coinAmount'),
    toolTeleport: document.getElementById('toolTeleport'),
    toolUndo: document.getElementById('toolUndo'),
    toolShuffle: document.getElementById('toolShuffle'),
    toolSlot: document.getElementById('toolSlot'),
    cntUndo: document.getElementById('cntUndo'),
    cntShuffle: document.getElementById('cntShuffle'),
    cntSlot: document.getElementById('cntSlot'),
    cntTeleport: document.getElementById('cntTeleport'),
    coinSettleNum: document.getElementById('coinSettleNum'),
    levelIndex: document.getElementById('levelIndex'),
    levelTotal: document.getElementById('levelTotal')
  };
}