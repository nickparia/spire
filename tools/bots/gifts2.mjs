// Plays a sky cleanly to its landing, shoots the cards, takes one, and shoots its effect.
// Usage: node tools/bots/gifts2.mjs <out> [level] [pick 0|1] [force id,id]
import puppeteer from "puppeteer-core";
const [out = "/tmp", level = "0", pick = "0", force = ""] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
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
await page.evaluate(
  (level, force) => {
    const e = window.__spire;
    if (force) {
      const orig = e.openLanding.bind(e);
      e.openLanding = (f) => {
        orig(f);
        e.landing.offers = force.split(",");
        e.emit();
      };
    }
    e.startLevel(Number(level));
    window.__bot = { last: 0, on: true };
    const loop = () => {
      const p = e.probe();
      if (
        window.__bot.on &&
        (p.phase === "ready" || p.phase === "play") &&
        !p.blocked &&
        performance.now() - window.__bot.last > 900 &&
        Math.abs(p.offset) <= p.tol * 0.4
      ) {
        e.tap();
        window.__bot.last = performance.now();
      }
      requestAnimationFrame(loop);
    };
    loop();
  },
  level,
  force,
);
const t0 = Date.now();
// The omen first: the world announcing the next flight's trial.
while (Date.now() - t0 < 60000 && !(await page.evaluate(() => !!window.__spire.landing)))
  await wait(100);
await wait(600);
await page.screenshot({ path: `${out}/g-omen.png` });
while (Date.now() - t0 < 60000 && !(await page.$(".ecard"))) await wait(200);
await wait(1300);
await page.screenshot({ path: `${out}/g-cards.png` });
await page.evaluate((pick) => document.querySelectorAll(".ecard")[Number(pick)].click(), pick);
for (const [t, n] of [
  [500, "a"],
  [700, "b"],
  [800, "c"],
  [700, "d"],
]) {
  await wait(t);
  await page.screenshot({ path: `${out}/g-${n}.png` });
}
await wait(4500);
await page.screenshot({ path: `${out}/g-after.png` });
await browser.close();
