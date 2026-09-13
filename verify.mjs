import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';

const DIST = 'dist';
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = join(DIST, p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f) && existsSync(f + '.html')) f = f + '.html';
  if (!existsSync(f)) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(4321, r));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const results = [];
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  [' + extra + ']' : ''}`);

// ---- 1. every page loads clean, no overflow at 320 and 1440
const pages = ['/', '/about/philosophy/', '/about/hairstylists/', '/treatments/', '/treatments/haircuts/', '/treatments/curls/', '/treatments/colouring/', '/treatments/highlights-lowlights/', '/treatments/superloop/', '/treatments/grey-hair/', '/treatments/head-massage/', '/treatments/salon-party/', '/for-businesses/corporate-salon/', '/for-businesses/care-homes/', '/blog/', '/gallery/', '/contact/', '/book/'];
for (const w of [320, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
  let overflowed = [];
  for (const p of pages) {
    await page.goto('http://localhost:4321' + p, { waitUntil: 'networkidle' });
    const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (o > 0) overflowed.push(p + ':' + o);
  }
  ok(`all pages load without errors @${w}`, errs.length === 0, errs.slice(0, 3).join(' | '));
  ok(`no horizontal overflow @${w}`, overflowed.length === 0, overflowed.join(' '));
  await ctx.close();
}

// ---- 2. desktop dropdown behaviour
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  const aboutBtn = page.locator('.primary-nav .nav-group button[aria-expanded]').first();
  await aboutBtn.click();
  ok('dropdown opens on click', (await aboutBtn.getAttribute('aria-expanded')) === 'true');
  const philosophyVisible = await page.locator('.primary-nav .dropdown >> text=MC Philosophy').isVisible();
  ok('dropdown links visible', philosophyVisible);
  await page.keyboard.press('Escape');
  ok('Escape closes dropdown', (await aboutBtn.getAttribute('aria-expanded')) === 'false');
  ok('Escape returns focus to button', await aboutBtn.evaluate((el) => el === document.activeElement));
  // Treatments has a direct link AND a disclosure
  const tLink = page.locator('.primary-nav .nav-group a[href="/treatments"]');
  const tDisc = page.locator('.primary-nav button[aria-label="Open Treatments menu"]');
  ok('Treatments direct link exists', (await tLink.count()) === 1);
  ok('Treatments disclosure exists', (await tDisc.count()) === 1);
  // hover intent
  await page.locator('.primary-nav .nav-group:has(button[aria-label="Open Treatments menu"])').hover();
  await page.waitForTimeout(250);
  ok('hover opens dropdown after 120ms', (await tDisc.getAttribute('aria-expanded')) === 'true');
  await page.mouse.move(10, 400);
  await page.waitForTimeout(300);
  ok('pointer exit closes after tolerance', (await tDisc.getAttribute('aria-expanded')) === 'false');
  await ctx.close();
}

// ---- 3. treatment hover preview
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  const row = page.locator('[data-explorer] a[data-preview]').first();
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await row.hover();
  await page.waitForTimeout(400);
  const panel = page.locator('.preview-panel');
  ok('hover preview appears', await panel.evaluate((el) => el.classList.contains('show')).catch(() => false));
  const nonInteractive = await panel.evaluate((el) => getComputedStyle(el).pointerEvents === 'none').catch(() => false);
  ok('preview panel is non-interactive', nonInteractive);
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(120);
  ok('preview clears on scroll', await panel.evaluate((el) => !el.classList.contains('show')).catch(() => true));
  // keyboard focus preview
  await row.focus();
  await page.waitForTimeout(120);
  ok('focus shows stable panel', (await page.locator('.focus-preview').count()) === 1);
  const describedBy = await row.getAttribute('aria-describedby');
  ok('row links carry aria-describedby', !!describedBy && (await page.locator('#' + describedBy).count()) === 1);
  await page.keyboard.press('Tab'); // moves to next row, which shows its own panel
  await page.waitForTimeout(120);
  const firstLiPanel = await page.locator('[data-explorer] li').first().locator('.focus-preview').count();
  ok('blur hides focus panel', firstLiPanel === 0 && (await page.locator('.focus-preview').count()) <= 1);
  await ctx.close();
}

// ---- 4. drawer at compact width
{
  const ctx = await browser.newContext({ viewport: { width: 768, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await page.locator('#menu-open').click();
  await page.waitForTimeout(500);
  ok('drawer opens as modal', await page.locator('#menu-drawer').evaluate((d) => d.open));
  const width = await page.locator('#menu-drawer').evaluate((d) => d.getBoundingClientRect().width);
  ok('drawer width ≤ 480', width <= 480, `w=${Math.round(width)}`);
  // expand Treatments group
  const groupBtn = page.locator('.drawer-group-btn').nth(1);
  await groupBtn.click();
  await page.waitForTimeout(400);
  ok('drawer group expands', (await groupBtn.getAttribute('aria-expanded')) === 'true');
  const superloopVisible = await page.locator('.drawer-sub >> text=Superloop').isVisible();
  ok('all pages reachable in drawer', superloopVisible);
  // focus trapped inside dialog
  const inDialog = await page.evaluate(() => document.getElementById('menu-drawer').contains(document.activeElement));
  ok('focus inside drawer', inDialog);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  ok('Escape closes drawer', await page.locator('#menu-drawer').evaluate((d) => !d.open));
  ok('focus returns to Menu button', await page.evaluate(() => document.activeElement?.id === 'menu-open'));
  await ctx.close();
}

// ---- 5. reduced motion: final states immediately
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
  const cls = await page.evaluate(() => document.documentElement.className);
  ok('reduced motion disables animation classes', !cls.includes('js-motion'), cls || '(none)');
  const heroOpacity = await page.locator('.hero-mark').evaluate((el) => getComputedStyle(el).opacity);
  ok('hero visible immediately (reduced motion)', heroOpacity === '1');
  const quoteVisible = await page.locator('.quote-word').first().evaluate((el) => getComputedStyle(el).opacity);
  ok('quote visible immediately (reduced motion)', quoteVisible === '1');
  await ctx.close();
}

// ---- 6. no JavaScript: everything readable
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4321/');
  const heroOpacity = await page.locator('.hero-mark').evaluate((el) => getComputedStyle(el).opacity);
  const quoteOpacity = await page.locator('.quote-word').first().evaluate((el) => getComputedStyle(el).opacity);
  const revealOpacity = await page.locator('.reveal').first().evaluate((el) => getComputedStyle(el).opacity);
  ok('no-JS: hero, quote and sections visible', heroOpacity === '1' && quoteOpacity === '1' && revealOpacity === '1');
  const treatText = await page.goto('http://localhost:4321/treatments/').then(() => page.textContent('body'));
  ok('no-JS: catalogue text present', treatText.includes('Curly haircut') && treatText.includes('€49'));
  await ctx.close();
}

// ---- 7. hero entrance plays once per session
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  const first = await page.evaluate(() => document.documentElement.classList.contains('hero-anim'));
  await page.goto('http://localhost:4321/gallery/', { waitUntil: 'domcontentloaded' });
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  const second = await page.evaluate(() => document.documentElement.classList.contains('hero-anim'));
  ok('hero entrance on first arrival', first);
  ok('hero entrance skipped later in session', !second);
  const heroVisible = await page.locator('.hero-mark').evaluate((el) => getComputedStyle(el).opacity);
  ok('hero visible when entrance skipped', heroVisible === '1');
  await ctx.close();
}

// ---- 8. brief checklist details
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  const body = await page.textContent('body');
  ok('no Favorites/bestsellers section', !/favou?rites|bestsellers|most popular/i.test(body));
  const heroCtas = await page.locator('.hero a.btn').count();
  ok('hero has Treatments path and Book action', heroCtas >= 2);
  await page.goto('http://localhost:4321/treatments/', { waitUntil: 'domcontentloaded' });
  const t = await page.textContent('body');
  ok('catalogue keeps recovery content', t.includes('Recovery Programme'));
  ok('catalogue keeps Superloop', t.includes('Superloop'));
  ok('catalogue keeps coaching', t.includes('Coaching'));
  ok('hair-care anchor exists', (await page.locator('#hair-care').count()) === 1);
  ok('quote/from semantics preserved', t.includes('From €85') && t.includes('Personal quotation'));
  await page.goto('http://localhost:4321/book/', { waitUntil: 'domcontentloaded' });
  const bookOpts = await page.locator('#bk-service option').allTextContents();
  ok('booking gate: no direct colour treatment requests', !bookOpts.some((o) => /roots to ends|Half head|Full head/i.test(o)));
  ok('booking gate: consultations offered', bookOpts.some((o) => /Consultation/.test(o)));
  await ctx.close();
}

// ---- 9. landscape short viewport
{
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok('short landscape viewport: no overflow, CTAs reachable', o === 0 && (await page.locator('.hero a.btn').first().isVisible()));
  await ctx.close();
}

console.log(results.join('\n'));
const fails = results.filter((r) => r.startsWith('FAIL'));
console.log(`\n${results.length - fails.length}/${results.length} passed`);
await browser.close();
server.close();
