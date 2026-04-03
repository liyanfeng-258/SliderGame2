import { S } from './state.js';
import { updateInventoryUI } from './ui/inventory.js';
import { getCellMetrics as calcCellMetrics } from './render/metrics.js';
import { drawBaseGrid } from './render/tiles/base.js';
import { drawFootprint } from './render/tiles/footprint.js';
import { drawCoinTile } from './render/tiles/coin.js';
import { drawManholesGrid, drawManholeGhostAt } from './render/tiles/manhole.js';
import { drawPlank, drawPlankBroken } from './render/tiles/plank.js';
import { drawPitGrid } from './render/tiles/pit.js';
import { drawFragile } from './render/tiles/fragile.js';
import { drawStop } from './render/tiles/stop.js';
import { drawGroundDecor } from './render/tiles/groundDecor.js';
import { drawTurner } from './render/tiles/turner.js';
import { drawBouncer } from './render/tiles/bouncer.js';
import { drawSpike } from './render/tiles/spike.js';
import { drawHiddenGrid } from './render/tiles/hidden.js';
import { drawItem } from './render/tiles/item.js';
import { drawBooleanGrid, drawValueGrid, forEachCell } from './render/utils.js';
import { drawRotatorArm, drawRotatorCenter } from './render/tiles/rotator.js';
import { drawPSwitch } from './render/tiles/pswitch.js';

const Renderer = (() => {

  function updateHUD() {
    if (!S.DOM.painted || !S.DOM.total) return;
    S.DOM.painted.textContent = S.paintedCount ?? 0;
    S.DOM.total.textContent   = S.totalFloor   ?? 0;
    if (S.DOM.footFound) S.DOM.footFound.textContent = S.foundFootprints ?? 0;
    if (S.DOM.footTotal) S.DOM.footTotal.textContent = S.totalFootprints ?? 0;
  }

  function draw() {
    console.log('[draw] 函数被调用，当前模式：', S.DOM.mode?.value);
    if (!S.grid) {
      console.warn('[draw] S.grid 不存在');
      return;
    }
    const H = Array.isArray(S.grid) ? S.grid.length : 0;
    const W = H && Array.isArray(S.grid[0]) ? S.grid[0].length : 0;
    if (!H || !W) {
      console.warn('[draw] 网格尺寸无效');
      return;
    }
    if (S.gridH !== H || S.gridW !== W) { S.gridH = H; S.gridW = W; }

    // 输出机关数量（无条件）
    console.log('[draw] turners 数量：', S.turners?.flat().filter(v=>v).length);
    console.log('[draw] bouncers 数量：', S.bouncers?.flat().filter(v=>v).length);
    console.log('[draw] spikes 数量：', S.spikes?.flat().filter(v=>v).length);
    console.log('[draw] planks 数量：', S.planks?.flat().filter(v=>v).length);
    console.log('[draw] stops 数量：', S.stops?.flat().filter(v=>v).length);
    console.log('[draw] footprints 数量：', S.footprints?.flat().filter(v=>v).length);
    console.log('[draw] coinsGrid 数量：', S.coinsGrid?.flat().filter(v=>v).length);
    console.log('[draw] itemsPlaced 数量：', S.itemsPlaced?.flat().filter(v=>v).length);

    const { size, offX, offY } = calcCellMetrics();
    const ctx = S.ctx;
    ctx.clearRect(0, 0, S.canvas.width, S.canvas.height);

    drawBaseGrid(offX, offY, size);
    if (S.groundDecor) drawBooleanGrid(S.groundDecor, (px, py, s) => drawGroundDecor(px, py, s), offX, offY, size);

    const fragileLayer = (S.DOM.mode?.value === 'edit') ? S.fragilePlaced : S.fragileWalls;
    if (fragileLayer) drawBooleanGrid(fragileLayer, (px, py, s) => drawFragile(px, py, s), offX, offY, size);

    drawBooleanGrid(S.stops, (px, py, s) => drawStop(px, py, s), offX, offY, size);

    const footprintLayer = (S.DOM.mode?.value === 'edit') ? S.footprints : S.footprintsPlay;
    if (footprintLayer) drawBooleanGrid(footprintLayer, (px, py, s) => drawFootprint(px, py, s), offX, offY, size);

    const items = (S.DOM.mode?.value === 'edit') ? S.itemsPlaced : S.itemsPlay;
    if (items) drawValueGrid(items, (px, py, s, id) => drawItem(id, px, py, s, s), offX, offY, size);

    drawBooleanGrid(S.spikes, (px, py, s) => drawSpike(px, py, s), offX, offY, size);
    drawHiddenGrid(S.hiddenWalls, S.hiddenActive, offX, offY, size);
    drawValueGrid(S.turners, (px, py, s, dir) => drawTurner(px, py, s, dir), offX, offY, size);
    drawValueGrid(S.bouncers, (px, py, s, type) => drawBouncer(px, py, s, type), offX, offY, size);
    drawPitGrid(S.pitSpikes, S.pitActive, offX, offY, size);

    drawManholesGrid(S.manholes, offX, offY, size);
    if (S.DOM.mode?.value === 'edit') drawManholeGhostAt(S.manholeGhost, offX, offY, size);

    if (S.planks) {
      forEachCell(S.gridH, S.gridW, (x, y) => {
        if (!S.planks[y]?.[x]) return;
        const px = offX + x * size;
        const py = offY + y * size;
        const broken = (S.DOM.mode?.value === 'play' || S.DOM.mode?.value === 'multi') ? !!S.plankBroken?.[y]?.[x] : false;
        (broken ? drawPlankBroken : drawPlank)(px, py, size);
      });
    }

    const coins = (S.DOM.mode?.value === 'edit') ? S.coinsGrid : S.coinsPlay;
    if (coins) drawBooleanGrid(coins, (px, py, s) => drawCoinTile(px, py, s), offX, offY, size);

    // 旋转台
    if (S.rotators) {
      for (let y = 0; y < S.gridH; y++) {
        for (let x = 0; x < S.gridW; x++) {
          if (S.rotators[y][x]) {
            const arms = [[x, y-1], [x+1, y], [x, y+1], [x-1, y]];
            for (let [ax, ay] of arms) {
              if (ax >= 0 && ax < S.gridW && ay >= 0 && ay < S.gridH) {
                drawRotatorArm(offX + ax * size, offY + ay * size, size);
              }
            }
            const angle = S.rotatorAngles?.[y]?.[x] ?? 0;
            drawRotatorCenter(offX + x * size, offY + y * size, size, angle);
          }
        }
      }
    }

    // P 机关
    const pSwitchLayer = (S.DOM.mode?.value === 'edit') ? S.pSwitchPlaced : S.pSwitchPlay;
    if (pSwitchLayer) {
      for (let y = 0; y < S.gridH; y++) {
        for (let x = 0; x < S.gridW; x++) {
          if (pSwitchLayer[y][x]) {
            drawPSwitch(offX + x * size, offY + y * size, size);
          }
        }
      }
    }

    if (S.DOM.mode?.value === 'edit' && S.startPos) {
      const sx = offX + (S.startPos.x + 0.5) * size;
      const sy = offY + (S.startPos.y + 0.5) * size;
      ctx.lineWidth = 2; ctx.strokeStyle = '#22d3ee'; ctx.fillStyle = 'rgba(34,211,238,.18)';
      ctx.beginPath(); ctx.arc(sx, sy, size * 0.33, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    // 洗牌动画
    if ((S.DOM.mode?.value === 'play' || S.DOM.mode?.value === 'multi') && S.shuffleAnim && Array.isArray(S.shuffleAnim.moving)) {
      const p = S.shuffleAnim.progress || 0;
      for (const m of S.shuffleAnim.moving) {
        const fx = m.fromX + (m.toX - m.fromX) * p;
        const fy = m.fromY + (m.toY - m.fromY) * p;
        drawItem(m.id, offX + fx * size, offY + fy * size, size, size);
      }
    }

    if ((S.DOM.mode?.value === 'play' || S.DOM.mode?.value === 'multi') && (S.player || S.anim)) {
      const px = S.anim ? S.anim.curX : S.player.x;
      const py = S.anim ? S.anim.curY : S.player.y;
      ctx.fillStyle = '#f84802ff';
      ctx.beginPath();
      ctx.arc(offX + (px + 0.5) * size, offY + (py + 0.5) * size, size * 0.33, 0, Math.PI * 2);
      ctx.fill();
    }

    if (S.DOM.mode?.value === 'multi' && S.remotePlayer) {
      const rx = (S.remotePlayer.curX != null) ? S.remotePlayer.curX : S.remotePlayer.x;
      const ry = (S.remotePlayer.curY != null) ? S.remotePlayer.curY : S.remotePlayer.y;
      if (Number.isFinite(rx) && Number.isFinite(ry)) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(offX + (rx + 0.5) * size, offY + (ry + 0.5) * size, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if ((S.DOM.mode?.value === 'play' || S.DOM.mode?.value === 'multi') && S.drag?.returning && !S.drag.active) {
      S.drag.panX *= 0.85;
      S.drag.panY *= 0.85;
      if (Math.hypot(S.drag.panX, S.drag.panY) < 0.5) {
        S.drag.panX = 0; S.drag.panY = 0;
        S.drag.returning = false;
      } else {
        requestAnimationFrame(draw);
      }
    }
  }

  return { getCellMetrics: calcCellMetrics, updateHUD, updateInventoryUI, draw };
})();

export const draw = Renderer.draw;
export const updateHUD = Renderer.updateHUD;
export const getCellMetrics = Renderer.getCellMetrics;
export { updateInventoryUI };