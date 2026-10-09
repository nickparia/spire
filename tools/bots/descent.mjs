// Plays a Descent depth on the lift with aim, shooting the start, mid-climb, an arm out of the wall, and the break-through.
// Usage: node tools/bots/descent.mjs <out-dir> <level> [err tol multiple]
import puppeteer from "puppeteer-core";
const [out = "/tmp", level = "10", aim = "1"] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 200)));
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
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
      tips: { dark: 9 },
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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.evaluate((level) => window.__spire.startLevel(Number(level)), level);
await wait(800);
await page.screenshot({ path: `${out}/d-start.png` });
await page.evaluate((aim) => {
  const e = window.__spire;
  let last = 0;
  const loop = () => {
    const p = e.probe();
    const now = performance.now();
    if (p.phase === "pick") e.choose(0);
    else if (
      (p.phase === "ready" || p.phase === "play") &&
      !p.blocked &&
      now - last > 1100 &&
      Math.abs(p.offset) < p.tol * aim
    ) {
      e.tap();
      last = now;
    }
    requestAnimationFrame(loop);
  };
  loop();
}, Number(aim));
let mid = false,
  arm = false,
  won = false;
for (let i = 0; i < 1200 && !won; i++) {
  await wait(100);
  const s = await page.evaluate(() => ({
    f: window.__spire.floors,
    ph: window.__spire.phase,
    arms: window.__spire.arms.map((a) => a.t),
  }));
  if (!mid && s.f >= 6) {
    mid = true;
    await page.screenshot({ path: `${out}/d-mid.png` });
  }
  if (!arm && s.arms.some((t) => t > 0.3 && t < 0.6)) {
    arm = true;
    await page.screenshot({ path: `${out}/d-arm.png` });
  }
  if (s.ph === "won") {
    won = true;
    await wait(500);
    await page.screenshot({ path: `${out}/d-won.png` });
  }
  if (s.ph === "fall" || s.ph === "over") {
    await page.screenshot({ path: `${out}/d-over.png` });
    break;
  }
}
console.log(
  JSON.stringify(
    await page.evaluate(() => ({
      phase: window.__spire.phase,
      floors: window.__spire.floors,
      t: window.__spire.runTime.toFixed(1),
    })),
  ),
);
await browser.close();
