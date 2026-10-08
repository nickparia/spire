// The hanging-tower test: a bot that taps when the stone is under the tip (with some error), and shots.
import puppeteer from "puppeteer-core";
const out = process.argv[2] || "/tmp";
const err = Number(process.argv[3] || 6);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e)));
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:8080/proto/hanging.html", { waitUntil: "networkidle0" });
await page.mouse.click(195, 400);
await page.evaluate((err) => {
  let last = 0;
  const loop = () => {
    if (state === "play" && performance.now() - last > 500) {
      const tp = tip();
      const sx = stone.x * (SHAFT() - SLAB_W / 2);
      if (Math.abs(sx - tp.x) < err) {
        tap();
        last = performance.now();
      }
    }
    requestAnimationFrame(loop);
  };
  loop();
}, err);
for (let i = 0; i < 7; i++) {
  await wait(4000);
  await page.screenshot({ path: `${out}/hg-${i}.png` });
  console.log(
    await page.evaluate(() =>
      JSON.stringify({
        state,
        stones: stones.length - 1,
        theta: theta.toFixed(2),
        wire: Math.round((drag / SNAP) * 100) + "%",
        held: Math.round(coat() / SLAB_H),
      }),
    ),
  );
  if (await page.evaluate(() => state === "over")) break;
}
await browser.close();
