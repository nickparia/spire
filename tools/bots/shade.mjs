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
const A = "aaaaaaaa-2222-4333-8444-555555555555",
  B = "bbbbbbbb-2222-4333-8444-555555555555";
const saveFor = (id, name, extra = {}) => ({
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
  playerId: id,
  name,
  feats: {},
  ...extra,
});
const play = async (lvl, pace) => {
  await page.evaluate(
    ({ lvl, pace }) => {
      const e = window.__spire;
      window.__bot = { last: 0 };
      const loop = () => {
        const p = e.probe();
        const b = window.__bot;
        if (p.phase === "pick") e.choose(0);
        if (
          (p.phase === "ready" || p.phase === "play") &&
          !p.blocked &&
          performance.now() - b.last > pace &&
          Math.abs(p.offset) <= p.tol * 0.4
        ) {
          e.tap();
          b.last = performance.now();
        }
        requestAnimationFrame(loop);
      };
      loop();
      e.startLevel(lvl);
    },
    { lvl, pace },
  );
  const t = Date.now();
  while (Date.now() - t < 90000) {
    const ph = await page.evaluate(() => window.__spire.phase);
    if (ph === "won" || ph === "fall") break;
    await wait(100);
  }
  await wait(4000);
};
// Lois (A) sets a slow time.
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate((s) => localStorage.setItem("spire-v2", JSON.stringify(s)), saveFor(A, "Lois"));
await page.reload({ waitUntil: "networkidle0" });
await wait(300);
await play(0, 1500);
// Nick (B) competes with Lois, beats her, throws shade.
await page.evaluate((s) => localStorage.setItem("spire-v2", JSON.stringify(s)), saveFor(B, "Nick"));
await page.reload({ waitUntil: "networkidle0" });
await wait(300);
await page.evaluate(() => {
  for (const b of document.querySelectorAll("button"))
    if (b.textContent?.trim() === "Skies") {
      b.click();
      break;
    }
});
await wait(500);
await page.evaluate(() => {
  document.querySelector(".level-head")?.click();
});
await wait(300);
await page.evaluate(() => {
  document.querySelector(".btn-board")?.click();
});
await wait(2500);
await page.evaluate(() => {
  for (const row of document.querySelectorAll(".board-row"))
    if (row.querySelector(".board-name")?.textContent?.startsWith("Lois")) {
      row.querySelector(".board-cta")?.click();
      break;
    }
});
await wait(2500);
console.log(
  "rival:",
  await page.evaluate(() => JSON.parse(localStorage.getItem("spire-v2")).rival?.name),
);
await page.evaluate(() => {
  document.querySelector('[aria-label="Back"]')?.click();
});
await wait(300);
await play(0, 900);
await page.screenshot({ path: "sh-1.png" });
await page.evaluate(() => document.querySelector(".shade-throw")?.click());
await wait(2500);
console.log(
  "throw:",
  await page.evaluate(() => document.querySelector(".shade-done")?.textContent),
);
// Lois logs in: a shade mark on the Foundry's Play button; tap it, race Nick.
await page.evaluate((s) => localStorage.setItem("spire-v2", JSON.stringify(s)), saveFor(A, "Lois"));
await page.reload({ waitUntil: "networkidle0" });
await wait(2500);
await page.screenshot({ path: "sh-2.png" });
console.log("mark:", await page.evaluate(() => document.querySelector(".shade-mark")?.textContent));
await page.evaluate(() => document.querySelector(".shade-mark")?.click());
await wait(400);
await page.screenshot({ path: "sh-3.png" });
await page.evaluate(() => document.querySelector(".shade-race")?.click());
await wait(3000);
console.log(
  "after race: phase",
  await page.evaluate(() => window.__spire.phase),
  "rival",
  await page.evaluate(() => JSON.parse(localStorage.getItem("spire-v2")).rival?.name),
  "ghost",
  await page.evaluate(() => window.__spire.ghostName),
);
await wait(3000);
await page.screenshot({ path: "sh-4.png" });
console.log(errors.join("\n") || "no errors");
await browser.close();
