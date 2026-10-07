#!/usr/bin/env node
// Turns a Higgsfield clip on black into a sprite sheet with transparency.
// The black that touches the frame's edge is cut away (flood fill), so dark
// shading inside a creature or a slab stays solid.
// Usage: node tools/sprites.mjs <clip.mp4> <out.webp> <frames> <cellW> [crop=w:h:x:y]
// Writes <out.webp> (frames in one row) and <out>.json ({ frames, w, h }).
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const [clip, out, framesArg, cellArg, crop] = process.argv.slice(2);
const frames = Number(framesArg);
const cellW = Number(cellArg);
const dur = Number(
  execFileSync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "csv=p=0",
    clip,
  ])
    .toString()
    .trim(),
);
const dir = mkdtempSync(join(tmpdir(), "sprites-"));
// The clip starts and ends on the same frame: leave the last one out so the loop doesn't stutter.
const fps = frames / dur;
const vf = [crop ? `crop=${crop}` : null, `fps=${fps}`, `scale=${cellW}:-2`]
  .filter(Boolean)
  .join(",");
execFileSync("ffmpeg", [
  "-v",
  "error",
  "-i",
  clip,
  "-vf",
  vf,
  "-frames:v",
  String(frames),
  join(dir, "f%03d.png"),
]);
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".png"))
  .sort();

/** Alpha from a flood fill of near-black from the edges, feathered by brightness. */
async function cut(file) {
  const { data, info } = await sharp(join(dir, file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const lum = (i) => data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2];
  const bg = new Uint8Array(w * h);
  const stack = [];
  const LOW = 60;
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (bg[p] || lum(p) > LOW) continue;
    bg[p] = 1;
    const x = p % w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (p >= w) stack.push(p - w);
    if (p < w * (h - 1)) stack.push(p + w);
  }
  for (let p = 0; p < w * h; p++) {
    // Background fades with its own brightness, so glows and smoke stay soft.
    // Pockets of pure black inside (between legs, say) are background too.
    const l = lum(p);
    data[p * 4 + 3] = bg[p] ? Math.min(255, l * 3) : l < 24 ? Math.min(255, l * 10) : 255;
  }
  return { data, w, h };
}

const cells = [];
for (const f of files) cells.push(await cut(f));
const { w, h } = cells[0];
const sheet = sharp({
  create: {
    width: w * cells.length,
    height: h,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
});
await sheet
  .composite(
    cells.map((c, i) => ({
      input: c.data,
      raw: { width: c.w, height: c.h, channels: 4 },
      left: i * w,
      top: 0,
    })),
  )
  .webp({ quality: 82, alphaQuality: 90 })
  .toFile(out);
writeFileSync(
  out.replace(/\.webp$/, ".json"),
  JSON.stringify({ frames: cells.length, w, h }) + "\n",
);
console.log(`${out}: ${cells.length} frames of ${w}x${h}`);
