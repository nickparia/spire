// A non-tester with Hearth half done presses Begin on the Ring card: the run must start.
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 200)));
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate(() => {
  const done = {
    clear: true,
    precise: true,
    swift: false,
    bestTime: 30,
    bestAccuracy: 0.9,
    runs: 1,
  };
  localStorage.setItem(
    "spire-v2",
    JSON.stringify({
      v: 2,
      music: false,
      sfx: false,
      levels: { foundry: done, tide: done },
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
      tester: false,
      progress: { hearth: 2 },
    }),
  );
});
await page.reload({ waitUntil: "networkidle0" });
await wait(1200);
await page.mouse.click(195, 500);
await wait(2000);
const pressed = await page.evaluate(() => {
  const card = [...document.querySelectorAll("[class*=wpanel]")].find((c) =>
    /The Ring/.test(c.textContent || ""),
  );
  const btn =
    card && [...card.querySelectorAll("button")].find((b) => /Begin/.test(b.textContent || ""));
  if (!btn) return "no Begin on the Ring card";
  btn.click();
  return "pressed Begin";
});
await wait(1500);
const s = await page.evaluate(() => ({
  phase: window.__spire.phase,
  level: window.__spire.levelIndex,
}));
console.log(pressed, JSON.stringify(s));
await browser.close();
