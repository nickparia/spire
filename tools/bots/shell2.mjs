// The world's skies (tester on so locks show), the summit card without coins, and Options.
import puppeteer from "puppeteer-core";
const out = process.argv[2] || "/tmp";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const click = (text) =>
  page.evaluate((text) => {
    for (const b of document.querySelectorAll("button"))
      if (b.textContent?.trim().startsWith(text)) {
        b.click();
        return true;
      }
    return false;
  }, text);
const rec = { clear: true, precise: true, swift: false, bestTime: 30, bestAccuracy: 0.9, runs: 1 };
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate(
  (rec) =>
    localStorage.setItem(
      "spire-v2",
      JSON.stringify({
        v: 2,
        music: false,
        sfx: false,
        levels: { foundry: rec },
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
await wait(500);
await page.mouse.click(195, 400);
await wait(900);
await page.evaluate(() => document.querySelector(".wpanel-focus .wpanel-art")?.click());
await wait(900);
await page.screenshot({ path: `${out}/s2-1.png` });
await click("Play");
await wait(500);
await page.evaluate(() => {
  const e = window.__spire;
  window.__bot = { last: 0 };
  const loop = () => {
    const p = e.probe();
    const b = window.__bot;
    if (p.phase === "pick") document.querySelector(".gift")?.click();
    if (
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
});
const t = Date.now();
while (Date.now() - t < 90000) {
  if (await page.evaluate(() => window.__spire.phase === "won")) break;
  await wait(300);
}
await wait(4500);
await page.screenshot({ path: `${out}/s2-2.png` });
console.log(
  "progress",
  await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem("spire-v2")).progress)),
);
await page.evaluate(() => window.__spire.showMenu(0));
await wait(200);
await page.reload({ waitUntil: "networkidle0" });
await wait(500);
await page.mouse.click(195, 400);
await wait(900);
await page.evaluate(() => document.querySelector(".home-btn")?.click());
await wait(600);
await page.screenshot({ path: `${out}/s2-3.png` });
console.log(errors.join("\n") || "no errors");
await browser.close();
