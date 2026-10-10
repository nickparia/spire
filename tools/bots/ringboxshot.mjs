import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 300)));
await page.setViewport({ width: 440, height: 956, deviceScaleFactor: 1 });
await page.goto("http://localhost:8080/proto/ringbox.html", { waitUntil: "networkidle0" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.evaluate(() => {
  setInterval(() => {
    if (over || !mover) return;
    const t = towerTop();
    const x = mover.center + mover.u * mover.half;
    if (Math.abs(x - t.x) < 10) tap();
  }, 16);
});
await wait(6000);
await page.screenshot({
  path: "/private/tmp/claude-501/-Users-scorchio-Code-Spire/7eb91362-9cd2-4a68-bf4e-064cda9899d6/scratchpad/ringbox-1.png",
});
await wait(14000);
await page.screenshot({
  path: "/private/tmp/claude-501/-Users-scorchio-Code-Spire/7eb91362-9cd2-4a68-bf4e-064cda9899d6/scratchpad/ringbox-2.png",
});
console.log(
  await page.evaluate(() => ({
    floors: slabs.length,
    lost,
    dark: Math.round(dark),
    over,
    t: time.toFixed(1),
  })),
);
await browser.close();
