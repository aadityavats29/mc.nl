import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/claude/mcnl/dist';
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.webp':'image/webp', '.svg':'image/svg+xml', '.xml':'application/xml', '.txt':'text/plain', '.woff2':'font/woff2' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = join(DIST, p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f) && existsSync(f + '.html')) f = f + '.html';
  if (!existsSync(f)) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise(r => server.listen(4321, r));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const shots = JSON.parse(process.argv[2] || '[]');
for (const s of shots) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, reducedMotion: s.rm ? 'reduce' : 'no-preference', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:4321' + s.path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(s.wait ?? 1600);
  if (s.full) {
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.7;
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise(r => setTimeout(r, 120));
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.waitForTimeout(700);
  }
  if (s.js) await page.evaluate(s.js);
  if (s.wait2) await page.waitForTimeout(s.wait2);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.screenshot({ path: s.out, fullPage: !!s.full });
  console.log(s.out, 'overflow=' + overflow, errors.length ? 'ERRORS: ' + errors.join(' | ') : 'no js errors');
  await ctx.close();
}
await browser.close();
server.close();
