// Walks the app shell: title, world select (swiping to a locked world), a world's skies, Achievements, Options.
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
        feats: { "first-light": 1, "three-stars": 1 },
        whatsNewSeen: 99,
        storySeen: true,
        savedAt: 5,
      }),
    ),
  rec,
);
await page.reload({ waitUntil: "networkidle0" });
await wait(3800);
await page.screenshot({ path: `${out}/shell-1.png` });
await page.mouse.click(195, 400);
await wait(1500);
await page.screenshot({ path: `${out}/shell-2.png` });
await page.evaluate(() => {
  const r = document.querySelector(".world-row");
  r.scrollLeft = r.children[1].offsetLeft - (r.clientWidth - r.children[1].clientWidth) / 2;
  r.dispatchEvent(new Event("scroll"));
});
await wait(900);
await page.screenshot({ path: `${out}/shell-3.png` });
await page.evaluate(() => {
  const r = document.querySelector(".world-row");
  r.scrollLeft = 0;
  r.dispatchEvent(new Event("scroll"));
});
await wait(700);
await click("Achievements");
await wait(1200);
await page.screenshot({ path: `${out}/shell-4.png` });
console.log(errors.join("\n") || "no errors");
await browser.close();
