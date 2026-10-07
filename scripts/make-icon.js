// build/icon.png üretir (256x256): yeşil zemin üzerinde fiş ve domates
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const N = 256;
const px = Buffer.alloc(N * N * 4);
function blend(x, y, [r, g, b], a = 1) {
  if (x < 0 || y < 0 || x >= N || y >= N || a <= 0) return;
  const i = (y * N + x) * 4;
  const A = px[i + 3] / 255;
  const oa = a + A * (1 - a);
  px[i] = (r * a + px[i] * A * (1 - a)) / oa;
  px[i + 1] = (g * a + px[i + 1] * A * (1 - a)) / oa;
  px[i + 2] = (b * a + px[i + 2] * A * (1 - a)) / oa;
  px[i + 3] = oa * 255;
}
// kenar yumuşatmalı şekil çizici: f(x,y) -> işaretli mesafe (negatif = içeride)
function shape(sdf, color) {
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const d = sdf(x + 0.5, y + 0.5);
    blend(x, y, color, Math.max(0, Math.min(1, 0.5 - d)));
  }
}
const rrect = (x0, y0, x1, y1, r) => (x, y) => {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hx = (x1 - x0) / 2 - r, hy = (y1 - y0) / 2 - r;
  const qx = Math.abs(x - cx) - hx, qy = Math.abs(y - cy) - hy;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};
const circle = (cx, cy, r) => (x, y) => Math.hypot(x - cx, y - cy) - r;
const ellipse = (cx, cy, rx, ry, rot) => (x, y) => {
  const c = Math.cos(rot), s = Math.sin(rot);
  const dx = x - cx, dy = y - cy;
  const u = (dx * c + dy * s) / rx, v = (-dx * s + dy * c) / ry;
  return (Math.hypot(u, v) - 1) * Math.min(rx, ry);
};

shape(rrect(8, 8, 248, 248, 52), [46, 125, 50]);              // zemin
shape(rrect(52, 34, 172, 214, 10), [255, 255, 255]);          // fiş
for (let i = 0; i < 6; i++) shape(rrect(70, 62 + i * 22, 154 - (i % 2) * 24, 70 + i * 22, 4), [180, 190, 200]); // satırlar
shape(circle(170, 168, 50), [229, 57, 53]);                    // domates
shape(circle(154, 150, 13), [255, 138, 128]);                  // parlama
shape(ellipse(160, 122, 22, 9, -0.5), [56, 142, 60]);          // yaprak
shape(ellipse(184, 122, 22, 9, 0.5), [56, 142, 60]);
shape(rrect(168, 104, 176, 126, 3), [27, 94, 32]);             // sap

function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
fs.mkdirSync(path.join(__dirname, '..', 'build'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'build', 'icon.png'), png(N, N, px));
console.log('build/icon.png oluşturuldu');
