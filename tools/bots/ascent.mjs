// The Descent's boss: straight to the ascent (tester Boss), played by a bot that lands
// within `slop` of the groove; logs how it goes and shoots it.
import puppeteer from "puppeteer-core";
const [out = "/tmp", slop = "0.4"] = process.argv.slice(2);
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
  (slop, gap) => {
    const e = window.__spire;
    const floor = 15;
    e.startBoss(floor);
    window.__bot = { last: 0, log: [] };
    const loop = () => {
      const p = e.probe();
      if (
        (p.phase === "ready" || p.phase === "play") &&
        !p.blocked &&
        performance.now() - window.__bot.last > Number(gap) &&
        Math.abs(p.offset) <= p.tol * Number(slop)
      ) {
        e.tap();
        window.__bot.last = performance.now();
      }
      requestAnimationFrame(loop);
    };
    loop();
  },
  slop,
  process.env.GAP || "450",
);
const t0 = Date.now();
let n = 0;
while (Date.now() - t0 < 70000) {
  await wait(2000);
  const s = await page.evaluate(() => {
    const e = window.__spire;
    return {
      phase: e.phase,
      floors: e.floors,
      gap: Math.round(e.darkGap() * 10) / 10,
      ascent: e.ascent,
      sting: e.ascentSting.toFixed(1),
      time: e.runTime.toFixed(1),
    };
  });
  console.log(JSON.stringify(s));
  if (n < 3) await page.screenshot({ path: `${out}/as-${n++}.png` });
  if (s.phase === "won" || s.phase === "fall") {
    await wait(2500);
    await page.screenshot({ path: `${out}/as-end.png` });
    break;
  }
}
await browser.close();
