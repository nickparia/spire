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
const saveFor = (id, name) => ({
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
  whatsNewSeen: 99,
});
const as = async (id, name) => {
  await page.evaluate(
    (s) => localStorage.setItem("spire-v2", JSON.stringify(s)),
    saveFor(id, name),
  );
  await page.reload({ waitUntil: "networkidle0" });
  await wait(1500);
};
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
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
// Lois posts a slow time.
await as(A, "Lois");
await play(0, 1500);
// Nick posts a fast time, then challenges Lois from the board.
await as(B, "Nick");
await play(0, 900);
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
      row.querySelector("button.board-cta")?.click();
      break;
    }
});
await wait(3000);
await page.screenshot({ path: "ch-1.png" });
console.log(
  "board after send:",
  await page.evaluate(() => document.querySelector(".board-rival")?.textContent?.slice(0, 60)),
);
// Lois sees the invite on her title and accepts.
await as(A, "Lois");
await wait(1500);
await page.screenshot({ path: "ch-2.png" });
console.log(
  "invite:",
  await page.evaluate(() => document.querySelector(".shade-text")?.textContent?.slice(0, 40)),
);
await page.evaluate(() => {
  for (const b of document.querySelectorAll(".shade-btn"))
    if (b.textContent === "Accept") {
      b.click();
      break;
    }
});
await wait(3500);
console.log(
  "Lois rival:",
  await page.evaluate(() => JSON.parse(localStorage.getItem("spire-v2")).rival?.name),
);
// Options sheet.
await page.evaluate(() => document.querySelector('[aria-label="Options"]')?.click());
await wait(500);
await page.screenshot({ path: "ch-3.png" });
await page.evaluate(() => {
  for (const b of document.querySelectorAll("button"))
    if (b.textContent?.trim() === "Done") {
      b.click();
      break;
    }
});
await wait(300);
// Nick, now accepted, replays, beats Lois's ghost and throws shade.
await as(B, "Nick");
await wait(1500);
console.log(
  "Nick rival:",
  await page.evaluate(() => JSON.parse(localStorage.getItem("spire-v2")).rival?.name),
);
await play(0, 900);
console.log(
  "throw button:",
  await page.evaluate(() => document.querySelector(".shade-throw")?.textContent),
);
await page.evaluate(() => document.querySelector(".shade-throw")?.click());
await wait(2500);
console.log(
  "throw:",
  await page.evaluate(() => document.querySelector(".shade-done")?.textContent),
);
console.log(errors.join("\n") || "no errors");
await browser.close();
