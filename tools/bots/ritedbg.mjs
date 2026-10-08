import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror:", String(e).slice(0, 300)));
await page.setViewport({ width: 390, height: 844 });
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
      tips: {},
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
await page.evaluate(() => {
  const e = window.__spire;
  e.startLevel(8);
  e.tap();
  window.__log = [];
  const loop = () => {
    const r = e.rite;
    if (r && !r.acting && e.phase === "play") {
      const a = r.aimed();
      if (a && a.target.kind === "seam") e.tap();
    }
    requestAnimationFrame(loop);
  };
  loop();
});
for (let i = 0; i < 14; i++) {
  await new Promise((r) => setTimeout(r, 1500));
  console.log(
    await page.evaluate(() => {
      const e = window.__spire;
      const r = e.rite;
      return JSON.stringify({
        ph: e.phase,
        prog: Math.round(r?.progress ?? -1),
        goal: r?.world.goal,
        head: r?.heading?.toFixed(2),
        acting: !!r?.acting,
        targets: r?.targets.map((t) => `${t.kind}@${Math.round(t.x)},${Math.round(t.y)} hp${t.hp}`),
      });
    }),
  );
}
await browser.close();
