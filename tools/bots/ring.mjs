// The Ring grey box: plays a level with a given accuracy and reports how it ended,
// shooting the tower at its most tilted. Usage: node tools/bots/ring.mjs <out> <level> <aim 1|2> [max s]
import puppeteer from "puppeteer-core";
const [out = "/tmp", level = "0", aim = "1", max = "120"] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
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
await page.evaluate(
  (level, aim) => {
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
        now - last > 1100 &&
        Math.abs(p.offset) < p.tol * aim
      ) {
        e.tap();
        last = now;
      }
      requestAnimationFrame(loop);
    };
    loop();
  },
  level,
  Number(aim),
);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let shot = 0;
let last = "";
for (let t = 0; t < Number(max) * 10; t++) {
  await wait(100);
  const s = await page.evaluate(() => {
    const e = window.__spire;
    const p = e.probe();
    return {
      phase: p.phase,
      floors: p.floors,
      t: p.time.toFixed(1),
      tilt: e.rimTilt().toFixed(2),
      gap: e.darkGap().toFixed(1),
    };
  });
  last = JSON.stringify(s);
  if (shot < 2 && Math.abs(Number(s.tilt)) > 0.1 && s.floors >= 6 + shot * 6) {
    await page.screenshot({ path: `${out}/ring-${shot++}.png` });
  }
  if (["won", "over", "fall", "menu"].includes(s.phase)) break;
}
await wait(400);
await page.screenshot({ path: `${out}/ring-end.png` });
console.log(`level ${level} aim ${aim}: ${last}`);
await browser.close();
