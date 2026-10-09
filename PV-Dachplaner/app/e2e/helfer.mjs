import { chromium } from "playwright";

export const base = process.env.BASE ?? "http://127.0.0.1:4173";

export async function starten(viewport = { width: 390, height: 844 }) {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium",
    args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
      ...(process.env.HTTPS_PROXY ? [`--proxy-server=${process.env.HTTPS_PROXY}`, "--proxy-bypass-list=127.0.0.1;localhost"] : [])],
  });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport, acceptDownloads: true });
  const page = await ctx.newPage();
  const fehler = [];
  page.on("pageerror", (e) => fehler.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") fehler.push(m.text().slice(0, 200)); });
  return { browser, ctx, page, fehler };
}

export async function karteBereit(page) {
  await page.getByTestId("karte").waitFor();
  await page.waitForFunction(() => window.__karte && window.__karte.loaded(), null, { timeout: 60000 });
}

export function pruefen(name, bedingung, details = "") {
  console.log(`${bedingung ? "OK  " : "FAIL"} ${name}${details ? " – " + details : ""}`);
  if (!bedingung) process.exitCode = 1;
}
