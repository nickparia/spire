// Every screen in turn, for a style sweep: home sheets, the skies, ready, pause, a fall, a summit, what's new.
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
const shot = (n) => page.screenshot({ path: `${out}/sw-${n}.png` });
const click = (text) =>
  page.evaluate((text) => {
    for (const b of document.querySelectorAll("button, [role=button]"))
      if (
        b.textContent?.trim().toLowerCase().startsWith(text.toLowerCase()) ||
        b.getAttribute("aria-label")?.toLowerCase().startsWith(text.toLowerCase())
      ) {
        b.click();
        return true;
      }
    return false;
  }, text);
const save = (extra) =>
  page.evaluate(
    (extra) =>
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
              runs: 2,
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
          whatsNewSeen: 99,
          storySeen: true,
          savedAt: 5,
          tester: true,
          chaptersSeen: ["prologue"],
          ...extra,
        }),
      ),
    extra,
  );
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await save({});
await page.reload({ waitUntil: "networkidle0" });
await wait(500);
await click("Enter");
await wait(2400);
for (const name of ["Options", "Leaderboard", "Achievements", "Story"]) {
  await click(name);
  await wait(900);
  await shot(name.toLowerCase());
  const closed = (await click("Done")) || (await click("Close")) || (await click("Back"));
  if (!closed) await page.keyboard.press("Escape");
  await wait(600);
}
await click("See the skies");
await wait(1200);
await shot("skies");
await page.evaluate(() => window.__spire.startLevel(1));
await wait(900);
await shot("ready");
await page.evaluate(() => {
  window.__spire.tap();
});
await wait(1500);
await page.evaluate(() => window.__spire.pause());
await wait(700);
await shot("pause");
await page.evaluate(() => window.__spire.resume());
await wait(300);
await page.evaluate(() => window.__spire.die());
await wait(2600);
await shot("fall");
await page.evaluate(() => window.__spire.startLevel(0));
await wait(400);
await page.evaluate(() => {
  const e = window.__spire;
  e.tap();
});
await wait(1200);
await page.evaluate(() => window.__spire.win());
await wait(5000);
await shot("summit");
await save({ whatsNewSeen: 40 });
await page.reload({ waitUntil: "networkidle0" });
await wait(1500);
await click("Enter");
await wait(2500);
await shot("whatsnew");
await browser.close();
