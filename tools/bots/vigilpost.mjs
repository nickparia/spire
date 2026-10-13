// Posts a Vigil climb to the live board as a fake player, then climbs lower and checks the day's
// best stands. Delete the row from `vigil` afterwards (player aaaaaaaa-2222-4333-8444-555555555555).
// Usage: node tools/bots/vigilpost.mjs
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 300)));
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
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
      playerId: "aaaaaaaa-2222-4333-8444-555555555555",
      name: "Bot Aaaa",
      feats: {},
      whatsNewSeen: 999,
      storySeen: true,
      savedAt: 5,
      tester: true,
    }),
  ),
);
await page.reload({ waitUntil: "networkidle0" });
const climb = async (floors) => {
  await page.evaluate((floors) => {
    const e = window.__spire;
    e.wake();
    e.startVigil();
    window.__bot = { last: 0, n: 0 };
    const loop = () => {
      const p = e.probe();
      const b = window.__bot;
      if (p.phase === "pick") e.choose(0);
      if (
        (p.phase === "ready" || p.phase === "play") &&
        !p.blocked &&
        performance.now() - b.last > 700
      ) {
        if (b.n < floors ? Math.abs(p.offset) < p.tol : Math.abs(p.offset) > e.mover.w * 0.9) {
          e.tap();
          b.last = performance.now();
          b.n++;
        }
      }
      if (p.phase === "over") return;
      requestAnimationFrame(loop);
    };
    loop();
  }, floors);
  for (let i = 0; i < 120; i++) {
    await wait(500);
    if ((await page.evaluate(() => window.__spire.probe().phase)) === "over") break;
  }
  await wait(3000);
  return page.evaluate(() => ({
    card: document.querySelector(".panel")?.innerText.replace(/\n+/g, " | "),
    vigil: JSON.parse(localStorage.getItem("spire-v2")).vigil,
  }));
};
const a = await climb(8);
console.log("first:", a.card);
console.log("save:", JSON.stringify({ ...a.vigil, ghost: a.vigil.ghost?.length }));
const b = await climb(4);
console.log("second:", b.card);
console.log("save:", JSON.stringify({ ...b.vigil, ghost: b.vigil.ghost?.length }));
// The board, from the card.
await page.evaluate(() =>
  [...document.querySelectorAll(".panel .btn")]
    .find((x) => x.textContent.includes("Board"))
    .click(),
);
await wait(3000);
console.log(
  "board:",
  await page.evaluate(() => document.querySelector(".screen")?.innerText.replace(/\n+/g, " | ")),
);
await browser.close();
