import puppeteer from "puppeteer-core";
const lvl = Number(process.argv[2] || 4);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate(() =>
  localStorage.setItem(
    "spire-v2",
    JSON.stringify({
      v: 2,
      music: false,
      sfx: false,
      levels: {
        0: { stars: 3 },
        1: { stars: 3 },
        2: { stars: 3 },
        3: { stars: 3 },
        4: { stars: 3 },
        5: { stars: 3 },
        6: { stars: 3 },
      },
      endless: { best: 0, bestFloors: 0 },
      tips: { shrink: 9, dark: 9 },
      coins: 0,
      tracks: {},
      levels2: {},
      weapon: "buttress",
    }),
  ),
);
await page.reload({ waitUntil: "networkidle0" });
await wait(300);
await page.evaluate((lvl) => {
  const e = window.__spire;
  window.__bot = { last: 0, taps: 0 };
  const loop = () => {
    const p = e.probe();
    const b = window.__bot;
    if (p.phase === "pick") e.choose(0);
    if (
      (p.phase === "ready" || p.phase === "play") &&
      !p.blocked &&
      performance.now() - b.last > 900 &&
      Math.abs(p.offset) <= p.tol * 0.4
    ) {
      e.tap();
      b.last = performance.now();
      b.taps++;
    }
    requestAnimationFrame(loop);
  };
  loop();
  e.startLevel(lvl);
}, lvl);
for (let t = 0; t < 40; t += 4) {
  await wait(4000);
  const s = await page.evaluate(() => {
    const e = window.__spire;
    const st = e.stage;
    const rows = e.stack.map((s) => {
      const v = s.body !== null ? st.read(s.body) : null;
      return v
        ? `${s.floor}:y${Math.round(v.cy)} a${(v.angle * 57.3).toFixed(0)} v${v.speed.toFixed(0)}${v.resting ? "R" : ""}`
        : `${s.floor}:nobody`;
    });
    return {
      phase: e.phase,
      floors: e.floors,
      taps: window.__bot.taps,
      seat: Math.round(e.seat.y),
      moverY: Math.round(e.mover.y),
      fallT: e.mover.fallT,
      blocked: e.probe().blocked,
      course: e.mover.course,
      split: e.mover.split,
      dark: Math.round(e.dark),
      rows: rows.slice(-2).join(" | "),
    };
  });
  console.log(t + 4 + "s", JSON.stringify(s));
}
await browser.close();
