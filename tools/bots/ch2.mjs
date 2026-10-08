// The Descent relit: Chapter II in the story list, and read through.
import puppeteer from "puppeteer-core";
const out = process.argv[2] || "/tmp";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
const ids = [
  "roots",
  "ossuary",
  "drowned",
  "crystal",
  "furnace",
  "quiet",
  "hollow",
  "floor",
  "foundry",
  "tide",
  "city",
  "canyon",
  "ridge",
  "glacier",
  "eclipse",
  "apex",
];
await page.evaluate(
  (ids) =>
    localStorage.setItem(
      "spire-v2",
      JSON.stringify({
        v: 2,
        music: false,
        sfx: false,
        levels: Object.fromEntries(
          ids.map((id) => [
            id,
            { clear: true, precise: true, swift: true, bestTime: 30, bestAccuracy: 0.9, runs: 1 },
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
        chaptersSeen: ["prologue", "hearth", "descent"],
      }),
    ),
  ids,
);
await page.reload({ waitUntil: "networkidle0" });
await wait(500);
console.log(
  "save chapters:",
  await page.evaluate(() => JSON.stringify(window.__spire.save.chaptersSeen)),
);
await page.evaluate(() => document.querySelector(".splash")?.click());
await wait(2400);
await page.evaluate(() => {
  for (const b of document.querySelectorAll("button"))
    if (b.textContent?.trim().toLowerCase().startsWith("story")) {
      b.click();
      return;
    }
});
await wait(1000);
console.log(
  "listed:",
  await page.evaluate(() =>
    [...document.querySelectorAll(".chapter-pick")].map((b) => b.textContent?.trim()).join(" | "),
  ),
);
await page.screenshot({ path: `${out}/ch2-list.png` });
await page.evaluate(() => [...document.querySelectorAll(".chapter-pick")].pop()?.click());
for (let i = 0; i < 4; i++) {
  await wait(1800);
  await page.screenshot({ path: `${out}/ch2-${i}.png` });
  await page.mouse.click(195, 300);
}
await browser.close();
