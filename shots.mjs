import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';

const OUT = process.argv[2];
rmSync('data', { recursive: true, force: true });
const server = spawn('node', ['./dist/server/entry.mjs'], { env: { ...process.env, PORT: '4630' }, stdio: 'ignore' });
await new Promise((resolve, reject) => {
  const t0 = Date.now();
  (function poll() {
    fetch('http://localhost:4630/').then(resolve).catch(() => (Date.now() - t0 > 20000 ? reject(new Error('no server')) : setTimeout(poll, 300)));
  })();
});
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

async function fullshot(path, out, wait = 1500) {
  await page.goto('http://localhost:4630' + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(wait);
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.7;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${out}`, fullPage: true });
  console.log(out);
}

await fullshot('/', 'final-home-1440.png', 2600);

// Studio: create the demo owner, walk the screens
await page.goto('http://localhost:4630/studio/setup');
await page.fill('#su-name', 'Jolene');
await page.fill('#su-email', 'owner@example.com');
await page.fill('#su-pass', 'demo-password-only');
await page.fill('#su-confirm', 'demo-password-only');
await page.click('button[type="submit"]');
await page.waitForURL('**/studio');
await page.screenshot({ path: `${OUT}/studio-overview.png`, fullPage: true });
await page.goto('http://localhost:4630/studio/edit/page:home');
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/studio-home-editor.png`, fullPage: false });
await page.goto('http://localhost:4630/studio/edit/service-group:haircuts');
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/studio-prices.png`, fullPage: false });
await page.goto('http://localhost:4630/studio/media');
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/studio-media.png`, fullPage: false });
await page.goto('http://localhost:4630/studio/assistant');
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/studio-assistant.png`, fullPage: false });
console.log('studio shots done');

await browser.close();
server.kill();
rmSync('data', { recursive: true, force: true }); // ship a clean first-run state
