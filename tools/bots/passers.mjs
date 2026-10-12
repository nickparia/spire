// Plays a sky at a decent pace and shoots it a floor after each passer is met.
// Usage: node tools/bots/passers.mjs <out-dir> <level index> <floor,floor,...>
import puppeteer from "puppeteer-core";
const [out = "/tmp", level = "0", floorsArg = "7,13,18"] = process.argv.slice(2);
const floors = floorsArg.split(",").map(Number);
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
      music: false,
      sfx: false,
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
let next = 0;
for (let i = 0; i < 1500 && next < floors.length; i++) {
  await wait(100);
  const s = await page.evaluate(() => {
    const e = window.__spire;
    return { phase: e.phase, floors: e.floors, passers: e.passers.map((q) => q.kind) };
  });
  if (s.floors >= floors[next]) {
    await wait(900);
    await page.screenshot({ path: `${out}/pass-${floors[next]}.png` });
    console.log("floor", s.floors, "passers", JSON.stringify(s.passers));
    next++;
  }
  if (["won", "over", "fall"].includes(s.phase)) break;
}
await browser.close();
