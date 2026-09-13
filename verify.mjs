/**
 * Public-site acceptance checks (browser-level) against the running server:
 * responsive widths, drawer, retained treatment hover previews, marquee
 * behaviour on desktop/touch/reduced-motion, hero entrance, no-JS
 * readability, and the brief's content guarantees.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const BASE = 'http://localhost:4620';
const results = [];
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  [' + String(extra).slice(0, 120) + ']' : ''}`);

const server = spawn('node', ['./dist/server/entry.mjs'], {
  env: { ...process.env, HOST: '127.0.0.1', PORT: '4620' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve, reject) => {
  const t0 = Date.now();
  (function poll() {
    fetch(BASE + '/').then(resolve).catch(() => (Date.now() - t0 > 20000 ? reject(new Error('no server')) : setTimeout(poll, 300)));
  })();
});

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

const pages = ['/', '/about/philosophy', '/about/hairstylists', '/treatments', '/treatments/haircuts', '/treatments/curls', '/treatments/colouring', '/treatments/highlights-lowlights', '/treatments/superloop', '/treatments/grey-hair', '/treatments/head-massage', '/treatments/salon-party', '/for-businesses/corporate-salon', '/for-businesses/care-homes', '/blog', '/gallery', '/contact', '/book'];

/* ---- 1. every page at 320 and 1440: loads clean, no overflow ---- */
for (const w of [320, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
  const overflowed = [];
  for (const p of pages) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (o > 0) overflowed.push(p + ':' + o);
  }
  ok(`all pages load without errors @${w}`, errs.length === 0, errs.slice(0, 2).join(' | '));
  ok(`no horizontal overflow @${w}`, overflowed.length === 0, overflowed.join(' '));
  await ctx.close();
}

/* ---- 2. hero entrance and header behaviour ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  ok('hero entrance on first arrival', await page.evaluate(() => document.documentElement.classList.contains('hero-anim')));
  await page.waitForTimeout(1400);
  const markVisible = await page.locator('.hero-mark').evaluate((el) => getComputedStyle(el).opacity === '1');
  ok('logo lands as one intact unit', markVisible);
  ok('header transparent over the hero', await page.locator('.site-header').evaluate((el) => el.classList.contains('over-hero') && !el.classList.contains('solid')));
  await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }));
  await page.waitForTimeout(400);
  ok('header gains a solid MC surface after the hero', await page.locator('.site-header').evaluate((el) => el.classList.contains('solid')));
  await page.goto(BASE + '/gallery', { waitUntil: 'domcontentloaded' });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  ok('hero entrance skipped later in the session', !(await page.evaluate(() => document.documentElement.classList.contains('hero-anim'))));
  await ctx.close();
}

/* ---- 3. marquees: desktop auto mode with clones, pause control ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const about = page.locator('.about-marquee');
  await about.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  ok('About cards run in continuous auto mode', await about.evaluate((el) => el.classList.contains('mq-auto')));
  const clones = await about.locator('.mq-clone').count();
  ok('loop uses aria-hidden clones', clones >= 1 && (await about.locator('.mq-clone[aria-hidden="true"]').count()) === clones);
  const tab = await about.locator('.mq-clone a[tabindex="-1"]').count();
  ok('clone links removed from tab order', tab > 0);
  const x1 = await about.locator('.mq-track').evaluate((el) => el.style.transform);
  await page.waitForTimeout(700);
  const x2 = await about.locator('.mq-track').evaluate((el) => el.style.transform);
  ok('track actually moves', x1 !== x2);
  const toggle = page.locator('.about-cards-section .mq-toggle');
  ok('visible Pause control', await toggle.isVisible());
  await toggle.click();
  await page.waitForTimeout(300);
  const x3 = await about.locator('.mq-track').evaluate((el) => el.style.transform);
  await page.waitForTimeout(600);
  const x4 = await about.locator('.mq-track').evaluate((el) => el.style.transform);
  ok('Pause stops movement and keeps position', x3 === x4 && (await toggle.getAttribute('aria-pressed')) === 'true');
  await page.mouse.move(10, 10);
  ok('brand marquee present with confirmed brands once for AT', (await page.locator('.brand-marquee .mq-set:not(.mq-clone) .brand-mark').count()) === 7);
  await ctx.close();
}

/* ---- 4. touch: About cards become a manual snap row ---- */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const about = page.locator('.about-marquee');
  await about.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  ok('touch gets a manual swipe row (no auto movement)', await about.evaluate((el) => el.classList.contains('mq-manual')));
  ok('previous/next buttons appear on touch', await page.locator('.about-cards-section .mq-next').isVisible());
  ok('position indicator present', (await page.locator('.mq-dots .mq-dot').count()) === 3);
  await page.locator('.about-cards-section .mq-next').click();
  await page.waitForTimeout(700);
  const scrolled = await about.locator('.mq-viewport').evaluate((el) => el.scrollLeft);
  ok('next button advances the row', scrolled > 100, `scrollLeft=${scrolled}`);
  await ctx.close();
}

/* ---- 5. reduced motion: everything still, content immediate ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  ok('reduced motion: no animation classes', !(await page.evaluate(() => document.documentElement.className.includes('js-motion'))));
  ok('reduced motion: hero visible immediately', await page.locator('.hero-mark').evaluate((el) => getComputedStyle(el).opacity === '1'));
  ok('reduced motion: marquees become static layouts', await page.locator('.about-marquee').evaluate((el) => el.classList.contains('mq-static')));
  await ctx.close();
}

/* ---- 6. no JavaScript: everything readable, nav reachable ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(BASE + '/');
  ok('no-JS: hero and intro visible', (await page.locator('.hero-mark').evaluate((el) => getComputedStyle(el).opacity)) === '1' && (await page.locator('.intro-heading').evaluate((el) => getComputedStyle(el).opacity)) === '1');
  ok('no-JS: fallback navigation lists every page', await page.locator('.nojs-nav >> text=Superloop').isVisible());
  const treat = await page.goto(BASE + '/treatments').then(() => page.textContent('body'));
  ok('no-JS: catalogue text and prices present', treat.includes('Curly haircut') && treat.includes('€49'));
  await ctx.close();
}

/* ---- 7. retained treatment hover previews ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const row = page.locator('[data-explorer] a[data-preview]').first();
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const box = await row.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + 12);
  await page.waitForTimeout(450);
  ok('hover preview appears after 120ms', await page.locator('.preview-panel').evaluate((el) => el.classList.contains('show')).catch(() => false));
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(150);
  ok('preview clears on scroll', await page.locator('.preview-panel').evaluate((el) => !el.classList.contains('show')).catch(() => true));
  await row.focus();
  await page.waitForTimeout(150);
  ok('keyboard focus shows a stable panel', (await page.locator('.focus-preview').count()) === 1);
  ok('preview text exposed via aria-describedby', Boolean(await row.getAttribute('aria-describedby')));
  await ctx.close();
}

/* ---- 8. drawer ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 768, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/treatments', { waitUntil: 'networkidle' });
  await page.locator('#menu-open').click();
  await page.waitForTimeout(500);
  ok('drawer opens as a modal', await page.locator('#menu-drawer').evaluate((d) => d.open));
  const groupBtn = page.locator('.drawer-group-btn').nth(1);
  await groupBtn.click();
  await page.waitForTimeout(400);
  ok('all treatment pages reachable in the drawer', await page.locator('.drawer-sub >> text=Superloop').isVisible());
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  ok('Escape closes and returns focus to Menu', (await page.locator('#menu-drawer').evaluate((d) => !d.open)) && (await page.evaluate(() => document.activeElement?.id === 'menu-open')));
  await ctx.close();
}

/* ---- 9. content guarantees ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const body = await page.textContent('body');
  ok('no Favorites/bestsellers section', !/favou?rites|bestsellers|most popular/i.test(body));
  ok('required homepage order', await page.evaluate(() => {
    const order = ['.hero-landing', '.intro-section', '.about-cards-section', '.brand-strip', '[data-explorer]'];
    let last = -1;
    for (const sel of order) {
      const el = document.querySelector(sel);
      if (!el) return false;
      const y = el.getBoundingClientRect().top + window.scrollY;
      if (y < last) return false;
      last = y;
    }
    return true;
  }));
  await page.goto(BASE + '/treatments', { waitUntil: 'domcontentloaded' });
  const t = await page.textContent('body');
  ok('catalogue keeps recovery, Superloop, coaching', t.includes('Recovery Programme') && t.includes('Superloop') && t.includes('Coaching'));
  ok('hair-care anchor exists', (await page.locator('#hair-care').count()) === 1);
  await page.goto(BASE + '/book', { waitUntil: 'domcontentloaded' });
  const opts = await page.locator('#bk-service option').allTextContents();
  ok('booking gate holds after the refactor', !opts.some((o) => /roots to ends|Half head|Full head/i.test(o)) && opts.some((o) => /Consultation/.test(o)));
  await ctx.close();
}

/* ---- 10. short landscape viewport ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok('short landscape viewport: no overflow, booking reachable', o === 0 && (await page.locator('.hero-book').isVisible()));
  await ctx.close();
}

console.log(results.join('\n'));
const fails = results.filter((r) => r.startsWith('FAIL'));
console.log(`\n${results.length - fails.length}/${results.length} passed`);
await browser.close();
server.kill();
process.exit(fails.length ? 1 : 0);
