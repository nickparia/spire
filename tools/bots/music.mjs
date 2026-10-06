// Plays the Foundry and logs the score each second: section, tension, layers, swell/strip.
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate(() =>
  localStorage.setItem(
    "spire-v2",
    JSON.stringify({
      v: 2,
      music: true,
      sfx: false,
      levels: {},
      endless: { best: 0, bestFloors: 0 },
      tips: { dark: 9, loose: 9 },
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
    }),
  ),
);
await page.reload({ waitUntil: "networkidle0" });
await wait(300);
await page.mouse.click(195, 300);
await wait(300);
await page.evaluate(() => {
  const e = window.__spire;
  window.__log = [];
  window.__bot = { last: 0, n: 0 };
  const loop = () => {
    const p = e.probe();
    const b = window.__bot;
    if (p.phase === "pick") document.querySelector(".gift")?.click();
    // Clean, but loose for drops 4-7 so a streak breaks and the music thins.
    const target = b.n >= 4 && b.n < 7 ? e.mover.w * 0.18 : 0;
    if (
      (p.phase === "ready" || p.phase === "play") &&
      !p.blocked &&
      performance.now() - b.last > 900 &&
      Math.abs(p.offset - target) <= p.tol * 0.4
    ) {
      e.tap();
      b.last = performance.now();
      b.n++;
    }
    requestAnimationFrame(loop);
  };
  loop();
  e.startLevel(0);
  setInterval(() => {
    const m = e.music;
    const bar = Math.floor(m.step / 16);
    const sec = m.section(bar);
    const c = m.climb;
    const t = m.tension;
    window.__log.push(
      `${e.runTime.toFixed(0).padStart(3)}s fl=${String(e.floors).padStart(2)} bar=${String(bar).padStart(3)} ${sec.kind.padEnd(5)}${sec.fill ? "fill" : "    "} t=${t.toFixed(2)} streak=${String(c.streak).padStart(2)} land=${c.landings} bass=${c.landings >= 1 || t > 0.45 ? 1 : 0} drums=${c.landings >= 2 || t > 0.5 ? 1 : 0} lead=${c.streak >= 3 || t > 0.62 ? 1 : 0} strip=${bar < m.stripUntil ? 1 : 0} swell=${m.swellBar === bar ? 1 : 0}`,
    );
  }, 1000);
});
const t = Date.now();
while (Date.now() - t < 80000) {
  if (await page.evaluate(() => window.__spire.phase === "won" || window.__spire.phase === "fall"))
    break;
  await wait(300);
}
console.log((await page.evaluate(() => window.__log)).join("\n"));
await browser.close();
