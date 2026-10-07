// Title, world select on Hearth and on the Descent, and a new player's first Begin (story, then sky 1).
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
await wait(3200);
await page.screenshot({ path: `${out}/h-1.png` });
await page.mouse.click(195, 400);
await wait(2200);
console.log(
  "story on world select:",
  await page.evaluate(() => !!document.querySelector(".story")),
);
await page.screenshot({ path: `${out}/h-2.png` });
await page.evaluate(() => {
  const r = document.querySelector(".world-row");
  r.scrollLeft = r.children[1].offsetLeft - (r.clientWidth - r.children[1].clientWidth) / 2;
  r.dispatchEvent(new Event("scroll"));
});
await wait(1600);
await page.screenshot({ path: `${out}/h-3.png` });
await page.evaluate(() => {
  const r = document.querySelector(".world-row");
  r.scrollLeft = 0;
  r.dispatchEvent(new Event("scroll"));
});
await wait(1200);
await click("Begin");
await wait(900);
console.log(
  "story after Begin:",
  await page.evaluate(() => !!document.querySelector(".story")),
  "phase",
  await page.evaluate(() => window.__spire.phase),
);
await page.evaluate(() => document.querySelector(".story-cta")?.click());
await wait(1200);
console.log(
  "after story:",
  await page.evaluate(() => `${window.__spire.phase} sky ${window.__spire.levelIndex}`),
  "seen",
  await page.evaluate(() => JSON.parse(localStorage.getItem("spire-v2")).storySeen),
);
await browser.close();
console.log(errors.join(" ") || "no errors");
