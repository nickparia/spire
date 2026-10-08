// Apex's split section, met for the first time: the demo must drop or step aside, and taps must work.
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });
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
      tips: {},
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
      practice: true,
    }),
  ),
);
await page.reload({ waitUntil: "networkidle0" });
await page.evaluate(() => {
  const e = window.__spire;
  e.startLevel(7);
  e.tap();
});
await wait(1500);
await page.evaluate(() => {
  const e = window.__spire;
  e.floors = 40;
  e.spawnMover();
});
for (let i = 0; i < 8; i++) {
  await wait(800);
  console.log(
    JSON.stringify(
      await page.evaluate(() => {
        const e = window.__spire;
        return {
          t: e.clock.toFixed(1),
          course: e.mover.course,
          split: e.mover.split,
          demo: e.demo,
          floors: e.floors,
          phase: e.phase,
        };
      }),
    ),
  );
}
const before = await page.evaluate(() => window.__spire.stack.length);
await page.evaluate(() => window.__spire.tap());
await wait(1500);
console.log("tap placed:", (await page.evaluate(() => window.__spire.stack.length)) > before);
await browser.close();
