// The title reveal over time, then the tap's flare into the worlds.
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
await page.goto("http://localhost:8080/", { waitUntil: "domcontentloaded" });
await page.evaluate(() =>
  localStorage.setItem(
    "spire-v2",
    JSON.stringify({
      v: 2,
      music: true,
      sfx: true,
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
    }),
  ),
);
await page.reload({ waitUntil: "domcontentloaded" });
const t0 = Date.now();
for (const at of [600, 2200, 3600, 6000]) {
  await wait(at - (Date.now() - t0));
  await page.screenshot({ path: `${out}/title-${at}.png` });
}
await page.mouse.click(195, 500);
await wait(700);
await page.screenshot({ path: `${out}/title-tap.png` });
await wait(1600);
await page.screenshot({ path: `${out}/title-after.png` });
await browser.close();
