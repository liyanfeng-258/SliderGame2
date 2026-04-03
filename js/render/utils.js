// Small helpers to iterate and render grid layers
export function forEachCell(H, W, fn) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) fn(x, y);
}

export function drawBooleanGrid(layer, drawFn, offX, offY, size) {
  const H = layer?.length || 0; if (!H) return;
  const W = layer[0]?.length || 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (layer[y]?.[x]) drawFn(offX + x * size, offY + y * size, size);
    }
  }
}

export function drawValueGrid(grid, drawFn, offX, offY, size) {
  const H = grid?.length || 0; if (!H) return;
  const W = grid[0]?.length || 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = grid[y]?.[x];
      if (v) drawFn(offX + x * size, offY + y * size, size, v);
    }
  }
}

