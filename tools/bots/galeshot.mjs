// Plays a Gale sky at a decent pace and shoots it at a gust (or at full strength on the howl).
// Usage: node tools/bots/galeshot.mjs <out-dir> <level index>
import puppeteer from "puppeteer-core";
const [out = "/tmp", level = "20"] = process.argv.slice(2);
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
      tips: { dark: 9, wind: 9, fall: 9 },
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
  e.startLevel(Number(level));
  let last = 0;
  const loop = () => {
    const p = e.probe();
    const now = performance.now();
    if (p.phase === "pick") e.choose(0);
    else if (
      (p.phase === "ready" || p.phase === "play") &&
      !p.blocked &&
      now - last > 1200 &&
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
let shots = 0;
for (let i = 0; i < 600 && shots < 3; i++) {
  await wait(100);
  const s = await page.evaluate(() => {
    const e = window.__spire;
    const w = e.windNow();
    return { strength: w.strength, front: w.front, floors: e.floors, phase: e.phase };
  });
  if (s.floors >= 4 && s.strength > 1 && shots === 0) {
    shots++;
    await page.screenshot({ path: `${out}/g${level}-strong.png` });
  }
  if (s.floors >= 5 && s.front !== null && s.front > 0.55 && shots === 1) {
    shots++;
    await page.screenshot({ path: `${out}/g${level}-front.png` });
  }
  if (s.floors >= 6 && s.strength < 0.4 && shots === 2) {
    shots++;
    await page.screenshot({ path: `${out}/g${level}-calm.png` });
  }
  if (["won", "fall", "over"].includes(s.phase)) break;
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
