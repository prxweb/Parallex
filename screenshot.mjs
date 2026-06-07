// Full-page screenshot helper driven by Playwright + the system Chrome.
// Usage: node screenshot.mjs <url> [label]
// Saves to ./temporary screenshots/screenshot-N.png (auto-incremented, never overwritten).
import { createRequire } from 'module';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

// Playwright is bundled inside the globally installed @playwright/mcp package.
const require = createRequire('C:/Users/User/AppData/Roaming/npm/node_modules/@playwright/mcp/package.json');
const { chromium } = require('playwright');

const url = process.argv[2] || 'http://localhost:3000';
const label = (process.argv[3] || '').replace(/[^a-z0-9_-]/gi, '');

const outDir = join(process.cwd(), 'temporary screenshots');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

let max = 0;
for (const f of readdirSync(outDir)) {
  const m = f.match(/^screenshot-(\d+)/);
  if (m) max = Math.max(max, Number(m[1]));
}
const n = max + 1;
const name = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
const outPath = join(outDir, name);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
});
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});

// Force every scroll-reveal element into its final visible state so the
// full-page capture is deterministic (real visitors still get the animation).
await page.evaluate(() => {
  window.scrollTo(0, document.body.scrollHeight);
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
});
await page.waitForTimeout(300);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1000); // let fonts / entrance animations settle
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log('Saved', outPath);
