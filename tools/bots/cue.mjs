// The three cue states in the escape, and the end-scene tap reaching Chapter I.
import puppeteer from "puppeteer-core";
const out = process.argv[2] || "/tmp";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (text) =>
  page.evaluate((text) => {
    for (const b of document.querySelectorAll("button"))
      if (b.textContent?.trim().startsWith(text)) {
        b.click();
        return true;
      }
    return false;
  }, text);
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
await wait(800);
await page.evaluate(() => window.__spire.startBoss(7));
for (const [state, name] of [
  ["shut", "q-1"],
  ["stir", "q-2"],
  ["watch", "q-3"],
]) {
  const t = Date.now();
  while (Date.now() - t < 30000) {
    if (
      await page.evaluate(
        (s) => window.__spire.escape?.hold <= 0 && window.__spire.escape?.gaze === s,
        state,
      )
    )
      break;
    await wait(40);
  }
  await wait(350);
  await page.screenshot({ path: `${out}/${name}.png` });
}
await page.evaluate(() => {
  const e = window.__spire;
  const esc = e.escape;
  for (const s of e.stack.slice(1)) esc.charged.add(s);
  esc.bound.clear();
  esc.gaze = "shut";
  esc.gazeT = 99;
  e.tap();
});
const t1 = Date.now();
while (Date.now() - t1 < 30000) {
  if (await page.evaluate(() => window.__spire.phase === "won")) break;
  await wait(200);
}
await wait(3500);
await click("The sky");
await wait(15000);
await page.mouse.click(195, 400);
await wait(2600);
const top = await page.evaluate(() => {
  const el = document.elementFromPoint(195, 400);
  return el?.closest(".chapter") ? "chapter on top" : el?.className;
});
console.log("after end tap:", top);
await page.screenshot({ path: `${out}/q-4.png` });
await browser.close();
