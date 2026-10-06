// Captures the title, a run's HUD with canvas callouts, and the summit card.
import puppeteer from "puppeteer-core";
const out = process.argv[2] || "/tmp";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
const rec = { clear: true, precise: true, swift: false, bestTime: 30, bestAccuracy: 0.9, runs: 1 };
await page.evaluate(
  (rec) =>
    localStorage.setItem(
      "spire-v2",
      JSON.stringify({
        v: 2,
        music: false,
        sfx: false,
        levels: { foundry: rec, tide: rec },
        endless: { best: 0, bestFloors: 0 },
        tips: { dark: 9, loose: 9 },
        coins: 120,
        tracks: {},
        levels2: {},
        weapon: "buttress",
        ghosts: {},
        name: "",
        feats: { "first-light": 1 },
        whatsNewSeen: 99,
        storySeen: true,
        savedAt: 5,
      }),
    ),
  rec,
);
await page.reload({ waitUntil: "networkidle0" });
await wait(800);
await page.screenshot({ path: `${out}/font-1.png` });
await page.evaluate(() => {
  const e = window.__spire;
  window.__bot = { last: 0 };
  const loop = () => {
    const p = e.probe();
    const b = window.__bot;
    if (p.phase === "pick") document.querySelector(".gift")?.click();
    if (
      (p.phase === "ready" || p.phase === "play") &&
      !p.blocked &&
      performance.now() - b.last > 900 &&
      Math.abs(p.offset) <= p.tol * 0.4
    ) {
      e.tap();
      b.last = performance.now();
    }
    requestAnimationFrame(loop);
  };
  loop();
  e.startLevel(0);
});
await wait(5200);
await page.screenshot({ path: `${out}/font-2.png` });
const t = Date.now();
while (Date.now() - t < 90000) {
  if (await page.evaluate(() => window.__spire.phase === "won")) break;
  await wait(200);
}
await wait(4500);
await page.screenshot({ path: `${out}/font-3.png` });
await browser.close();
