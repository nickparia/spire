// A touch on a button whose click never comes: the watchdog must press it. And a real click must not press twice.
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 300)));
await page.setViewport({ width: 390, height: 844 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
const ids = ["foundry", "tide", "city", "canyon", "ridge", "glacier", "eclipse", "apex"];
const levels = Object.fromEntries(
  ids.map((id) => [
    id,
    { clear: true, precise: true, swift: true, bestTime: 30, bestAccuracy: 0.9, runs: 1 },
  ]),
);
await page.evaluate(
  (levels) =>
    localStorage.setItem(
      "spire-v2",
      JSON.stringify({
        v: 2,
        music: true,
        sfx: true,
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
        whatsNewSeen: 1,
        storySeen: true,
        savedAt: 5,
        tester: true,
        progress: { hearth: 8 },
      }),
    ),
  levels,
);
await page.reload({ waitUntil: "networkidle0" });
await wait(800);
// 1. The title: pointerdown only (no click) on its button.
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((b) => /begin/i.test(b.textContent));
  b.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
});
await wait(2600);
let s = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 60));
console.log("after title pointerdown only:", s);
// 2. The What's-new card: pointerdown only on Nice.
await wait(500);
const nice = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((b) =>
    /^nice$/i.test(b.textContent.trim()),
  );
  if (!b) return "no card";
  b.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
  return "pressed";
});
await wait(700);
s = await page.evaluate(
  () =>
    !![...document.querySelectorAll("button")].find((b) => /^nice$/i.test(b.textContent.trim())),
);
console.log("nice:", nice, "card still up:", s);
// 3. A real click must press once: click Options and count sheets.
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((b) => /options/i.test(b.textContent));
  b.click();
});
await wait(600);
const sheets = await page.evaluate(() => document.querySelectorAll(".sheet-wrap").length);
console.log("options sheets after one real click:", sheets);
console.log((await page.evaluate(() => window.__spireTrace())).slice(-10).join("\n"));
await browser.close();
