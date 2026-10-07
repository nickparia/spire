// Fresh save with tester tools on: the Boss button on Hearth's panel starts the escape.
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
    }),
  ),
);
await page.reload({ waitUntil: "networkidle0" });
await wait(500);
await page.mouse.click(195, 400);
await wait(1000);
await page.screenshot({ path: `${out}/bb-1.png` });
await page.evaluate(() => document.querySelector(".wpanel-focus .wpanel-boss")?.click());
await wait(1800);
await page.screenshot({ path: `${out}/bb-2.png` });
console.log(
  JSON.stringify(
    await page.evaluate(() => ({
      phase: window.__spire.phase,
      escape: !!window.__spire.escape,
      level: window.__spire.levelIndex,
    })),
  ),
  errors.join(" ") || "no errors",
);
await browser.close();
