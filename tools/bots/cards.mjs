// Plays a two-landing sky and shoots the landings: the offers, the kindled offer, and the hand on the HUD.
// Usage: node tools/bots/cards.mjs <out-dir> [level index]
import puppeteer from "puppeteer-core";
const [out = "/tmp", level = "7"] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 300)));
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate(() =>
  localStorage.setItem(
    "spire-v2",
    JSON.stringify({
      v: 2,
      music: true,
      sfx: true,
      levels: {},
      endless: { best: 0, bestFloors: 0 },
      tips: {
        dark: 9,
        wind: 9,
        fall: 9,
        "demo-gust": 1,
        "demo-beat": 1,
        "demo-sway": 1,
        "demo-rush": 1,
        "demo-breath": 1,
        "demo-eclipse": 1,
        "demo-split": 1,
      },
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
await page.evaluate((level) => {
  const e = window.__spire;
  e.wake();
  e.startLevel(Number(level));
  let last = 0;
  window.__picks = 0;
  window.__hold = false;
  const loop = () => {
    const p = e.probe();
    const now = performance.now();
    if (p.phase === "pick") {
      /* the script chooses */
    } else if (
      (p.phase === "ready" || p.phase === "play") &&
      !p.blocked &&
      now - last > 1100 &&
      Math.abs(p.offset) < p.tol
    ) {
      e.tap();
      last = now;
    }
    requestAnimationFrame(loop);
  };
  loop();
}, level);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let picks = 0;
for (let i = 0; i < 1200 && picks < 2; i++) {
  await wait(100);
  const s = await page.evaluate(() => {
    const e = window.__spire;
    return {
      phase: e.phase,
      omen: !!e.landing?.omen,
      offers: e.landing?.offers ?? null,
      hand: e.hand,
      combos: e.combos,
    };
  });
  if (s.phase === "pick" && !s.omen) {
    await wait(1400);
    await page.screenshot({ path: `${out}/cards-${picks + 1}.png` });
    console.log("landing", picks + 1, JSON.stringify(s));
    // take the card that kindles or makes a power if offered, else the first
    const idx = await page.evaluate(() => {
      const e = window.__spire;
      const o = e.landing?.offers ?? [];
      const i = o.findIndex((id) => (e.hand[id] ?? 0) > 0);
      return i >= 0 ? i : 0;
    });
    await page.evaluate((i) => window.__spire.choose(i), idx);
    await wait(2600);
    await page.screenshot({ path: `${out}/hand-${picks + 1}.png` });
    picks++;
  }
  if (["won", "over", "fall"].includes(s.phase)) break;
}
console.log(
  JSON.stringify(
    await page.evaluate(() => {
      const e = window.__spire;
      return {
        phase: e.phase,
        floors: e.floors,
        hand: e.hand,
        combos: e.combos,
        favour: e.save.favour,
      };
    }),
  ),
);
await browser.close();
