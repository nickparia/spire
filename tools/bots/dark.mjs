// The painted Dark: plays a sky cleanly for a while, then shoots it with the Dark far and near.
import puppeteer from "puppeteer-core";
const out = process.argv[2] || "/tmp";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
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
await page.evaluate(() => {
  const e = window.__spire;
  e.startLevel(Number(new URLSearchParams(location.search).get("l") ?? 1));
  window.__bot = { last: 0 };
  const loop = () => {
    const p = e.probe();
    if (p.phase === "pick") document.querySelector(".gift:last-child")?.click();
    if (
      (p.phase === "ready" || p.phase === "play") &&
      !p.blocked &&
      performance.now() - window.__bot.last > 1100 &&
      Math.abs(p.offset) <= p.tol * 0.4
    ) {
      e.tap();
      window.__bot.last = performance.now();
    }
    requestAnimationFrame(loop);
  };
  loop();
});
await wait(14000);
await page.screenshot({ path: `${out}/dark-a.png` });
await page.evaluate(() => {
  const e = window.__spire;
  window.__bot.last = 1e12;
  const top = e.stack[e.stack.length - 1];
  e.dark = top.y - 150;
  e.darkShown = e.dark;
});
await wait(1500);
await page.screenshot({ path: `${out}/dark-b.png` });
await browser.close();
