// Headless-Test: lädt die Seite von einem lokalen Server (Herkunft localhost) und prüft CORS, Ladezeiten und Bildqualität.
import { chromium } from "playwright";

// Statischer Server muss laufen: python3 -m http.server 8765 --bind 127.0.0.1 (im Ordner site)
const port = 8765;
const server = { close() {} };
const proxy = process.env.HTTPS_PROXY;
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", ...(process.env.HTTPS_PROXY ? [`--proxy-server=${process.env.HTTPS_PROXY}`, "--proxy-bypass-list=127.0.0.1;localhost"] : [])],
  
});
const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, ignoreHTTPSErrors: !!proxy });
const results = [];
const variants = process.argv.slice(2).length ? process.argv.slice(2) : ["ts=512&fmt=png", "ts=512&fmt=jpeg", "ts=256&fmt=png"];
for (const v of variants) {
  const page = await ctx.newPage();
  const consoleErrors = [];
  const failed = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("requestfailed", (r) => failed.push(`${r.url().slice(0, 80)} ${r.failure()?.errorText}`));
  await page.goto(`${process.env.BASE ?? "http://127.0.0.1:" + port}/?${v}`);
  await page.waitForFunction(() => window.__s1 && window.__s1.map && window.__s1.map.loaded(), null, { timeout: 60000 });
  for (const [name, z] of [["z17", 17], ["z19", 19]]) {
    await page.evaluate((zz) => window.__s1.map.jumpTo({ center: [8.5560, 52.0230], zoom: zz }), z);
    await page.waitForFunction(() => window.__s1.map.loaded(), null, { timeout: 60000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `shot-${v.replace(/[=&]/g, "_")}-${name}.png` });
  }
  const m = await page.evaluate(() => window.__s1.metrics);
  const ms = m.tiles.map((t) => t.ms).sort((a, b) => a - b);
  const kb = m.tiles.map((t) => t.bytes / 1024).sort((a, b) => a - b);
  const pc = (a, p) => a.length ? a[Math.min(a.length - 1, Math.floor(p * a.length))] : null;
  results.push({ variant: v, tiles: m.tiles.length, ms_median: pc(ms, .5), ms_p90: pc(ms, .9), kb_median: pc(kb, .5)?.toFixed(0), kb_p90: pc(kb, .9)?.toFixed(0), mapErrors: m.errors.length, consoleErrors: consoleErrors.slice(0, 3), failed: failed.slice(0, 3) });
  await page.close();
}
await browser.close();
server.close();
console.log(JSON.stringify(results, null, 2));
