#!/usr/bin/env node
// Keys a foreground plate painted on chroma green into a transparent WebP,
// trimmed to the rows that hold something, at half size.
// Usage: node tools/keyfg.mjs <in.png> <out.webp>
import sharp from "sharp";

const [input, output] = process.argv.slice(2);
const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
let top = h;
for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const m = Math.max(r, b);
  const spill = g - m;
  // Pure key green is fully clear; edges blend; any green cast is pulled back.
  const a = spill > 90 ? 0 : spill > 25 ? Math.round((255 * (90 - spill)) / 65) : 255;
  data[i + 1] = Math.min(g, m + 8);
  data[i + 3] = a;
  if (a > 40) top = Math.min(top, Math.floor(i / 4 / w));
}
const from = Math.max(0, top - 20);
await sharp(data, { raw: { width: w, height: h, channels: 4 } })
  .extract({ left: 0, top: from, width: w, height: h - from })
  .resize(Math.round(w / 2))
  .webp({ quality: 84, alphaQuality: 90 })
  .toFile(output);
console.log(`${output}: from row ${from} of ${h}`);
