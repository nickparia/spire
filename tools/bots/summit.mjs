// A sky played briefly, then won: its stone in play, then the painted pillar and starbursts.
import puppeteer from "puppeteer-core";
const [out = "/tmp", level = "6"] = process.argv.slice(2);
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
      tips: {
        dark: 9,
        loose: 9,
        "demo-sway": 1,
        "demo-beat": 1,
        "demo-rush": 1,
        "demo-gust": 1,
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
  window.__bot = { last: 0 };
  const loop = () => {
    const p = e.probe();
    if (
      (p.phase === "ready" || p.phase === "play") &&
      !p.blocked &&
      performance.now() - window.__bot.last > 900 &&
      Math.abs(p.offset) <= p.tol * 2.2
    ) {
      e.tap();
      window.__bot.last = performance.now();
    }
    requestAnimationFrame(loop);
  };
  loop();
}, level);
await wait(7000);
await page.screenshot({ path: `${out}/sm-play.png` });
await page.evaluate(() => window.__spire.win());
await page.addStyleTag({ content: ".panel-won { opacity: 0.08 !important; }" });
for (const t of [700, 900, 1400, 2500]) {
  await wait(t);
  await page.screenshot({ path: `${out}/sm-${t}.png` });
}
await browser.close();
