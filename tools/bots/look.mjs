// Captures the story, the ready text, and a landing's cards dealt and taken.
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
const rec = { clear: true, precise: true, swift: false, bestTime: 30, bestAccuracy: 0.9, runs: 1 };
const save = (extra) => ({
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
  savedAt: 5,
  ...extra,
});
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate(
  (s) => localStorage.setItem("spire-v2", JSON.stringify(s)),
  save({ storySeen: false }),
);
await page.reload({ waitUntil: "networkidle0" });
await wait(2600);
await page.screenshot({ path: `${out}/look-1.png` });
await wait(6500);
await page.screenshot({ path: `${out}/look-2.png` });
await page.evaluate(
  (s) => localStorage.setItem("spire-v2", JSON.stringify(s)),
  save({ storySeen: true }),
);
await page.reload({ waitUntil: "networkidle0" });
await wait(400);
await page.evaluate(() => window.__spire.startLevel(4));
await wait(1600);
await page.screenshot({ path: `${out}/look-3.png` });
await page.evaluate(() => window.__spire.showMenu(0));
await wait(300);
await page.evaluate(() => {
  const e = window.__spire;
  window.__bot = { last: 0 };
  const loop = () => {
    const p = e.probe();
    const b = window.__bot;
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
  e.startLevel(0);
});
const t = Date.now();
while (Date.now() - t < 60000) {
  if (await page.evaluate(() => !!document.querySelector(".gifts"))) break;
  await wait(50);
}
await wait(350);
await page.screenshot({ path: `${out}/look-4.png` });
await wait(1500);
await page.screenshot({ path: `${out}/look-5.png` });
await page.evaluate(() => document.querySelector(".gift")?.click());
await wait(380);
await page.screenshot({ path: `${out}/look-6.png` });
await wait(700);
await page.screenshot({ path: `${out}/look-7.png` });
console.log(errors.join("\n") || "no errors");
await browser.close();
