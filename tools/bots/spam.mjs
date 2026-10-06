import puppeteer from "puppeteer-core";
const lvl = Number(process.argv[2] || 0);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate(() =>
  localStorage.setItem(
    "spire-v2",
    JSON.stringify({
      v: 2,
      music: false,
      sfx: false,
      levels: { 0: { stars: 3 }, 1: { stars: 3 }, 2: { stars: 3 } },
      endless: { best: 0, bestFloors: 0 },
      tips: { dark: 9, loose: 9 },
      coins: 0,
      tracks: {},
      levels2: {},
      weapon: "buttress",
      ghosts: {},
      name: "",
    }),
  ),
);
await page.reload({ waitUntil: "networkidle0" });
await wait(300);
await page.evaluate((lvl) => {
  const e = window.__spire;
  let best = 0;
  const id = setInterval(() => {
    if (e.phase === "pick") e.choose(0);
    if (e.phase === "ready" || e.phase === "play") {
      e.tap();
      best = Math.max(best, e.floors);
    }
  }, 110);
  window.__spam = {
    id,
    get best() {
      return best;
    },
  };
  e.startLevel(lvl);
}, lvl);
const t = Date.now();
while (Date.now() - t < 60000) {
  const ph = await page.evaluate(() => window.__spire.phase);
  if (ph === "won" || ph === "fall") break;
  await wait(100);
}
console.log(
  "spam sky",
  lvl,
  JSON.stringify(
    await page.evaluate(() => ({
      phase: window.__spire.phase,
      floors: window.__spire.floors,
      best: window.__spam.best,
      t: window.__spire.runTime.toFixed(1),
    })),
  ),
);
await page.screenshot({ path: `spam-${lvl}.png` });
await browser.close();
