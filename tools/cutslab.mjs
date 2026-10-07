#!/usr/bin/env node
// Cuts the middle slab out of a three-slab sheet painted on black: finds the
// slab's rows and columns, flood-fills the black from the edges to make it
// clear (so dark stone stays solid), and writes a 768-wide PNG.
// Usage: node tools/cutslab.mjs <sheet.png> <out.webp> [brightness threshold, default 90]
import sharp from "sharp";

const [input, output, thresh = "90"] = process.argv.slice(2);
const T = Number(thresh);
const src = sharp(input);
const { data, info } = await src.clone().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const lum = (x, y) => {
  const i = (y * W + x) * C;
  return data[i] + data[i + 1] + data[i + 2];
};
const rows = [];
for (let y = 0; y < H; y++) {
  let n = 0;
  for (let x = 0; x < W; x += 2) if (lum(x, y) > T) n++;
  rows.push(n);
}
const bands = [];
let s = -1;
for (let y = 0; y < H; y++) {
  const on = rows[y] > W * 0.08;
  if (on && s < 0) s = y;
  if (!on && s >= 0) {
    if (y - s > 20) bands.push([s, y]);
    s = -1;
  }
}
const [top, bottom] = bands[Math.min(1, bands.length - 1)];
let l = W;
let r = 0;
for (let y = top; y < bottom; y++)
  for (let x = 0; x < W; x++)
    if (lum(x, y) > T) {
      l = Math.min(l, x);
      r = Math.max(r, x);
    }
// A little room above and below for rough edges and anything hanging.
const pad = Math.round((bottom - top) * 0.12);
const box = {
  left: l,
  top: Math.max(0, top - pad),
  width: r - l + 1,
  height: Math.min(H, bottom + pad) - Math.max(0, top - pad),
};
const out = 768;
const { data: px, info: o } = await sharp(input)
  .extract(box)
  .resize(out)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const w = o.width;
const h = o.height;
const L = (p) => px[p * 4] + px[p * 4 + 1] + px[p * 4 + 2];
const bg = new Uint8Array(w * h);
const stack = [];
for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
while (stack.length) {
  const p = stack.pop();
  if (bg[p] || L(p) > 54) continue;
  bg[p] = 1;
  const x = p % w;
  if (x > 0) stack.push(p - 1);
  if (x < w - 1) stack.push(p + 1);
  if (p >= w) stack.push(p - w);
  if (p < w * (h - 1)) stack.push(p + w);
}
for (let p = 0; p < w * h; p++) px[p * 4 + 3] = bg[p] ? Math.min(255, L(p) * 3) : 255;
await sharp(px, { raw: { width: w, height: h, channels: 4 } })
  .webp({ quality: 86, alphaQuality: 90 })
  .toFile(output);
console.log(`${output}: ${w}x${h}`);
