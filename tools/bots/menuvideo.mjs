// With every Hearth sky cleared: the menu must run an offered world's plan, and after a run
// no behind-the-canvas video may stay attached or playing in the menus.
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 200)));
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate(() => {
  const ids = ["foundry", "tide", "city", "canyon", "ridge", "glacier", "eclipse", "apex", "roots"];
  const levels = Object.fromEntries(
    ids.map((id) => [
      id,
      { clear: true, precise: true, swift: true, bestTime: 30, bestAccuracy: 0.9, runs: 1 },
    ]),
  );
  localStorage.setItem(
    "spire-v2",
    JSON.stringify({
      v: 2,
      music: false,
      sfx: false,
      levels,
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
      progress: { hearth: 8, descent: 1 },
    }),
  );
});
await page.reload({ waitUntil: "networkidle0" });
await wait(1000);
const videos = () =>
  page.evaluate(() =>
    [...document.querySelectorAll("video")].map((v) => ({
      src: v.getAttribute("src")?.split("/").pop(),
      playing: !v.paused,
      inSplash: !!v.closest(".splash"),
    })),
  );
const menuPlan = await page.evaluate(() => ({
  descent: window.__spire.plan.descent,
  level: window.__spire.levelIndex,
}));
console.log("menu plan", JSON.stringify(menuPlan), "videos", JSON.stringify(await videos()));
// A run, then back to the menu.
await page.evaluate(() => window.__spire.startLevel(0));
await wait(2500);
console.log("in play", JSON.stringify(await videos()));
await page.evaluate(() => window.__spire.showMenu(0));
await wait(800);
console.log("back in menu", JSON.stringify(await videos()));
await browser.close();
