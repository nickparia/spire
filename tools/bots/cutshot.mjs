// Plays the cutting wheel page: alternates edge drops (left, right) with a centred drop every third.
import puppeteer from "puppeteer-core";
const [aimArg = "60"] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 300)));
await page.setViewport({ width: 440, height: 956, deviceScaleFactor: 1 });
await page.goto("http://localhost:8080/proto/cutwheel.html", { waitUntil: "networkidle0" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.evaluate((aim) => {
  window.__k = 0;
  window.__counts = {};
  setInterval(() => {
    for (const f of floats)
      if (!f.seen) {
        f.seen = true;
        const key = f.t.split(" ")[0];
        window.__counts[key] = (window.__counts[key] || 0) + 1;
      }
  }, 30);
  setInterval(() => {
    if (over || !mover) return;
    const t = towerTop();
    const x = mover.center + mover.u * mover.half;
    // Kick on alternating pads; steady at the centre when the cradle leans or the arm blocks the side.
    const side = window.__k % 2 ? -1 : 1;
    const lean = cradle.getAngle();
    let want = 0;
    if (Math.abs(lean) < 0.12 && !(arm && arm.side === side)) {
      const px0 = padX(pads.find((q) => q.side === side));
      want = Math.abs(px0) <= aim ? px0 : 0;
    }
    if (Math.abs(x - want) < 8) {
      tap();
      window.__k++;
    }
  }, 16);
}, Number(aimArg));
for (let i = 0; i < 6; i++) {
  await wait(5000);
  const s = await page.evaluate(() => ({
    t: time.toFixed(1),
    slabs: slabs.length,
    lost,
    spin: spin.toFixed(2),
    depth: depth.toFixed(1),
    gap: darkGap.toFixed(1),
    over,
    lean: cradle.getAngle().toFixed(2),
    counts: window.__counts,
  }));
  console.log(JSON.stringify(s));
  if (i === 1)
    await page.screenshot({
      path: "/private/tmp/claude-501/-Users-scorchio-Code-Spire/7eb91362-9cd2-4a68-bf4e-064cda9899d6/scratchpad/cut-1.png",
    });
  if (s.over) break;
}
await page.screenshot({
  path: "/private/tmp/claude-501/-Users-scorchio-Code-Spire/7eb91362-9cd2-4a68-bf4e-064cda9899d6/scratchpad/cut-2.png",
});
await browser.close();
