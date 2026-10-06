import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
const rec = { clear: true, precise: true, swift: false, bestTime: 30, bestAccuracy: 0.9, runs: 1 };
await page.evaluate(
  (rec) =>
    localStorage.setItem(
      "spire-v2",
      JSON.stringify({
        v: 2,
        music: false,
        sfx: false,
        levels: Object.fromEntries(["foundry", "tide", "city"].map((id) => [id, rec])),
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
        savedAt: 5,
      }),
    ),
  rec,
);
await page.reload({ waitUntil: "networkidle0" });
await wait(3500);
await page.screenshot({ path: "w-1.png" });
await page.evaluate(() => {
  for (const b of document.querySelectorAll("button"))
    if (b.textContent?.trim() === "Begin") {
      b.click();
      break;
    }
});
await wait(400);
await page.evaluate(() => {
  for (const b of document.querySelectorAll("button"))
    if (b.textContent?.trim() === "Worlds") {
      b.click();
      break;
    }
});
await wait(1200);
await page.screenshot({ path: "w-2.png" });
await browser.close();
