// From the world select's Boss button: the sting, the briefing, the chase with the painted source.
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
await wait(1500);
await page.mouse.click(195, 400);
await wait(900);
await page.evaluate(() => document.querySelector(".wpanel-focus .wpanel-boss")?.click());
await wait(2500);
await page.screenshot({ path: `${out}/b-1.png` });
console.log("sting:", await page.evaluate(() => !!document.querySelector(".sting video")));
await wait(4000);
await page.screenshot({ path: `${out}/b-2.png` });
await wait(6500);
console.log("art ready:", await page.evaluate(() => window.__spire.sourceArtReady));
await page.evaluate(() => {
  const e = window.__spire;
  window.__t = setInterval(() => e.tap(), 260);
});
await wait(4500);
await page.screenshot({ path: `${out}/b-3.png` });
await page.evaluate(() => clearInterval(window.__t));
await wait(3500);
await page.screenshot({ path: `${out}/b-4.png` });
await browser.close();
console.log(errors.join(" ") || "no errors");
