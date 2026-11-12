// Photos in and out: signed URLs for the private bucket, demo files shipped
// with the site, and in-browser resize + EXIF strip before upload.
import { useEffect, useState } from 'preact-htm';
import { sb } from './core.js';

export const BUCKET = 'sp-photos';
const TTL = 3600;
const cache = new Map(); // path -> { url, exp }
let queue = new Map();   // path -> [resolve]
let timer = null;

export const demoUrl = (path) => new URL('demo/' + path, document.baseURI).href;

export function cachedUrl(path, isDemo) {
  if (!path) return null;
  if (isDemo) return demoUrl(path);
  const hit = cache.get(path);
  return hit && hit.exp > Date.now() + 60_000 ? hit.url : null;
}

export function resolveUrl(path, isDemo) {
  const hit = cachedUrl(path, isDemo);
  if (hit || !path) return Promise.resolve(hit);
  return new Promise((resolve) => {
    if (!queue.has(path)) queue.set(path, []);
    queue.get(path).push(resolve);
    if (!timer) timer = setTimeout(flush, 12);
  });
}

async function flush() {
  const q = queue;
  queue = new Map();
  timer = null;
  const paths = [...q.keys()];
  for (let i = 0; i < paths.length; i += 100) {
    const chunk = paths.slice(i, i + 100);
    try {
      const { data, error } = await sb.storage.from(BUCKET).createSignedUrls(chunk, TTL);
      if (error) throw error;
      for (const row of data) {
        const url = row.signedUrl || null;
        if (url) cache.set(row.path, { url, exp: Date.now() + TTL * 1000 });
        (q.get(row.path) || []).forEach((r) => r(url));
        q.delete(row.path);
      }
    } catch (e) {
      console.warn('signed urls failed', e);
    }
  }
  q.forEach((rs) => rs.forEach((r) => r(null)));
}

export function usePhoto(path, isDemo) {
  const [url, setUrl] = useState(() => cachedUrl(path, isDemo));
  useEffect(() => {
    let live = true;
    setUrl(cachedUrl(path, isDemo));
    resolveUrl(path, isDemo).then((u) => live && setUrl(u));
    return () => { live = false; };
  }, [path, isDemo]);
  return url;
}

// ---------------------------------------------------------------- processing
// Drawing onto a canvas and re-encoding keeps only pixels: EXIF (GPS, camera,
// timestamps) never leaves the phone.
async function decode(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      await img.decode();
      return img;
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}

async function encode(src, maxEdge, quality) {
  const sw = src.width || src.naturalWidth;
  const sh = src.height || src.naturalHeight;
  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, w, h);
  let blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', quality));
  if (!blob || blob.type !== 'image/webp') blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
  if (!blob) throw new Error('encode failed');
  return { blob, width: w, height: h };
}

export async function processPhoto(file) {
  if (!file || !/^image\//.test(file.type || 'image/')) throw new Error('not an image');
  const src = await decode(file);
  const full = await encode(src, 1600, 0.82);
  const thumb = await encode(src, 480, 0.74);
  src.close?.();
  return { full, thumb };
}

export async function processAvatar(file) {
  const src = await decode(file);
  const sw = src.width || src.naturalWidth;
  const sh = src.height || src.naturalHeight;
  const side = Math.min(sw, sh);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 320;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, (sw - side) / 2, (sh - side) / 2, side, side, 0, 0, 320, 320);
  src.close?.();
  let blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.84));
  if (!blob || blob.type !== 'image/webp') blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.84));
  return blob;
}

export const extFor = (blob) => (blob.type === 'image/jpeg' ? 'jpg' : 'webp');
