// The Vigil's spread: plays N days with the decent bot (1.2 s between taps, aim 1) and the
// ideal bot (0.9 s, aim 1), a few browsers at a time, and prints where each run ended.
// Usage: node tools/bots/vigil.mjs [days=10] [from=2026-10-13] [parallel=4] [max seconds=320]
import puppeteer from "puppeteer-core";
const [days = "10", from = "2026-10-13", parallel = "4", max = "320"] = process.argv.slice(2);
const start = new Date(`${from}T00:00:00Z`);
const list = [];
for (let i = 0; i < Number(days); i++) {
  const d = new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10);
  list.push({ day: d, every: 1.2, aim: 1, who: "decent" });
  list.push({ day: d, every: 0.9, aim: 1, who: "ideal" });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function run({ day, every, aim, who }) {
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: "new",
    args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 120)));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
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
        tips: { dark: 9, loose: 9 },
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
  await page.evaluate(
    (day, every, aim) => {
      const e = window.__spire;
      e.wake();
      e.startVigil(day);
      let last = 0;
      const loop = () => {
        const p = e.probe();
        const now = performance.now();
        if (p.phase === "pick") e.choose(0);
        else if (
          (p.phase === "ready" || p.phase === "play") &&
          !p.blocked &&
          now - last > every * 1000 &&
          Math.abs(p.offset) < p.tol * aim
        ) {
          e.tap();
          last = now;
        }
        requestAnimationFrame(loop);
      };
      loop();
    },
    day,
    every,
    aim,
  );
  let s = null;
  for (let t = 0; t < Number(max); t += 5) {
    await wait(5000);
    s = await page.evaluate(() => {
      const e = window.__spire;
      const p = e.probe();
      return {
        phase: p.phase,
        floors: p.floors,
        t: Number(p.time.toFixed(1)),
        gap: Number(e.darkGap().toFixed(1)),
      };
    });
    if (["won", "over", "menu"].includes(s.phase)) break;
  }
  const level = await page.evaluate((day) => {
    const e = window.__spire;
    const l = e.vigil?.level;
    return l ? `${l.theme} [${l.courses.join(",")}]` : day;
  }, day);
  await browser.close();
  return { day, who, level, ...s, errors };
}

const out = [];
let next = 0;
async function worker() {
  while (next < list.length) {
    const job = list[next++];
    const r = await run(job);
    out.push(r);
    console.log(
      `${r.day} ${r.who.padEnd(6)} ${r.phase.padEnd(4)} floors ${String(r.floors).padStart(3)} t ${String(r.t).padStart(6)} gap ${r.gap}  ${r.level}${r.errors.length ? "  ERR " + r.errors[0] : ""}`,
    );
  }
}
await Promise.all(Array.from({ length: Number(parallel) }, worker));
const by = (who) => out.filter((r) => r.who === who);
const summit = (rs) => rs.filter((r) => r.phase === "won").length;
const floors = (rs) => rs.map((r) => r.floors).sort((a, b) => a - b);
console.log(
  `decent: ${summit(by("decent"))}/${by("decent").length} summits, floors ${floors(by("decent")).join(" ")}`,
);
console.log(
  `ideal:  ${summit(by("ideal"))}/${by("ideal").length} summits, floors ${floors(by("ideal")).join(" ")}`,
);
