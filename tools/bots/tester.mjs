// Fresh save: tester tools on through Options, Fight the boss on Apex, then a practice run.
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
const click = (text) =>
  page.evaluate((text) => {
    for (const b of document.querySelectorAll("button"))
      if (b.textContent?.trim().startsWith(text)) {
        b.click();
        return true;
      }
    return false;
  }, text);
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
    }),
  ),
);
await page.reload({ waitUntil: "networkidle0" });
await wait(500);
await page.evaluate(() => document.querySelector('[aria-label="Options"]')?.click());
await wait(400);
await page.evaluate(() => {
  const boxes = document.querySelectorAll('.settings input[type="checkbox"]');
  boxes[1]?.click();
});
await wait(300);
await page.screenshot({ path: `${out}/tester-1.png` });
await click("Done");
await wait(300);
await click("Worlds");
await wait(600);
await click("Continue");
await click("Enter");
await wait(600);
await page.evaluate(() => {
  const heads = document.querySelectorAll(".level-head");
  heads[heads.length - 1]?.click();
});
await wait(500);
await page.evaluate(() => document.querySelector(".levels")?.scrollTo(0, 9999));
await wait(300);
await page.screenshot({ path: `${out}/tester-2.png` });
console.log("boss button:", await click("Fight the boss"));
await wait(2500);
await page.screenshot({ path: `${out}/tester-3.png` });
console.log(
  "state:",
  await page.evaluate(() =>
    JSON.stringify({
      phase: window.__spire.phase,
      floors: window.__spire.floors,
      boss: !!window.__spire.boss,
    }),
  ),
);
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
});
const t = Date.now();
while (Date.now() - t < 120000) {
  if (await page.evaluate(() => ["won", "fall"].includes(window.__spire.phase))) break;
  await wait(300);
}
await wait(4500);
await page.screenshot({ path: `${out}/tester-4.png` });
console.log(
  "boss result:",
  await page.evaluate(() =>
    JSON.stringify({
      phase: window.__spire.phase,
      t: window.__spire.runTime.toFixed(0),
      unranked: window.__spire.result?.unranked,
      post: document.querySelector(".post-line")?.textContent,
    }),
  ),
);
// Practice: Dark off on the Foundry, idle for 20 s.
await page.evaluate(() => {
  window.__bot.last = 1e12;
  const e = window.__spire;
  e.save.practice = true;
  e.showMenu(0);
  e.startLevel(0);
});
await wait(600);
await page.evaluate(() => window.__spire.tap());
await wait(20000);
console.log(
  "practice:",
  await page.evaluate(() =>
    JSON.stringify({
      phase: window.__spire.phase,
      dark: window.__spire.dark.toFixed(0),
      gap: window.__spire.darkGap().toFixed(1),
    }),
  ),
);
console.log(errors.join("\n") || "no errors");
await browser.close();
