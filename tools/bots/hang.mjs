// The Descent's tug of war in the game: a bot that catches within `err` px of the tip; logs and shoots.
import puppeteer from "puppeteer-core";
const [out = "/tmp", level = "8", errArg = "8"] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 200)));
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
  (level, err) => {
    const e = window.__spire;
    e.startLevel(Number(level));
    let last = 0;
    const loop = () => {
      const h = e.hang;
      if (
        h &&
        h.fall < 0 &&
        (e.phase === "ready" || e.phase === "play") &&
        performance.now() - last > 500
      ) {
        const tp = h.tip();
        if (Math.abs(h.stoneX() - tp.x) < err) {
          e.tap();
          last = performance.now();
        }
      }
      requestAnimationFrame(loop);
    };
    loop();
  },
  level,
  Number(errArg),
);
let n = 0;
for (let i = 0; i < 20; i++) {
  await wait(3000);
  const s = await page.evaluate(() => {
    const e = window.__spire;
    const h = e.hang;
    return {
      phase: e.phase,
      stones: h ? h.stones.length - 1 : null,
      strain: h ? h.strain.toFixed(2) : null,
      held: h?.held,
      tipX: h ? Math.round(h.tip().x) : null,
      t: e.runTime.toFixed(1),
    };
  });
  console.log(JSON.stringify(s));
  if (i % 2 === 0 && n < 4) await page.screenshot({ path: `${out}/hn-${n++}.png` });
  if (s.phase === "won" || s.phase === "fall") {
    await wait(2000);
    await page.screenshot({ path: `${out}/hn-end.png` });
    break;
  }
}
await browser.close();
