// Beats the Hollow on Apex, presses "The sky", and captures the world-end scene.
import puppeteer from "puppeteer-core";
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
        levels: Object.fromEntries(
          ["foundry", "tide", "city", "canyon", "ridge", "glacier", "eclipse"].map((id) => [
            id,
            rec,
          ]),
        ),
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
  window.__bot = { last: 0 };
  const loop = () => {
    const p = e.probe();
    const b = window.__bot;
    if (p.phase === "pick") e.choose(0);
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
  e.startLevel(7);
});
const t = Date.now();
while (Date.now() - t < 300000) {
  const ph = await page.evaluate(() => window.__spire.phase);
  if (ph === "won" || ph === "fall") break;
  await wait(200);
}
console.log("phase", await page.evaluate(() => window.__spire.phase));
await wait(3500);
await page.evaluate(() => {
  for (const b of document.querySelectorAll("button"))
    if (b.textContent?.trim().startsWith("The sky")) {
      b.click();
      break;
    }
});
await wait(1200);
await page.screenshot({ path: "/tmp/spire-end-1.png" });
await wait(3000);
await page.screenshot({ path: "/tmp/spire-end-2.png" });
await wait(4000);
await page.screenshot({ path: "/tmp/spire-end-3.png" });
await page.mouse.click(195, 400);
await wait(1500);
await page.screenshot({ path: "/tmp/spire-end-4.png" });
console.log(errors.join("\n") || "no errors");
await browser.close();
