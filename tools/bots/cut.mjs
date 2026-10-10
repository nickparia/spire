// The cutting wheel in the game: alternates pads, steadies at the centre when the cradle leans or the arm blocks.
// Usage: node tools/bots/cut.mjs <out-dir> <level index> [max s]
import puppeteer from "puppeteer-core";
const [out = "/tmp", level = "8", max = "90"] = process.argv.slice(2);
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
  let k = 0,
    last = 0;
  const loop = () => {
    const p = e.probe();
    const now = performance.now();
    if (p.phase === "pick") e.choose(0);
    else if (
      (p.phase === "ready" || p.phase === "play") &&
      !p.blocked &&
      now - last > 500 &&
      e.cut
    ) {
      const side = k % 2 ? -1 : 1;
      const lean = e.stage ? e.stage.cradleAngle() : 0;
      let want = 0;
      if (Math.abs(lean) < 0.12 && !(e.cut.arm && e.cut.arm.side === side)) {
        want = e.padX(e.cut.pads.find((q) => q.side === side));
      }
      const x = e.mover.x + e.mover.w / 2;
      if (e.mover.fallT < 0 && Math.abs(x - want) < 8) {
        e.tap();
        k++;
        last = now;
      }
    }
    requestAnimationFrame(loop);
  };
  loop();
}, level);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let shots = 0;
let lastS = "";
for (let t = 0; t < Number(max) * 2; t++) {
  await wait(500);
  const s = await page.evaluate(() => {
    const e = window.__spire;
    const c = e.cut;
    return {
      phase: e.phase,
      floors: e.floors,
      t: e.runTime.toFixed(1),
      depth: c ? c.depth.toFixed(1) : null,
      spin: c ? c.spin.toFixed(2) : null,
      gap: c ? c.gap.toFixed(1) : null,
      lean: e.stage ? e.stage.cradleAngle().toFixed(2) : null,
      arm: c && c.arm ? c.arm.side : 0,
    };
  });
  lastS = JSON.stringify(s);
  if (shots === 0 && s.floors >= 4) {
    shots++;
    await page.screenshot({ path: `${out}/cut-a.png` });
  }
  if (shots === 1 && s.arm !== 0) {
    shots++;
    await page.screenshot({ path: `${out}/cut-b.png` });
  }
  if (["won", "fall", "over", "menu"].includes(s.phase)) break;
}
await wait(600);
await page.screenshot({ path: `${out}/cut-end.png` });
console.log(lastS);
await browser.close();
