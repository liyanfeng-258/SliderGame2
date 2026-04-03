// 渲染用的图片缓存与道具图片解析
import { S } from '../state.js';

const _imgCache = new Map();

export function getImgByUrl(url) {
  if (!url) return null;
  let im = _imgCache.get(url);
  if (im) return im;
  im = new Image();
  im.decoding = 'async';
  im.loading = 'eager';
  im.src = url;
  _imgCache.set(url, im);
  return im;
}

export function getItemImgById(id) {
  const t = S.itemTypes?.[id];
  const url = t?.imgPath || t?.img;
  return getImgByUrl(url);
}

