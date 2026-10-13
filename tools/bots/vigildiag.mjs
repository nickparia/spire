// Climbs a Vigil day with a bot of a given pace and prints the engine's state every three
// seconds: where it is, what blocks it, which event is on. For seeing why a run ends.
// Usage: node tools/bots/vigildiag.mjs [seconds between taps=1.2] [day=today] [max seconds=320]
import puppeteer from "puppeteer-core";
const [every = "1.2", day = "", max = "320"] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 200)));
await page.setViewport({ width: 390, height: 844 });
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate(() =>
  localStorage.setItem(
    "spire-v2",
    JSON.stringify({
      v: 2,
      tips: { dark: 9 },
      whatsNewSeen: 999,
      storySeen: true,
      savedAt: 5,
      tester: true,
    }),
  ),
);
await page.reload({ waitUntil: "networkidle0" });
await page.evaluate(
  (every, day) => {
    const e = window.__spire;
    e.wake();
    e.startVigil(day || undefined);
    let last = 0;
    window.__taps = 0;
    const loop = () => {
      const p = e.probe();
      const now = performance.now();
      if (p.phase === "pick") e.choose(0);
      else if (
        (p.phase === "ready" || p.phase === "play") &&
        !p.blocked &&
        now - last > every * 1000 &&
        Math.abs(p.offset) < p.tol
      ) {
        e.tap();
        last = now;
        window.__taps++;
      }
      requestAnimationFrame(loop);
    };
    loop();
  },
  Number(every),
  day,
);
let peak = 0;
for (let t = 0; t < Number(max); t += 3) {
  await new Promise((r) => setTimeout(r, 3000));
  const s = await page.evaluate(() => {
    const e = window.__spire;
    const p = e.probe();
    return {
      line: `${p.phase} f${p.floors} t${p.time.toFixed(1)} gap${e.darkGap().toFixed(1)} taps${window.__taps} blocked=${p.blocked} bomb=${!!e.bomb} demo=${e.demo} ev=${e.event?.def?.id ?? "-"} course=${e.mover?.course} tol=${p.tol.toFixed(0)} w=${e.mover?.w?.toFixed(0)} stack=${e.stack?.length} loose=${e.stack?.filter((s) => s.loose).length}`,
      floors: p.floors,
      phase: p.phase,
    };
  });
  peak = Math.max(peak, s.floors);
  console.log(s.line);
  if (s.phase === "over" || s.phase === "won") break;
}
console.log(`END every ${every}s day ${day || "today"}: peak ${peak}`);
await browser.close();
