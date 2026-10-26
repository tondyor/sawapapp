// Конвертация изображений в WebP перед загрузкой — нативный Canvas, без библиотек.
// Фолбэки: createImageBitmap может отсутствовать в старых webview → HTMLImageElement;
// toBlob('image/webp') может не поддерживаться → JPEG с качеством 0.8 (всё равно меньше оригинала).

function drawToBlob(source, w, h, type, quality) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) { resolve(null); return; }
    ctx.drawImage(source, 0, 0, w, h);
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function loadViaImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode failed')); };
    img.src = url;
  });
}

async function shrink(file, maxSide, quality) {
  let source = null;
  let w = 0;
  let h = 0;
  let viaBitmap = false;
  try {
    source = await createImageBitmap(file);
    w = source.width;
    h = source.height;
    viaBitmap = true;
  } catch (_) {
    source = await loadViaImageElement(file);
    w = source.naturalWidth;
    h = source.naturalHeight;
  }
  if (!w || !h) return null;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));
  let blob = await drawToBlob(source, tw, th, 'image/webp', quality);
  let type = 'image/webp';
  if (!blob || blob.type !== 'image/webp') {
    blob = await drawToBlob(source, tw, th, 'image/jpeg', quality);
    type = 'image/jpeg';
  }
  if (viaBitmap && source.close) source.close();
  if (!blob || blob.size >= file.size) return null;
  const newName = file.name.replace(/\.[^.]+$/, '') + (type === 'image/webp' ? '.webp' : '.jpg');
  return new File([blob], newName, { type, lastModified: file.lastModified ?? Date.now() });
}

export async function convertToWebp(file, { maxSide = 2048, quality = 0.85 } = {}) {
  const mime = String(file.type ?? '').toLowerCase();
  const name = String(file.name ?? 'image');
  if (!mime.startsWith('image/')) return file;
  if (mime === 'image/gif' || mime === 'image/webp') return file;
  if (name.toLowerCase().endsWith('.svg') || mime === 'image/svg+xml') return file;
  try {
    const out = await shrink(file, maxSide, quality);
    return out ?? file;
  } catch (_) {
    return file;
  }
}
