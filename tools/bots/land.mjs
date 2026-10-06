import puppeteer from "puppeteer-core";
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
    }),
  ),
);
await page.reload({ waitUntil: "networkidle0" });
await wait(300);
await page.evaluate(() => {
  const e = window.__spire;
  window.__bot = { last: 0, log: [] };
  const loop = () => {
    const p = e.probe();
    const b = window.__bot;
    if (p.phase === "pick") {
      if (!b.shot) {
        b.shot = true;
        b.pickAt = performance.now();
      } else if (performance.now() - b.pickAt > 1500) {
        e.choose(0);
        b.shot = false;
        b.log.push(`chose at ${e.floors}`);
      }
    }
    // Sloppy after the landing, to see the checkpoint hold.
    const target = e.floors >= 8 && e.floors < 12 ? e.mover.w * 0.4 : 0;
    if (
      (p.phase === "ready" || p.phase === "play") &&
      !p.blocked &&
      performance.now() - b.last > 900 &&
      Math.abs(p.offset - target) <= p.tol * 0.4
    ) {
      e.tap();
      b.last = performance.now();
    }
    requestAnimationFrame(loop);
  };
  loop();
  e.startLevel(0);
});
let shot = false;
const t = Date.now();
while (Date.now() - t < 90000) {
  const st = await page.evaluate(() => ({
    phase: window.__spire.phase,
    landing: !!window.__spire.landing,
    floors: window.__spire.floors,
  }));
  if (st.landing && !shot) {
    shot = true;
    await wait(700);
    await page.screenshot({ path: "land-1.png" });
  }
  if (st.phase === "won" || st.phase === "fall") break;
  await wait(100);
}
await page.screenshot({ path: "land-2.png" });
console.log(
  JSON.stringify(
    await page.evaluate(() => ({
      phase: window.__spire.phase,
      floors: window.__spire.floors,
      t: window.__spire.runTime.toFixed(1),
      log: window.__bot.log,
    })),
  ),
  errors.join("\n") || "no errors",
);
await browser.close();
