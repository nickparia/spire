// The Descent's drill: a bot that fires only when dead on a target (or, with CARELESS=1,
// whenever), preferring seams; logs depth and the oil's gap, and shoots the run.
import puppeteer from "puppeteer-core";
const [out = "/tmp", level = "8"] = process.argv.slice(2);
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
  (level, careless) => {
    const e = window.__spire;
    e.startLevel(Number(level));
    let last = 0;
    const loop = () => {
      const d = e.drill;
      if (
        d &&
        !d.bore &&
        (e.phase === "ready" || e.phase === "play") &&
        performance.now() - last > Number(window.__react || 250)
      ) {
        const a = d.aimed();
        const want = careless
          ? Math.random() < 0.04
          : a && a.perfect && (a.target.kind === "seam" || d.gap < 160);
        if (want) {
          e.tap();
          last = performance.now();
        }
      }
      requestAnimationFrame(loop);
    };
    loop();
  },
  level,
  !!process.env.CARELESS,
);
let n = 0;
for (let i = 0; i < 45; i++) {
  await wait(2000);
  const s = await page.evaluate(() => {
    const e = window.__spire;
    const d = e.drill;
    return {
      phase: e.phase,
      floors: d?.floors,
      gap: d ? Math.round(d.gap) : null,
      volume: d?.volume.toFixed(2),
      light: d?.light.toFixed(2),
      t: e.runTime.toFixed(1),
    };
  });
  console.log(JSON.stringify(s));
  if (i % 4 === 1 && n < 4) await page.screenshot({ path: `${out}/dr-${n++}.png` });
  if (s.phase === "won" || s.phase === "fall") {
    await wait(1500);
    await page.screenshot({ path: `${out}/dr-end.png` });
    break;
  }
}
await browser.close();
