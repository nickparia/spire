// Gale Ridge three-starred: the Gale card should be open; then its first sky in play.
import puppeteer from "puppeteer-core";
const [out = "/tmp"] = process.argv.slice(2);
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
await page.evaluate(() => {
  const done = {
    clear: true,
    precise: true,
    swift: true,
    bestTime: 30,
    bestAccuracy: 0.95,
    runs: 2,
  };
  const some = {
    clear: true,
    precise: false,
    swift: false,
    bestTime: 50,
    bestAccuracy: 0.8,
    runs: 1,
  };
  localStorage.setItem(
    "spire-v2",
    JSON.stringify({
      v: 2,
      music: false,
      sfx: false,
      levels: { foundry: some, tide: some, city: some, canyon: some, ridge: done },
      endless: { best: 0, bestFloors: 0 },
      tips: { dark: 9, wind: 9, fall: 9 },
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
      tester: false,
      progress: { hearth: 5 },
    }),
  );
});
await page.reload({ waitUntil: "networkidle0" });
await wait(1200);
await page.mouse.click(195, 500);
await wait(2000);
const r = await page.evaluate(() => {
  const card = [...document.querySelectorAll("[class*=wpanel]")].find((c) =>
    /The Gale/.test(c.textContent || ""),
  );
  if (!card) return "no card";
  card.scrollIntoView({ inline: "center" });
  const btn = [...card.querySelectorAll("button")].find((b) => /Begin/.test(b.textContent || ""));
  return btn ? "open" : "locked: " + (card.textContent || "").slice(-60);
});
console.log(r);
await wait(800);
await page.screenshot({ path: `${out}/gale-card.png` });
await page.evaluate(() => {
  const card = [...document.querySelectorAll("[class*=wpanel]")].find((c) =>
    /The Gale/.test(c.textContent || ""),
  );
  const btn =
    card && [...card.querySelectorAll("button")].find((b) => /Begin/.test(b.textContent || ""));
  btn?.click();
});
await wait(2500);
await page.screenshot({ path: `${out}/gale-ready.png` });
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
await wait(9000);
await page.screenshot({ path: `${out}/gale-play.png` });
console.log(
  JSON.stringify(
    await page.evaluate(() => ({
      phase: window.__spire.phase,
      floors: window.__spire.floors,
      level: window.__spire.levelIndex,
    })),
  ),
);
await browser.close();
