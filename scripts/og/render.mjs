// Renders the share previews and the Apple touch icon with headless Chrome.
// Usage: node --experimental-websocket scripts/og/render.mjs   (Node 21; Node 22+ needs no flag)
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const root = resolve(import.meta.dirname, "../..");
// Fill the template with the site's own mountains, city lights and logo.
const source = (file) => readFileSync(join(root, file), "utf8");
const hajar = source("src/lib/hajar.ts");
const logo = source("src/lib/logo.ts");
const viewBox = hajar.match(/HAJAR_VIEWBOX = "([^"]+)"/)[1];
const ridge = (name) => hajar.match(new RegExp(`${name}: \\{\\s*crest: "([^"]+)",\\s*fill: "([^"]+)"`)).slice(1);
const city = [...hajar.matchAll(/\[(\d+), ([\d.]+), ([\d.]+), \d\]/g)].map(([, x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("");
const [letter, sun] = [...logo.matchAll(/(letter|sun): "([^"]+)"/g)].map((m) => m[2]);
const [[farC, farF], [midC, midF], [nearC, nearF]] = ["far", "mid", "near"].map(ridge);
const ridges =
  `<path class="far" d="${farF}"/><path class="line" d="${farC}"/>` +
  `<path class="mid" d="${midF}"/><path class="line" d="${midC}"/><g class="city">${city}</g>` +
  `<path class="near" d="${nearF}"/><path class="line near-line" d="${nearC}"/>`;
const mark = `<svg viewBox="0 0 100 100"><rect class="tile" width="100" height="100" rx="28"/><path class="letter" d="${letter}"/><path class="sunpath" d="${sun}"/></svg>`;
const filled = join(mkdtempSync(join(tmpdir(), "og-tpl-")), "template.html");
writeFileSync(
  filled,
  source("scripts/og/template.html").replaceAll("{{VIEWBOX}}", viewBox).replaceAll("{{RIDGES}}", ridges).replaceAll("{{LOGO}}", mark),
);
const template = pathToFileURL(filled).href;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=9335", `--user-data-dir=${mkdtempSync(join(tmpdir(), "og-"))}`, "about:blank"], { stdio: "ignore" });
let targets;
for (let i = 0; i < 50 && !targets; i++) {
  try {
    targets = await (await fetch("http://127.0.0.1:9335/json")).json();
  } catch {
    await sleep(200);
  }
}
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  pending.get(m.id)?.(m);
};
const send = (method, params = {}) =>
  new Promise((r) => {
    pending.set(++id, r);
    ws.send(JSON.stringify({ id, method, params }));
  });

async function capture(url, width, height, out) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url });
  await sleep(2500);
  await send("Runtime.evaluate", { expression: "document.fonts.ready", awaitPromise: true });
  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(root, out), Buffer.from(shot.result.data, "base64"));
  console.log("wrote", out);
}

await send("Page.enable");
for (const lang of ["en", "ar"]) await capture(`${template}?lang=${lang}`, 1200, 630, `public/og/${lang}.png`);
// iOS rounds the corners itself, so the touch icon is a full square.
await capture(pathToFileURL(join(root, "scripts/og/apple-icon.html")).href, 180, 180, "src/app/apple-icon.png");

ws.close();
chrome.kill();
process.exit(0);
