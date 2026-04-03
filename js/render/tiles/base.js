import { S } from '../../state.js';

export function drawBaseGrid(offX, offY, size) {
  const ctx = S.ctx;
  const isEdit = S.DOM.mode?.value === 'edit';
  // 缓存只用于非编辑模式，且需考虑 pSwitchWalls 标记变化
  const canCache = !isEdit && S.grid && S.gridH && S.gridW;
  if (canCache) {
    const dpr = S._dpr || 1;
    const cssW = Math.max(1, Math.round(size * S.gridW));
    const cssH = Math.max(1, Math.round(size * S.gridH));
    // 将 pSwitchWalls 的状态纳入缓存键，确保标记变化时重新生成缓存
    const wallMarkersHash = S.pSwitchWalls ? S.pSwitchWalls.flat().join('') : '';
    const key = `${S.gridW}x${S.gridH}@${size}@${dpr}@${wallMarkersHash}`;
    const cache = S._baseCache;
    if (!cache || cache.key !== key || cache.grid !== S.grid) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      const cctx = canvas.getContext('2d');
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let y = 0; y < S.gridH; y++) {
        for (let x = 0; x < S.gridW; x++) {
          const isWall = S.grid[y][x] === 1;
          if (isWall) {
            const isPSwitchWall = S.pSwitchWalls?.[y]?.[x] === true;
            // 普通墙 #263248，P机关墙淡黄色 #f9e45b
            cctx.fillStyle = isPSwitchWall ? '#f9e45b' : '#263248';
          } else {
            cctx.fillStyle = '#0f1a2d';
          }
          cctx.fillRect(x * size, y * size, size, size);
        }
      }
      S._baseCache = { key, grid: S.grid, canvas, cssW, cssH };
    }
    const src = S._baseCache;
    if (src) {
      ctx.drawImage(src.canvas, offX, offY, src.cssW, src.cssH);
      return;
    }
  }
  // 非缓存模式直接绘制
  for (let y = 0; y < S.gridH; y++) {
    for (let x = 0; x < S.gridW; x++) {
      const isWall = S.grid[y][x] === 1;
      if (isWall) {
        const isPSwitchWall = S.pSwitchWalls?.[y]?.[x] === true;
        ctx.fillStyle = isPSwitchWall ? '#f9e45b' : '#263248';
      } else {
        ctx.fillStyle = '#0f1a2d';
      }
      ctx.fillRect(offX + x * size, offY + y * size, size, size);
      if (S.DOM.mode?.value === 'edit') {
        ctx.strokeStyle = 'rgba(255,255,255,.07)';
        ctx.strokeRect(offX + x * size, offY + y * size, size, size);
      }
    }
  }
}