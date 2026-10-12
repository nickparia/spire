// The start of a sky, under every state a real save can be in: can the first tap drop a slab?
// Usage: node tools/bots/start.mjs <level index>
import puppeteer from "puppeteer-core";
const [level = "19"] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 300)));
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ids = ["foundry", "tide", "city", "canyon", "ridge", "glacier", "eclipse", "apex"];
const levels = Object.fromEntries(
  ids.map((id) => [
    id,
    { clear: true, precise: true, swift: true, bestTime: 30, bestAccuracy: 0.9, runs: 1 },
  ]),
);
const cases = [];
for (const favour of [
  "",
  "fire",
  "frost",
  "storm",
  "stone",
  "shadow",
  "keystone",
  "sight",
  "ember",
  "open",
])
  cases.push({ favour, tips: {}, tester: false });
cases.push({ favour: "", tips: { dark: 9, wind: 9, fall: 9 }, tester: true });
cases.push({ favour: "frost", tips: {}, tester: true, practice: true });
for (const c of cases) {
  await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
  await page.evaluate(
    (c, levels) =>
      localStorage.setItem(
        "spire-v2",
        JSON.stringify({
          v: 2,
          music: true,
          sfx: true,
          levels,
          endless: { best: 0, bestFloors: 0 },
          tips: c.tips,
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
          tester: c.tester,
          practice: !!c.practice,
          favour: c.favour,
          progress: { hearth: 8 },
        }),
      ),
    c,
    levels,
  );
  await page.reload({ waitUntil: "networkidle0" });
  await page.evaluate((level) => {
    const e = window.__spire;
    e.wake();
    e.startLevel(Number(level));
  }, level);
  const taps = [];
  for (let i = 0; i < 12; i++) {
    await wait(600);
    const s = await page.evaluate(() => {
      const e = window.__spire;
      e.tap();
      return `${e.phase}/${e.floors}`;
    });
    taps.push(s);
  }
  const end = await page.evaluate(() => {
    const e = window.__spire;
    return {
      phase: e.phase,
      floors: e.floors,
      demo: e.demo,
      freeze: +e.freeze.toFixed(2),
      paused: e.paused,
      hand: e.hand,
      trace: window.__spireTrace ? window.__spireTrace() : null,
    };
  });
  console.log(
    JSON.stringify(c),
    "→",
    end.phase,
    "floors",
    end.floors,
    end.demo ? "DEMO" : "",
    end.freeze ? `freeze ${end.freeze}` : "",
    end.paused ? "PAUSED" : "",
    "| taps:",
    taps.join(" "),
  );
}
await browser.close();
