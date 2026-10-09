// The achievements screen with some finishes earned, then a climb wearing one.
// Usage: node tools/bots/finishes.mjs <out-dir>
import puppeteer from "puppeteer-core";
const [out = "/tmp"] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
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
      levels: {
        foundry: {
          clear: true,
          precise: true,
          swift: true,
          bestTime: 25,
          bestAccuracy: 0.9,
          runs: 1,
        },
        tide: {
          clear: true,
          precise: true,
          swift: true,
          bestTime: 35,
          bestAccuracy: 0.9,
          runs: 1,
        },
        city: {
          clear: true,
          precise: false,
          swift: false,
          bestTime: 50,
          bestAccuracy: 0.8,
          runs: 1,
        },
        canyon: {
          clear: true,
          precise: false,
          swift: false,
          bestTime: 60,
          bestAccuracy: 0.8,
          runs: 1,
        },
      },
      endless: { best: 0, bestFloors: 0 },
      tips: {},
      coins: 0,
      tracks: {},
      levels2: {},
      weapon: "buttress",
      ghosts: {},
      name: "",
      feats: { "first-light": 1, "half-sky": 1, "three-stars": 1 },
      whatsNewSeen: 99,
      storySeen: true,
      savedAt: 5,
      tester: true,
      finish: "tide",
      trail: "ember",
    }),
  ),
);
await page.reload({ waitUntil: "networkidle0" });
await wait(1200);
await page.mouse.click(195, 500);
await wait(2000);
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) =>
    /achievements/i.test(x.textContent || ""),
  );
  b?.click();
});
await wait(1500);
await page.screenshot({ path: `${out}/f-map.png`, fullPage: true });
await page.evaluate(() => {
  for (const el of document.querySelectorAll("*")) {
    if (el.scrollHeight > el.clientHeight + 20) el.scrollTop = el.scrollHeight;
  }
  window.scrollTo(0, document.body.scrollHeight);
});
await wait(600);
await page.screenshot({ path: `${out}/f-finishes.png` });
// A climb on the Foundry wearing Tidewater's stone and the ember trail.
await page.evaluate(() => window.__spire.startLevel(0));
await page.evaluate(() => {
  const e = window.__spire;
  let last = 0;
  const loop = () => {
    const p = e.probe();
    const now = performance.now();
    if (
      (p.phase === "ready" || p.phase === "play") &&
      !p.blocked &&
      now - last > 1100 &&
      Math.abs(p.offset) < p.tol
    ) {
      e.tap();
      last = now;
    }
    requestAnimationFrame(loop);
  };
  loop();
});
await wait(7000);
await page.screenshot({ path: `${out}/f-climb.png` });
await browser.close();
