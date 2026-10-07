// The title and the world select with the painted art in public/art/.
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
        levels: { foundry: rec, tide: rec, city: rec },
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
await wait(3500);
await page.screenshot({ path: `${out}/p-1.png` });
await page.mouse.click(195, 400);
await wait(1400);
await page.screenshot({ path: `${out}/p-2.png` });
await page.evaluate(() => {
  const r = document.querySelector(".world-row");
  r.scrollLeft = r.children[1].offsetLeft - (r.clientWidth - r.children[1].clientWidth) / 2;
  r.dispatchEvent(new Event("scroll"));
});
await wait(900);
await page.screenshot({ path: `${out}/p-3.png` });
await browser.close();
