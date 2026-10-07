// Taps the title early, before its button has appeared: it should still go in.
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:8080/", { waitUntil: "domcontentloaded" });
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
    }),
  ),
);
await page.reload({ waitUntil: "domcontentloaded" });
for (const at of [400, 1200, 2500]) {
  await page.reload({ waitUntil: "domcontentloaded" });
  await wait(at);
  const hit = await page.evaluate(() => {
    const el = document.elementFromPoint(195, 420);
    return el ? `${el.tagName}.${el.className}` : "none";
  });
  await page.mouse.click(195, 420);
  await wait(2500);
  const where = await page.evaluate(() =>
    document.querySelector(".splash")
      ? "still title"
      : document.querySelector(".worlds, .world-select, [class*=world]")
        ? "worlds"
        : "other",
  );
  console.log(`tap at ${at}ms on ${hit} -> ${where}`);
}
await browser.close();
