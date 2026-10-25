export async function convertToWebp(file, { maxSide = 2048, quality = 0.85 } = {}) {
  const mime = String(file.type ?? '').toLowerCase();
  const name = String(file.name ?? 'image');
  if (!mime.startsWith('image/')) return file;
  if (mime === 'image/gif' || mime === 'image/webp') return file;
  if (name.toLowerCase().endsWith('.svg') || mime === 'image/svg+xml') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx2d = canvas.getContext('2d');
    ctx2d.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob || blob.type !== 'image/webp') return file;
    if (blob.size >= file.size) return file;
    const newName = name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], newName, { type: 'image/webp', lastModified: file.lastModified ?? Date.now() });
  } catch (_) {
    return file;
  }
}
