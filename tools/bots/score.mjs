// The recorded score: the menu piece, then a climb piece once a level starts, then the boss piece.
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate(() =>
  localStorage.setItem(
    "spire-v2",
    JSON.stringify({
      v: 2,
      music: true,
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
const state = () =>
  page.evaluate(() => {
    const m = window.__spire.music;
    const r = m.rec;
    return {
      rec: m.recState,
      list: r?.playlist,
      decks: r?.decks.map(
        (d) =>
          `${d.name || "-"}:${d.src ? "on" : "idle"}@${(r.ctx.currentTime - d.startAt).toFixed(1)}/${d.dur.toFixed(0)} g${d.gain.gain.value.toFixed(2)}`,
      ),
      kept: [...m.buffers.keys()].join(","),
      cutoff: Math.round(r?.tone.frequency.value ?? 0),
    };
  });
await page.mouse.click(195, 420);
await page.evaluate(() => window.__spire.wake());
await wait(3000);
console.log("menu  ", JSON.stringify(await state()));
await page.evaluate(() => window.__spire.startLevel(0));
await wait(6000);
console.log("climb ", JSON.stringify(await state()));
await page.evaluate(() => {
  const r = window.__spire.music.rec;
  const d = r.decks[r.active];
  d.startAt = r.ctx.currentTime - (d.dur - 6);
});
await wait(5000);
console.log("next  ", JSON.stringify(await state()));
await page.evaluate(() => window.__spire.startBoss(7));
await wait(3000);
console.log("boss  ", JSON.stringify(await state()));
await browser.close();
