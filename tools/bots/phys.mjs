import puppeteer from "puppeteer-core";
const mode = process.argv[2] || "ideal";
const lvl = Number(process.argv[3] || 0);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate(() => {
  localStorage.setItem(
    "spire-v2",
    JSON.stringify({
      v: 2,
      music: true,
      sfx: true,
      levels: {
        0: { stars: 3 },
        1: { stars: 3 },
        2: { stars: 3 },
        3: { stars: 3 },
        4: { stars: 3 },
        5: { stars: 3 },
        6: { stars: 3 },
      },
      endless: { best: 0, bestFloors: 0 },
      tips: { dark: 9 },
      coins: 0,
      tracks: {},
      levels2: {},
      weapon: "buttress",
    }),
  );
});
await page.reload({ waitUntil: "networkidle0" });
await wait(500);
await page.evaluate(
  (mode, lvl) => {
    const e = window.__spire;
    window.__bot = { on: true, mode, last: 0 };
    const loop = () => {
      const p = e.probe();
      const b = window.__bot;
      if (p.phase === "pick") {
        e.choose(0);
        b.last = performance.now();
      }
      if (
        b.on &&
        (p.phase === "ready" || p.phase === "play") &&
        !p.blocked &&
        performance.now() - b.last > 900
      ) {
        // ideal: dead centre. sloppy: always 35% of a slab off to the right, so it leans and eventually topples.
        const frac = b.mode === "ideal" ? 0 : b.mode === "lean" ? 0.16 : 0.35;
        const target = e.mover.w * frac * (b.mode === "lean" ? (Math.random() < 0.7 ? 1 : -1) : 1);
        if (Math.abs(p.offset - target) <= p.tol * 0.4) {
          e.tap();
          b.last = performance.now();
        }
      }
      requestAnimationFrame(loop);
    };
    loop();
    e.startLevel(lvl);
  },
  mode,
  lvl,
);
const until = async (fn, ms = 90000) => {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (await page.evaluate(fn)) return true;
    await wait(40);
  }
  return false;
};
await until(() => window.__spire.probe().floors >= 4);
await wait(600);
// Camera jitter: biggest frame-to-frame move of the camera over a second with nothing happening.
const jitter = await page.evaluate(async () => {
  const e = window.__spire;
  let last = e.camY,
    worst = 0;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => requestAnimationFrame(r));
    worst = Math.max(worst, Math.abs(e.camY - last));
    last = e.camY;
  }
  return worst;
});
console.log(mode, "max camY step px/frame:", jitter.toFixed(2));
await page.screenshot({ path: `ph-${mode}${lvl}-a.png` });
await until(
  () =>
    window.__spire.probe().floors >= 8 || ["won", "over"].includes(window.__spire.probe().phase),
  60000,
);
await wait(600);
await page.screenshot({ path: `ph-${mode}${lvl}-b.png` });
await until(() => ["won", "over"].includes(window.__spire.probe().phase), 120000);
await wait(1500);
await page.screenshot({ path: `ph-${mode}${lvl}-c.png` });
console.log(
  mode,
  lvl,
  JSON.stringify(
    await page.evaluate(() => ({
      probe: window.__spire.probe(),
      slabs: window.__spire.stack.length,
      gap: window.__spire.darkGap(),
    })),
  ),
  errors.join("\n") || "no errors",
);
await browser.close();
