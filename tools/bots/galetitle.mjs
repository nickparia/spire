// With Hearth cleared (the Gale next): can a real click get through the title? What's under the tap?
import puppeteer from "puppeteer-core";
const out = process.argv[2] ?? "/tmp";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 300)));
page.on("console", (m) => {
  if (m.type() === "error") console.log("console.error", m.text().slice(0, 200));
});
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:8080/", { waitUntil: "networkidle0" });
await page.evaluate(() => {
  const ids = ["foundry", "tide", "city", "canyon", "ridge", "glacier", "eclipse", "apex"];
  const levels = Object.fromEntries(
    ids.map((id) => [
      id,
      { clear: true, precise: true, swift: true, bestTime: 30, bestAccuracy: 0.9, runs: 1 },
    ]),
  );
  localStorage.setItem(
    "spire-v2",
    JSON.stringify({
      v: 2,
      music: false,
      sfx: false,
      levels,
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
      tester: false,
      progress: { hearth: 8 },
    }),
  );
});
await page.reload({ waitUntil: "domcontentloaded" });
const snap = (label) =>
  page.evaluate((label) => {
    const e = window.__spire;
    const el = document.elementFromPoint(195, 760);
    const btn = [...document.querySelectorAll("button")].find((b) =>
      /begin/i.test(b.textContent ?? ""),
    );
    const r = btn?.getBoundingClientRect();
    return {
      label,
      phase: e?.phase,
      leaving: !!document.querySelector(".splash-leaving"),
      music: e?.music?.status?.(),
      level: e?.levelIndex,
      levelId: e?.plan?.id,
      videos: [...document.querySelectorAll("video")].map((v) => ({
        src: v.getAttribute("src")?.split("/").pop(),
        playing: !v.paused,
        splash: !!v.closest(".splash"),
      })),
      under: el ? `${el.tagName}.${el.className}`.slice(0, 60) : null,
      button: btn
        ? {
            text: btn.textContent?.trim(),
            x: Math.round(r.x + r.width / 2),
            y: Math.round(r.y + r.height / 2),
            disabled: btn.disabled,
          }
        : null,
      body: document.body.innerText.replace(/\s+/g, " ").slice(0, 120),
    };
  }, label);
for (const t of [600, 1000, 2000]) {
  await wait(t === 600 ? 600 : 400 + (t - 1000 > 0 ? 1000 : 0));
  console.log(JSON.stringify(await snap(`t${t}`)));
}
await page.screenshot({ path: `${out}/gt-title.png` });
let s = await snap("pre");
if (s.button) {
  await page.mouse.click(s.button.x, s.button.y);
} else {
  await page.mouse.click(195, 500);
}
await wait(2400);
s = await snap("after-click");
console.log(JSON.stringify(s));
await page.screenshot({ path: `${out}/gt-after.png` });
if (s.button && /begin/i.test(s.button.text)) {
  await page.mouse.click(s.button.x, s.button.y);
  await wait(2500);
  console.log(JSON.stringify(await snap("after-begin")));
  await page.screenshot({ path: `${out}/gt-begin.png` });
}
await browser.close();
