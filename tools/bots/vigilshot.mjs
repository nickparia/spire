// The Vigil's screens, with a non-tester save that has lit the Foundry: the worlds row on the
// Vigil card, the ready card, a fall card, the board, and the summit card (won by hand).
// Usage: node tools/bots/vigilshot.mjs <out dir>
import puppeteer from "puppeteer-core";
const [out = "/tmp"] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 300)));
page.on("console", (m) => {
  if (m.type() === "error") console.log("console.error", m.text().slice(0, 200));
});
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
          swift: false,
          bestTime: 30,
          bestAccuracy: 0.9,
          runs: 1,
        },
      },
      endless: { best: 0, bestFloors: 0 },
      tips: { dark: 9, loose: 9 },
      coins: 0,
      tracks: {},
      levels2: {},
      weapon: "buttress",
      ghosts: {},
      name: "",
      feats: {},
      whatsNewSeen: 999,
      storySeen: true,
      savedAt: 5,
      tester: false,
    }),
  ),
);
await page.reload({ waitUntil: "networkidle0" });
await wait(500);
// Through the title to the worlds, then scroll the row to the Vigil card.
await page.click(".splash");
await wait(2600);
await page.evaluate(() => {
  const row = document.querySelector(".world-row");
  const card = document.querySelector(".wpanel-vigil");
  row.scrollLeft = card.offsetLeft - (row.clientWidth - card.clientWidth) / 2;
});
await wait(900);
await page.screenshot({ path: `${out}/vg-card.png` });
const card = await page.evaluate(() => document.querySelector(".wpanel-vigil")?.innerText);
console.log("card:", JSON.stringify(card));
// Climb: the primary button on the card.
await page.evaluate(() => document.querySelector(".wpanel-vigil .btn-primary").click());
await wait(1200);
await page.screenshot({ path: `${out}/vg-ready.png` });
const phase = await page.evaluate(() => window.__spire.probe().phase);
console.log("phase after Climb:", phase);
// A few floors, then a fall: tap when far off.
await page.evaluate(() => {
  const e = window.__spire;
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
      if (b.n < 6 ? Math.abs(p.offset) < p.tol : Math.abs(p.offset) > e.mover.w * 0.9) {
        e.tap();
        b.last = performance.now();
        b.n++;
      }
    }
    requestAnimationFrame(loop);
  };
  loop();
});
for (let i = 0; i < 60; i++) {
  await wait(500);
  if ((await page.evaluate(() => window.__spire.probe().phase)) === "over") break;
}
await wait(1200);
await page.screenshot({ path: `${out}/vg-fall.png` });
console.log(
  "fall card:",
  JSON.stringify(await page.evaluate(() => document.querySelector(".panel")?.innerText)),
);
console.log(
  "save.vigil:",
  await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem("spire-v2")).vigil)),
);
// The board from the fall card.
await page.evaluate(() =>
  [...document.querySelectorAll(".panel .btn")]
    .find((b) => b.textContent.includes("Board"))
    .click(),
);
await wait(2500);
await page.screenshot({ path: `${out}/vg-board.png` });
console.log(
  "board:",
  JSON.stringify(await page.evaluate(() => document.querySelector(".screen")?.innerText)),
);
// Climb again from the board, then win by hand for the summit card.
await page.evaluate(() => document.querySelector(".screen .btn-primary").click());
await wait(1500);
await page.evaluate(() => {
  const e = window.__spire;
  window.__bot = { last: 0, n: 0 };
  const loop = () => {
    const p = e.probe();
    const b = window.__bot;
    if (
      (p.phase === "ready" || p.phase === "play") &&
      !p.blocked &&
      performance.now() - b.last > 700 &&
      b.n < 5 &&
      Math.abs(p.offset) < p.tol
    ) {
      e.tap();
      b.last = performance.now();
      b.n++;
    }
    requestAnimationFrame(loop);
  };
  loop();
});
await wait(9000);
await page.evaluate(() => window.__spire.win());
await wait(3500);
await page.screenshot({ path: `${out}/vg-won.png` });
console.log(
  "summit card:",
  JSON.stringify(await page.evaluate(() => document.querySelector(".panel")?.innerText)),
);
console.log(
  "feats:",
  await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem("spire-v2")).feats)),
);
console.log(
  "save.vigil:",
  await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem("spire-v2")).vigil)),
);
// Back to the worlds: the card after a run.
await page.evaluate(() =>
  [...document.querySelectorAll(".panel .btn")]
    .find((b) => b.textContent.includes("Worlds"))
    .click(),
);
await wait(1500);
await page.evaluate(() => {
  const row = document.querySelector(".world-row");
  const card = document.querySelector(".wpanel-vigil");
  row.scrollLeft = card.offsetLeft - (row.clientWidth - card.clientWidth) / 2;
});
await wait(900);
await page.screenshot({ path: `${out}/vg-card2.png` });
console.log(
  "card after:",
  JSON.stringify(await page.evaluate(() => document.querySelector(".wpanel-vigil")?.innerText)),
);
await browser.close();
