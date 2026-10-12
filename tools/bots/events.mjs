// Plays a sky at a decent pace and shoots each event as it starts (and a beat later).
// Usage: node tools/bots/events.mjs <out-dir> <level index>
import puppeteer from "puppeteer-core";
const [out = "/tmp", level = "0"] = process.argv.slice(2);
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
  const loop = () => {
    const p = e.probe();
    const now = performance.now();
    if (p.phase === "pick") e.choose(0);
    else if (
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
console.log("due", JSON.stringify(await page.evaluate(() => window.__spire.eventsDue)));
let seen = "";
for (let i = 0; i < 1500; i++) {
  await wait(100);
  const s = await page.evaluate(() => {
    const e = window.__spire;
    return { phase: e.phase, floors: e.floors, ev: e.event?.def?.id ?? null, t: e.event?.t ?? 0 };
  });
  if (s.ev && s.ev !== seen) {
    seen = s.ev;
    await wait(250);
    await page.screenshot({ path: `${out}/ev-${s.ev}-a.png` });
    await wait(1500);
    await page.screenshot({ path: `${out}/ev-${s.ev}-b.png` });
    console.log("event", s.ev, "at floor", s.floors);
  }
  if (["won", "over", "fall"].includes(s.phase)) {
    console.log("end", s.phase, s.floors);
    break;
  }
}
await browser.close();
