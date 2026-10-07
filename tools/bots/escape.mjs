// Starts Apex's escape from the summit (tester tools) and taps at a set rate.
// Usage: node escape.mjs <taps-per-second> [charged 0..1] [heavy 0..1] [out-dir]
import puppeteer from "puppeteer-core";
const rate = Number(process.argv[2] || 6);
// Tower quality: share of slabs that are charged (perfect) and heavy (loose or rubble).
const charged = Number(process.argv[3] ?? 1);
const heavy = Number(process.argv[4] ?? 0);
const out = process.argv[5];
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate(() =>
  localStorage.setItem(
    "spire-v2",
    JSON.stringify({
      v: 2,
      music: false,
      sfx: false,
      levels: {},
      endless: { best: 0, bestFloors: 0 },
      tips: { dark: 9, loose: 9 },
      coins: 0,
      tracks: {},
      levels2: {},
      weapon: "buttress",
      ghosts: {},
      name: "",
      feats: {},
      whatsNewSeen: 99,
      storySeen: true,
      savedAt: 5,
      tester: true,
    }),
  ),
);
await page.reload({ waitUntil: "networkidle0" });
await wait(400);
await page.evaluate(
  ({ charged, heavy }) => {
    const e = window.__spire;
    e.startBoss(7);
    const esc = e.escape;
    esc.charged.clear();
    esc.heavy.clear();
    e.stack.slice(1).forEach((s, i) => {
      const r = (i * 0.618) % 1;
      if (r < charged) esc.charged.add(s);
      else if (r < charged + heavy) esc.heavy.add(s);
    });
    esc.hits = esc.heavy.has(e.stack[e.stack.length - 1]) ? 2 : 1;
  },
  { charged, heavy },
);
await wait(1600);
if (out) await page.screenshot({ path: `${out}/esc-1.png` });
await page.evaluate((rate) => {
  const e = window.__spire;
  window.__tapper = setInterval(() => e.tap(), 1000 / rate);
}, rate);
let shot = false;
const t = Date.now();
while (Date.now() - t < 60000) {
  const st = await page.evaluate(() => ({
    phase: window.__spire.phase,
    left: window.__spire.stack.length - 1,
  }));
  if (out && !shot && st.left < 22) {
    shot = true;
    await page.screenshot({ path: `${out}/esc-2.png` });
  }
  if (st.phase === "won" || st.phase === "fall") break;
  await wait(100);
}
await wait(1500);
if (out) await page.screenshot({ path: `${out}/esc-3.png` });
console.log(
  `${rate}/s charged=${charged} heavy=${heavy}`,
  JSON.stringify(
    await page.evaluate(() => ({
      phase: window.__spire.phase,
      left: window.__spire.stack.length - 1,
      t: window.__spire.runTime.toFixed(1),
      paused: window.__spire.paused,
      vis: document.visibilityState,
      freeze: window.__spire.freeze,
      esc: window.__spire.escape && {
        hold: window.__spire.escape.hold.toFixed(2),
        src: (window.__spire.escape.source / 28).toFixed(1),
      },
    })),
  ),
  errors.join(" ") || "ok",
);
await browser.close();
