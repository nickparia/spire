import puppeteer from "puppeteer-core";
const [out, bot = "16", secs = "40"] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--mute-audio"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 300)));
page.on("console", (m) => {
  if (m.type() === "error") console.log("console", m.text().slice(0, 200));
});
await page.setViewport({ width: 440, height: 956, deviceScaleFactor: 1 });
await page.goto(
  `http://localhost:8080/proto/chain.html?bot=${bot}${process.env.CALM ? "&calm=1" : ""}`,
  { waitUntil: "networkidle0" },
);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let t = 0; t < Number(secs); t += 4) {
  await wait(4000);
  const s = await page.evaluate(() => window.__chain.state);
  console.log(JSON.stringify(s));
  if (t === 8 || t === 16) await page.screenshot({ path: `${out}/chain-${t}.png` });
  if (s.over) break;
}
await page.screenshot({ path: `${out}/chain-end.png` });
await browser.close();
