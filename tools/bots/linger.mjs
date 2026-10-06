// Plays Gale Ridge perfectly but slowly, so the run outstays par; logs the Dark quickening.
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
const rec = { clear: true, precise: true, swift: false, bestTime: 30, bestAccuracy: 0.9, runs: 1 };
await page.evaluate(
  (rec) =>
    localStorage.setItem(
      "spire-v2",
      JSON.stringify({
        v: 2,
        music: false,
        sfx: false,
        levels: Object.fromEntries(["foundry", "tide", "city", "canyon"].map((id) => [id, rec])),
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
  rec,
);
await page.reload({ waitUntil: "networkidle0" });
await wait(300);
await page.evaluate(() => {
  const e = window.__spire;
  window.__log = [];
  window.__bot = { last: 0 };
  const loop = () => {
    const p = e.probe();
    const b = window.__bot;
    if (p.phase === "pick") document.querySelector(".gift:last-child")?.click();
    if (
      (p.phase === "ready" || p.phase === "play") &&
      !p.blocked &&
      performance.now() - b.last > 2600 &&
      Math.abs(p.offset) <= p.tol * 0.4
    ) {
      e.tap();
      b.last = performance.now();
    }
    for (const f of e.floaters)
      if (f.text === "THE DARK QUICKENS" && !f.seen) {
        f.seen = true;
        window.__log.push(
          `${e.runTime.toFixed(0)}s QUICKENS floors=${e.floors} gap=${e.darkGap().toFixed(1)}`,
        );
      }
    requestAnimationFrame(loop);
  };
  loop();
  e.startLevel(4);
  setInterval(
    () =>
      window.__log.push(
        `${e.runTime.toFixed(0)}s floors=${e.floors} gap=${e.darkGap().toFixed(1)} x${e.quickening().toFixed(2)}`,
      ),
    10000,
  );
});
const t = Date.now();
while (Date.now() - t < 200000) {
  if (await page.evaluate(() => window.__spire.phase === "won" || window.__spire.phase === "fall"))
    break;
  await wait(500);
}
console.log((await page.evaluate(() => window.__log)).join("\n"));
console.log(
  "end",
  await page.evaluate(
    () =>
      `${window.__spire.phase} floors=${window.__spire.floors} t=${window.__spire.runTime.toFixed(0)} taken=${window.__spire.taken}`,
  ),
);
await browser.close();
