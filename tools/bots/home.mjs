// Screenshots the world-select screen with a run in progress, at phone widths.
// Usage: node tools/bots/home.mjs <out-dir>
import puppeteer from "puppeteer-core";
const [out = "/tmp"] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (const w of [390, 440]) {
  await page.setViewport({ width: w, height: Math.round(w * 2.17), deviceScaleFactor: 2 });
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
        progress: { hearth: 3 },
      }),
    ),
  );
  await page.reload({ waitUntil: "networkidle0" });
  await wait(1500);
  await page.mouse.click(w / 2, 500);
  await wait(2500);
  await page.screenshot({ path: `${out}/home-${w}.png` });
}
await browser.close();
