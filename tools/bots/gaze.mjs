// The escape against three players: spam (taps fast regardless), rhythm (on the pulse,
// ignores the eye), smart (on the pulse, still when the eye stirs or watches).
// Usage: node gaze.mjs <spam|rhythm|smart> [charged 0..1] [heavy 0..1]
import puppeteer from "puppeteer-core";
const mode = process.argv[2] || "smart";
const charged = Number(process.argv[3] ?? 0.4);
const heavy = Number(process.argv[4] ?? 0.4);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });
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
      tips: { escape: 1 },
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
await wait(400);
await page.evaluate(
  ({ charged, heavy }) => {
    const e = window.__spire;
    e.startBoss(7);
    const esc = e.escape;
    esc.charged.clear();
    esc.heavy.clear();
    e.stack.slice(1).forEach((s, i) => {
      const r = (i * 0.618) % 1;
      if (r < charged) esc.charged.add(s);
      else if (r < charged + heavy) esc.heavy.add(s);
    });
    esc.hits = esc.heavy.has(e.stack[e.stack.length - 1]) ? 2 : 1;
  },
  { charged, heavy },
);
await page.evaluate((mode) => {
  const e = window.__spire;
  window.__seen = 0;
  let last = 0;
  const loop = () => {
    const esc = e.escape;
    const now = performance.now();
    if (esc && esc.hold <= 0 && e.phase === "play") {
      if (mode === "spam") {
        if (now - last > 140) {
          if (esc.gaze === "watch") window.__seen++;
          e.tap();
          last = now;
        }
      } else {
        const B = 0.42;
        const ph = esc.beatT / B;
        const near = Math.min(ph, 1 - ph) * B < 0.05;
        const still =
          mode === "smart" && (esc.gaze === "watch" || (esc.gaze === "stir" && esc.gazeT < 0.25));
        if (near && !still && now - last > 250) {
          if (esc.gaze === "watch") window.__seen++;
          e.tap();
          last = now;
        }
      }
    }
    requestAnimationFrame(loop);
  };
  loop();
}, mode);
const t = Date.now();
while (Date.now() - t < 120000) {
  if (await page.evaluate(() => ["won", "fall"].includes(window.__spire.phase))) break;
  await wait(200);
}
console.log(
  mode,
  `charged=${charged} heavy=${heavy}`,
  JSON.stringify(
    await page.evaluate(() => ({
      phase: window.__spire.phase,
      left: window.__spire.stack.length - 1,
      t: window.__spire.runTime.toFixed(1),
      seen: window.__seen,
    })),
  ),
  errors.join(" ") || "ok",
);
await browser.close();
