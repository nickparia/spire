// The title loop playing; then a boss win through "The sky" into the world-end film,
// mid-film and after it ends with the line.
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
        levels: Object.fromEntries(
          ["foundry", "tide", "city", "canyon", "ridge", "glacier", "eclipse"].map((id) => [
            id,
            rec,
          ]),
        ),
        endless: { best: 0, bestFloors: 0 },
        tips: { escape: 1 },
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
  rec,
);
await page.reload({ waitUntil: "networkidle0" });
await wait(3000);
console.log(
  "title video:",
  await page.evaluate(() => {
    const v = document.querySelector(".splash video");
    return v ? `ready=${v.readyState} t=${v.currentTime.toFixed(1)} paused=${v.paused}` : "none";
  }),
);
await page.screenshot({ path: `${out}/f-1.png` });
await page.mouse.click(195, 400);
await wait(900);
await page.evaluate(() => document.querySelector(".wpanel-focus .wpanel-boss")?.click());
await wait(3600);
await page.evaluate(() => {
  const e = window.__spire;
  window.__t = setInterval(() => e.tap(), 120);
});
const t = Date.now();
while (Date.now() - t < 60000) {
  if (await page.evaluate(() => window.__spire.phase === "won")) break;
  await wait(200);
}
await page.evaluate(() => clearInterval(window.__t));
await wait(3500);
console.log("won; next:", await click("The sky"));
await wait(5000);
await page.screenshot({ path: `${out}/f-2.png` });
await wait(9000);
await page.screenshot({ path: `${out}/f-3.png` });
console.log(
  "film:",
  await page.evaluate(() => {
    const v = document.querySelector(".world-end video");
    return v ? `ended=${v.ended} t=${v.currentTime.toFixed(1)}` : "none";
  }),
);
await browser.close();
console.log(errors.join(" ") || "no errors");
