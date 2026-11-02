const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const L = new Int16Array(128).fill(-1);
for (let i = 0; i < B64.length; i++) L[B64.charCodeAt(i)] = i;

function base64ToBytes(s) {
  const c = String(s).replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.ceil((c.length * 3) / 4));
  let n = 0;
  let buf = 0;
  let bits = 0;
  for (let i = 0; i < c.length; i++) {
    const v = L[c.charCodeAt(i) & 127];
    if (v < 0) continue;
    buf = (buf << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[n++] = (buf >> bits) & 0xff;
    }
  }
  return out.subarray(0, n);
}

const CHUNK = 699999;
const orig = new Uint8Array(1572864);
for (let i = 0; i < orig.length; i += 4096) orig[i] = (i / 4096) % 256;

let b64 = '';
for (let i = 0; i < orig.length; i += CHUNK) {
  const s = orig.subarray(i, Math.min(i + CHUNK, orig.length));
  let o = '';
  for (let j = 0; j < s.length; j += 3) {
    const b1 = s[j];
    const b2 = j + 1 < s.length ? s[j + 1] : 0;
    const b3 = j + 2 < s.length ? s[j + 2] : 0;
    o += B64[b1 >> 2];
    o += B64[((b1 & 3) << 4) | (b2 >> 4)];
    o += j + 1 < s.length ? B64[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    o += j + 2 < s.length ? B64[b3 & 63] : '=';
  }
  b64 += o;
}

const dec = base64ToBytes(b64);
let match = dec.length === orig.length;
if (match) {
  for (let i = 0; i < orig.length; i += 997) {
    if (dec[i] !== orig[i]) { match = false; break; }
  }
}
console.log('orig:', orig.length, 'dec:', dec.length, 'match:', match);
