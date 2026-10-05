// Renders the app icon and launch image from vector source, so they can be
// regenerated at any size rather than hand-exported. Run: npm run ios:assets
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BG = "#12100e";

const SLABS = [
  { w: 640, dx: 0, rgb: [176, 78, 52] },
  { w: 560, dx: -14, rgb: [216, 78, 39] },
  { w: 480, dx: 10, rgb: [255, 77, 26] },
  { w: 400, dx: -6, rgb: [251, 150, 116] },
];
const HOVER = { w: 400, dx: 96, rgb: [246, 232, 220] };

const css = ([r, g, b]) => `rgb(${r},${g},${b})`;
const tint = (rgb, t) => rgb.map((c) => Math.round(c + ((t >= 0 ? 255 : 16) - c) * Math.abs(t)));

function slab(cx, y, w, h, rgb) {
  const x = cx - w / 2;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${css(rgb)}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h * 0.2}" fill="${css(tint(rgb, 0.24))}"/>
    <rect x="${x}" y="${y + h * 0.86}" width="${w}" height="${h * 0.14}" fill="${css(tint(rgb, -0.32))}"/>
    <rect x="${x}" y="${y}" width="${h * 0.12}" height="${h}" fill="${css(tint(rgb, -0.5))}" opacity="0.85"/>
    <rect x="${cx - h * 0.045}" y="${y + h * 0.22}" width="${h * 0.09}" height="${h * 0.6}" fill="#120c08" opacity="0.55"/>`;
}

/** The mark: a stack with one slab about to land. `scale` fits it to the canvas. */
function mark(size, scale) {
  const h = 104;
  const pitch = 122;
  const base = 870;
  let body = "";
  SLABS.forEach((s, i) => {
    body += slab(512 + s.dx, base - h - i * pitch, s.w, h, s.rgb);
  });
  const top = base - h - SLABS.length * pitch - 34;
  body += `<rect x="${512 + HOVER.dx - HOVER.w / 2 - 150}" y="${top}" width="150" height="${h}" fill="url(#trail)"/>`;
  body += slab(512 + HOVER.dx, top, HOVER.w, h, HOVER.rgb);
  const k = (size / 1024) * scale;
  const offset = (size - 1024 * k) / 2;
  return `<g transform="translate(${offset} ${offset}) scale(${k})">${body}</g>`;
}

function svg(size, scale, glow) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="64%" r="62%">
      <stop offset="0" stop-color="#5a2410" stop-opacity="${glow}"/>
      <stop offset="1" stop-color="${BG}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="trail" x1="0" x2="1">
      <stop offset="0" stop-color="${css(HOVER.rgb)}" stop-opacity="0"/>
      <stop offset="1" stop-color="${css(HOVER.rgb)}" stop-opacity="0.35"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <rect width="${size}" height="${size}" fill="url(#glow)"/>
  ${mark(size, scale)}
</svg>`;
}

async function render(file, size, scale, glow = 0.9) {
  const path = join(root, file);
  await mkdir(dirname(path), { recursive: true });
  // Flattened: the App Store rejects icons that carry an alpha channel.
  const png = await sharp(Buffer.from(svg(size, scale, glow)))
    .flatten({ background: BG })
    .png()
    .toBuffer();
  await writeFile(path, png);
  console.log(`${file}  ${size}×${size}`);
}

const assets = "ios/App/App/Assets.xcassets";
await render(`${assets}/AppIcon.appiconset/AppIcon-512@2x.png`, 1024, 0.86);
for (const name of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
  // Small in the middle: the launch image is cropped hard on phones.
  await render(`${assets}/Splash.imageset/${name}`, 2732, 0.2, 0.5);
}
await render("public/apple-touch-icon.png", 180, 0.86);
await render("public/icon-192.png", 192, 0.86);
await render("public/icon-512.png", 512, 0.86);
