// The world panel and world-end scene with whatever art is in public/art/.
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
const rec = { clear: true, precise: true, swift: false, bestTime: 30, bestAccuracy: 0.9, runs: 1 };
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate(
  (rec) =>
    localStorage.setItem(
      "spire-v2",
      JSON.stringify({
        v: 2,
        music: false,
        sfx: false,
        levels: Object.fromEntries(
          ["foundry", "tide", "city", "canyon", "ridge", "glacier", "eclipse", "apex"].map((id) => [
            id,
            rec,
          ]),
        ),
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
  rec,
);
await page.reload({ waitUntil: "networkidle0" });
await wait(500);
await page.mouse.click(195, 400);
await wait(1200);
await page.screenshot({ path: `${out}/art-1.png` });
await browser.close();
console.log(errors.join(" ") || "no errors");
