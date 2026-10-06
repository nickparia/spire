// Simulates iOS leaving the audio context dead after the app is backgrounded,
// then checks the next tap brings sound back (new context, running, music on it).
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
      sfx: true,
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
    }),
  ),
);
await page.reload({ waitUntil: "networkidle0" });
await wait(400);
await page.mouse.click(195, 300);
await wait(400);
const r = await page.evaluate(async () => {
  const e = window.__spire;
  const rig = e.rig;
  const before = { state: rig.ctx?.state };
  const old = rig.ctx;
  // Background: hold. Return: a context that refuses to resume, as iOS does.
  rig.hold();
  await new Promise((r) => setTimeout(r, 200));
  old.resume = () => Promise.resolve();
  rig.release();
  await new Promise((r) => setTimeout(r, 600));
  const stuck = old.state;
  e.wake();
  await new Promise((r) => setTimeout(r, 400));
  return {
    before,
    stuck,
    after: rig.ctx?.state,
    rebuilt: rig.ctx !== old,
    musicOnNew: e.music.graph?.ctx === rig.ctx,
  };
});
console.log(JSON.stringify(r));
await browser.close();
