// Plays a Hearth sky like a player of a given skill: taps no sooner than `every` seconds, and only
// when the slab is within `aim` tolerances of the groove (1 = decent, 2 = beginner). Does the Dark catch them?
// Usage: node tools/bots/pace.mjs <level> <min seconds between taps> <aim> [max seconds]
import puppeteer from "puppeteer-core";
const [level = "0", every = "1.4", aim = "1", max = "120"] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 200)));
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
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
await page.evaluate(
  (level, every, aim) => {
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
        now - last > every * 1000 &&
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
  Number(every),
  Number(aim),
);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let last = "";
for (let t = 0; t < Number(max); t += 5) {
  await wait(5000);
  const s = await page.evaluate(() => {
    const e = window.__spire;
    const p = e.probe();
    return { phase: p.phase, floors: p.floors, t: p.time.toFixed(1), gap: e.darkGap().toFixed(1) };
  });
  last = JSON.stringify(s);
  if (["won", "over", "menu"].includes(s.phase)) break;
}
console.log(`sky ${level} every ${every}s aim ${aim}: ${last}`);
await browser.close();
