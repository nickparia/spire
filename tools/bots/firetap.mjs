// From the world select: Begin on the Descent, then click the screen at intervals; when do taps fire?
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--mute-audio"] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.setItem("spire-v2", JSON.stringify({ v: 2, music: false, sfx: false, levels: {}, endless: { best: 0, bestFloors: 0 }, tips: {}, coins: 0, tracks: {}, levels2: {}, weapon: "buttress", ghosts: {}, name: "", feats: {}, whatsNewSeen: 99, storySeen: true, savedAt: 5, tester: true })));
await page.reload({ waitUntil: "networkidle0" });
await page.touchscreen.tap(195, 420);
await wait(2600);
// Swipe to the Descent panel.
await page.evaluate(() => document.querySelector(".worlds-track, .wpanels, [class*=track]")?.scrollBy?.({ left: 400 }));
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].filter((b) => /begin|continue/i.test(b.textContent || "")); (b[1] || b[0])?.click(); });
const t0 = Date.now();
for (let i = 0; i < 10; i++) {
  await wait(400);
  const before = await page.evaluate(() => window.__spire.drops);
  await page.touchscreen.tap(195, 600);
  await wait(80);
  const s = await page.evaluate(() => { const e = window.__spire; const top = document.elementFromPoint(195, 600); return { phase: e.phase, rite: !!e.rite, drops: e.drops, top: top ? `${top.tagName}.${String(top.className).slice(0, 40)}` : "-" }; });
  console.log(((Date.now() - t0) / 1000).toFixed(1) + "s", JSON.stringify(s), s.drops > before ? "FIRED" : "");
}
await browser.close();
