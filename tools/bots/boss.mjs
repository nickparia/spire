import puppeteer from "puppeteer-core";
const mode = process.argv[2] || "ideal";
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
const rec = { clear: true, precise: true, swift: false, bestTime: 30, bestAccuracy: 0.9, runs: 1 };
await page.evaluate(
  (rec) =>
    localStorage.setItem(
      "spire-v2",
      JSON.stringify({
        v: 2,
        music: false,
        sfx: false,
        levels: Object.fromEntries(
          ["foundry", "tide", "city", "canyon", "ridge", "glacier", "eclipse"].map((id) => [
            id,
            rec,
          ]),
        ),
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
      }),
    ),
  rec,
);
await page.reload({ waitUntil: "networkidle0" });
await wait(300);
await page.evaluate((mode) => {
  const e = window.__spire;
  window.__bot = { last: 0, log: [] };
  const loop = () => {
    const p = e.probe();
    const b = window.__bot;
    if (p.phase === "pick") e.choose(0);
    const target = mode === "lean" ? e.mover.w * 0.16 * (Math.random() < 0.6 ? 1 : -1) : 0;
    if (
      (p.phase === "ready" || p.phase === "play") &&
      !p.blocked &&
      performance.now() - b.last > 900 &&
      Math.abs(p.offset - target) <= p.tol * 0.4
    ) {
      e.tap();
      b.last = performance.now();
    }
    if (e.boss && !b.woke) {
      b.woke = e.runTime;
    }
    if (e.boss && (!b.lastLog || e.runTime - b.lastLog > 0.5)) {
      b.lastLog = e.runTime;
      b.log.push(
        `${e.runTime.toFixed(1)} dark=${(e.dark / 28).toFixed(1)} crown=${(e.crownY() / 28).toFixed(1)} floors=${e.floors} n=${e.stack.length} surge=${e.boss.surge} breather=${e.breather.toFixed(1)} floats=${e.floaters.map((f) => f.text).join("/")}`,
      );
    }
    requestAnimationFrame(loop);
  };
  loop();
  e.startLevel(7);
}, mode);
let shot = 0;
const t = Date.now();
while (Date.now() - t < 240000) {
  const st = await page.evaluate(() => ({
    phase: window.__spire.phase,
    boss: window.__spire.boss?.surge,
    floors: window.__spire.floors,
    t: window.__spire.runTime,
  }));
  if (st.boss !== undefined && st.boss !== null && shot === 0) {
    shot = 1;
    await wait(1500);
    await page.screenshot({ path: `boss-${mode}-1.png` });
  }
  if (st.boss === 2 && shot === 1) {
    shot = 2;
    await wait(1200);
    await page.screenshot({ path: `boss-${mode}-2.png` });
  }
  if (st.phase === "won" || st.phase === "fall") break;
  await wait(120);
}
await wait(3500);
await page.screenshot({ path: `boss-${mode}-3.png` });
console.log((await page.evaluate(() => window.__bot.log)).join("\n"));
console.log(
  mode,
  JSON.stringify(
    await page.evaluate(() => ({
      phase: window.__spire.phase,
      floors: window.__spire.floors,
      t: window.__spire.runTime.toFixed(1),
      woke: window.__bot.woke?.toFixed(1),
      boss: window.__spire.result?.boss,
    })),
  ),
  errors.join("\n") || "no errors",
);
await browser.close();
