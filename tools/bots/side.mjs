import { createRequire } from "node:module";
const sharp = createRequire("/Users/scorchio/Code/Spire/package.json")("sharp");
const out = process.argv[2];
const names = process.argv.slice(3);
const tiles = await Promise.all(names.map((n) => sharp(n).resize(390).toBuffer()));
await sharp({ create: { width: 390 * tiles.length, height: 844, channels: 3, background: "#000" } })
  .composite(tiles.map((input, i) => ({ input, left: i * 390, top: 0 })))
  .png()
  .toFile(out);
