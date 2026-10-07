// Captures the escape's briefing, its countdown, and the light reaching a bound slab.
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
await wait(400);
await page.evaluate(() => window.__spire.startBoss(7));
await wait(2000);
await page.screenshot({ path: `${out}/br-1.png` });
await wait(3400);
await page.screenshot({ path: `${out}/br-2.png` });
await wait(2200);
await page.evaluate(() => {
  const e = window.__spire;
  window.__t = setInterval(() => {
    e.tap();
    if (e.escape && e.escape.bound.has(e.stack[e.stack.length - 1])) clearInterval(window.__t);
  }, 200);
});
const t = Date.now();
while (Date.now() - t < 20000) {
  if (
    await page.evaluate(() => {
      const e = window.__spire;
      return e.escape && e.escape.chain === null && e.escape.bound.has(e.stack[e.stack.length - 1]);
    })
  )
    break;
  await wait(50);
}
await wait(400);
await page.screenshot({ path: `${out}/br-3.png` });
await browser.close();
