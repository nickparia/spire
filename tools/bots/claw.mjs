// Plays a Descent depth like hang.mjs and screenshots the moment a claw is out.
// Usage: node tools/bots/claw.mjs <out-dir> <level> [err px]
import puppeteer from "puppeteer-core";
const [out = "/tmp", level = "11", errArg = "16"] = process.argv.slice(2);
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
      tips: {},
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
  (level, err) => {
    const e = window.__spire;
    e.startLevel(Number(level));
    window.__bot = setInterval(() => {
      const h = e.hang;
      if (!h || h.fall >= 0) return;
      const tp = h.tip();
      const rel = h.stoneX() - tp.x;
      if (Math.abs(rel) < err && Math.sign(h.stone.dir) === Math.sign(tp.x - h.stoneX() || 1))
        e.tap();
    }, 16);
  },
  level,
  Number(errArg),
);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let n = 0;
for (let i = 0; i < 600 && n < 3; i++) {
  await wait(100);
  const t = await page.evaluate(() => {
    const c = window.__spire.hang?.claws ?? [];
    return c.length ? c[0].t : -1;
  });
  if (t > 0.35 && t < 0.6) {
    await page.screenshot({ path: `${out}/claw-${n++}.png` });
    await wait(900);
  }
}
await browser.close();
console.log(`${n} claw shots`);
