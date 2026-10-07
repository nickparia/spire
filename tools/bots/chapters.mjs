// A fresh player's prologue; the boss mid-stare; Chapter I after the boss and the world-end film.
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
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle0" });
await wait(1200);
await page.mouse.click(195, 400);
await wait(1000);
await click("Begin");
await wait(2600);
await page.screenshot({ path: `${out}/ch-1.png` });
for (let i = 0; i < 3; i++) {
  await page.mouse.click(195, 300);
  await wait(600);
}
await wait(2200);
await page.screenshot({ path: `${out}/ch-2.png` });
await page.evaluate(() => document.querySelector(".chapter-cta")?.click());
await wait(800);
console.log(
  "after prologue:",
  await page.evaluate(() => `${window.__spire.phase} sky ${window.__spire.levelIndex}`),
);
// The boss, tester tools on, and catch it staring.
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("spire-v2"));
  s.tester = true;
  s.tips = { escape: 1 };
  localStorage.setItem("spire-v2", JSON.stringify(s));
});
await page.reload({ waitUntil: "networkidle0" });
await wait(800);
await page.evaluate(() => window.__spire.startBoss(7));
await wait(9500);
const t0 = Date.now();
while (Date.now() - t0 < 20000) {
  if (await page.evaluate(() => window.__spire.escape?.gaze === "watch")) break;
  await wait(50);
}
await wait(500);
await page.screenshot({ path: `${out}/ch-3.png` });
// Win quickly, then the film, then the chapter.
await page.evaluate(() => {
  const e = window.__spire;
  const esc = e.escape;
  for (const s of e.stack.slice(1)) esc.charged.add(s);
  esc.bound.clear();
  esc.gaze = "shut";
  esc.gazeT = 99;
  e.tap();
});
const t1 = Date.now();
while (Date.now() - t1 < 30000) {
  if (await page.evaluate(() => window.__spire.phase === "won")) break;
  await wait(200);
}
await wait(3500);
await click("The sky");
await wait(15000);
await page.mouse.click(195, 400);
await wait(2600);
await page.screenshot({ path: `${out}/ch-4.png` });
console.log(
  "chapter shown:",
  await page.evaluate(() => document.querySelector(".chapter-title")?.textContent),
);
await browser.close();
console.log(errors.join(" ") || "no errors");
