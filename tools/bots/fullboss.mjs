// Climbs Apex cleanly, then escapes at 5 taps a second down the tower it built.
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
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
      tester: true,
    }),
  ),
);
await page.reload({ waitUntil: "networkidle0" });
await wait(300);
await page.evaluate(() => {
  const e = window.__spire;
  window.__b = { last: 0, log: [] };
  const loop = () => {
    const p = e.probe();
    const b = window.__b;
    if (p.phase === "pick") document.querySelector(".gift")?.click();
    if (e.escape) {
      if (!b.esc) {
        b.esc = e.runTime;
        b.log.push(
          `escape at ${e.runTime.toFixed(0)}s: ${e.escape.total} slabs, ${e.escape.charged.size} charged, ${e.escape.heavy.size} heavy`,
        );
        b.tap = setInterval(() => e.tap(), 200);
      }
    } else if (
      (p.phase === "ready" || p.phase === "play") &&
      !p.blocked &&
      performance.now() - b.last > 900 &&
      Math.abs(p.offset) <= p.tol * 0.4
    ) {
      e.tap();
      b.last = performance.now();
    }
    requestAnimationFrame(loop);
  };
  loop();
  e.startLevel(7);
});
const t = Date.now();
while (Date.now() - t < 240000) {
  if (
    await page.evaluate(
      () =>
        window.__spire.phase === "won" ||
        (window.__spire.phase === "fall" && !window.__spire.escapeTower),
    )
  )
    break;
  await wait(300);
}
console.log((await page.evaluate(() => window.__b.log)).join("\n"));
console.log(
  JSON.stringify(
    await page.evaluate(() => ({
      phase: window.__spire.phase,
      t: window.__spire.runTime.toFixed(0),
      boss: window.__spire.result?.boss,
      title: document.querySelector(".sheet-title")?.textContent,
    })),
  ),
  errors.join(" ") || "no errors",
);
await browser.close();
