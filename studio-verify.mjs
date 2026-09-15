/**
 * Studio + AI-readiness acceptance checks, run against the real server with a
 * fresh database: real saved data and public results, not just screens.
 */
import { spawn } from 'node:child_process';
import { rmSync, existsSync } from 'node:fs';

const BASE = 'http://localhost:4610';
const results = [];
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  [' + String(extra).slice(0, 140) + ']' : ''}`);

// Fresh database
rmSync('data', { recursive: true, force: true });

const server = spawn('node', ['./dist/server/entry.mjs'], {
  env: { ...process.env, HOST: '127.0.0.1', PORT: '4610' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));
await new Promise((resolve, reject) => {
  const t0 = Date.now();
  (function poll() {
    fetch(BASE + '/').then(resolve).catch(() => {
      if (Date.now() - t0 > 20000) reject(new Error('server did not start\n' + serverLog));
      else setTimeout(poll, 300);
    });
  })();
});

/* Cookie-aware fetch helpers */
let cookies = {};
function cookieHeader() {
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
}
async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    redirect: 'manual',
    ...opts,
    headers: {
      cookie: cookieHeader(),
      ...(opts.method === 'POST' ? { origin: BASE } : {}), // Astro CSRF origin check
      ...(opts.headers ?? {}),
    },
  });
  const setc = res.headers.getSetCookie?.() ?? [];
  for (const c of setc) {
    const [pair] = c.split(';');
    const [k, v] = pair.split('=');
    if (v === '' || /expires=Thu, 01 Jan 1970/i.test(c)) delete cookies[k];
    else cookies[k] = v;
  }
  return res;
}
async function post(path, data, extra = {}) {
  const body = new URLSearchParams(data);
  return req(path, { method: 'POST', body, ...extra });
}
const text = async (r) => await r.text();

/* ---- 1. public pages served, no-JS readable ---- */
{
  const home = await text(await req('/'));
  ok('home is served with published content', home.includes('Sometimes you need a haircut') && home.includes('hero-landing'));
  ok('home keeps confirmed brand names only', home.includes('Kérastase') && home.includes('Moroccanoil'));
  const treat = await text(await req('/treatments'));
  ok('catalogue server-rendered with prices', treat.includes('Curly haircut, short hair') && treat.includes('€49') && treat.includes('From €85'));
  ok('quote/consultation semantics survive', treat.includes('Personal quotation') && treat.includes('€25 consultation'));
  const party = await text(await req('/treatments/salon-party'));
  ok('salon party page with both venues', party.includes('At your home.') && party.includes('At Maison Coiffure.'));
  const sm = await text(await req('/sitemap.xml'));
  ok('sitemap lists published canonical pages', sm.includes('/treatments/superloop') && sm.includes('<lastmod>'));
  ok('robots blocks studio', (await text(await req('/robots.txt'))).includes('Disallow: /studio'));
}

/* ---- 2. studio access control and setup ---- */
{
  const r = await req('/studio');
  ok('studio redirects to first-run setup', r.status === 302 && r.headers.get('location') === '/studio/setup');
  await post('/studio/setup', { name: 'Jolene', email: 'owner@example.com', password: 'correct-horse-mc', confirm: 'correct-horse-mc' });
  const overview = await req('/studio');
  ok('owner account created and signed in', overview.status === 200 && (await text(overview)).includes('Overview'));
}

/* ---- 3. edit → draft → preview → publish (homepage heading) ---- */
{
  const editor = await text(await req('/studio/edit/page:home'));
  const baseVersion = editor.match(/name="baseVersion" value="(\d+)"/)[1];
  // Post a save with ALL form values? Only changed paths are applied; unlisted keep draft values.
  await post('/studio/edit/page:home', { baseVersion, action: 'save', 'f:intro.heading': 'A quieter kind of salon.' });
  const publicHome = await text(await req('/'));
  ok('draft change NOT on the public site', publicHome.includes('Sometimes you need a haircut'));
  const previewAnon = cookies; // save
  const draftPrev = await text(await req('/?preview=draft'));
  ok('signed-in draft preview shows the change', draftPrev.includes('A quieter kind of salon.'));
  // publish (two-step)
  const ed2 = await text(await req('/studio/edit/page:home'));
  const v2 = ed2.match(/name="baseVersion" value="(\d+)"/)[1];
  const conf = await post('/studio/edit/page:home', { baseVersion: v2, action: 'publish' });
  ok('publish shows a confirmation step', (await text(conf)).includes('Publish this?'));
  const ed3 = await text(await req('/studio/edit/page:home'));
  const v3 = ed3.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/page:home', { baseVersion: v3, action: 'publish-confirm' });
  const homeAfter = await text(await req('/'));
  ok('published change is live', homeAfter.includes('A quieter kind of salon.'));
}

/* ---- 4. draft preview requires authorisation ---- */
{
  const saved = { ...cookies };
  cookies = {};
  await post('/studio/edit/page:home', { baseVersion: '1', action: 'save', 'f:intro.heading': 'HACKED' }).then((r) =>
    ok('unauthenticated studio mutation is rejected', r.status === 302 && r.headers.get('location')?.includes('/studio/login'))
  );
  const anonPreview = await text(await req('/?preview=draft'));
  ok('anonymous ?preview=draft serves only published content', anonPreview.includes('A quieter kind of salon.'));
  cookies = saved;
}

/* ---- 5. shared price edit propagates everywhere on publish ---- */
{
  const ed = await text(await req('/studio/edit/service-group:haircuts'));
  const v = ed.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/service-group:haircuts', { baseVersion: v, action: 'save', 'n:options.0.amount': '36' });
  const treatBefore = await text(await req('/treatments/haircuts'));
  ok('price change stays draft until published', treatBefore.includes('€35') && !treatBefore.includes('€36'));
  const ed2 = await text(await req('/studio/edit/service-group:haircuts'));
  const v2 = ed2.match(/name="baseVersion" value="(\d+)"/)[1];
  const confirm = await text(await post('/studio/edit/service-group:haircuts', { baseVersion: v2, action: 'publish' }));
  ok('shared-record publish lists affected pages', confirm.includes('Used on') && confirm.includes('Haircuts'));
  const ed3 = await text(await req('/studio/edit/service-group:haircuts'));
  const v3 = ed3.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/service-group:haircuts', { baseVersion: v3, action: 'publish-confirm' });
  const t = await text(await req('/treatments/haircuts'));
  const idx = await text(await req('/treatments'));
  const book = await text(await req('/book'));
  ok('price updates treatment page, catalogue and booking together', t.includes('€36') && idx.includes('€36') && book.includes('€36'));
}

/* ---- 6. price validation: unknown never becomes €0 ---- */
{
  const ed = await text(await req('/studio/edit/service-group:haircuts'));
  const v = ed.match(/name="baseVersion" value="(\d+)"/)[1];
  const res = await text(await post('/studio/edit/service-group:haircuts', { baseVersion: v, action: 'publish', 'n:options.0.amount': '' }));
  ok('publishing a fixed price without an amount is blocked', res.includes('Not ready to publish'));
  const ed2 = await text(await req('/studio/edit/service-group:haircuts'));
  const v2 = ed2.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/service-group:haircuts', { baseVersion: v2, action: 'save', 'n:options.0.amount': '36' });
}

/* ---- 7. assistant export: auth, published-only, structured prices ---- */
{
  const noAuth = await req('/api/assistant/content/v1');
  ok('assistant export rejects missing token', noAuth.status === 401);
  const settings = await text(await req('/studio/settings'));
  const token = settings.match(/<code class="token">([a-f0-9]{48})<\/code>/)?.[1];
  ok('assistant token visible to owner in settings', Boolean(token));
  const exp = await (await req('/api/assistant/content/v1', { headers: { authorization: `Bearer ${token}` } })).json();
  const haircut = exp.records.find((r) => r.id === 'treatment:haircuts');
  ok('export contains published treatment with structured prices', haircut && haircut.options.some((o) => o.amountEUR === 36 && o.priceType === 'fixed'));
  ok('export preserves from/quote semantics', exp.records.some((r) => r.options?.some((o) => o.priceType === 'from')) && exp.records.some((r) => r.options?.some((o) => o.priceType === 'quote' && o.amountEUR === null)));
  const dump = JSON.stringify(exp);
  ok('export never contains drafts or internal notes', !dump.includes('HACKED') && !dump.includes('Before-After Images') && !dump.includes('internal'));
  // draft-only change must not appear
  const ed = await text(await req('/studio/edit/treatment:curls'));
  const v = ed.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/treatment:curls', { baseVersion: v, action: 'save', 'f:summary': 'DRAFT-ONLY-SENTENCE' });
  const exp2 = await (await req('/api/assistant/content/v1', { headers: { authorization: `Bearer ${token}` } })).json();
  ok('unpublished draft text is absent from the export', !JSON.stringify(exp2).includes('DRAFT-ONLY-SENTENCE'));
}

/* ---- 8. unpublish removes everywhere ---- */
{
  const ed = await text(await req('/studio/edit/treatment:superloop'));
  const v = ed.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/treatment:superloop', { baseVersion: v, action: 'unpublish' });
  const page = await req('/treatments/superloop');
  ok('unpublished treatment returns 404 on the site', page.status === 404);
  const sm = await text(await req('/sitemap.xml'));
  ok('unpublished treatment leaves the sitemap immediately', !sm.includes('/treatments/superloop'));
  const settings = await text(await req('/studio/settings'));
  const token = settings.match(/<code class="token">([a-f0-9]{48})<\/code>/)?.[1];
  const exp = await (await req('/api/assistant/content/v1', { headers: { authorization: `Bearer ${token}` } })).json();
  const rec = exp.records.find((r) => r.id === 'treatment:superloop');
  ok('assistant export marks it withdrawn, not active', rec?.state === 'withdrawn');
  // restore
  const ed2 = await text(await req('/studio/edit/treatment:superloop'));
  const v2 = ed2.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/treatment:superloop', { baseVersion: v2, action: 'publish' });
  const ed3 = await text(await req('/studio/edit/treatment:superloop'));
  const v3 = ed3.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/treatment:superloop', { baseVersion: v3, action: 'publish-confirm' });
  ok('republish restores the page', (await req('/treatments/superloop')).status === 200);
}

/* ---- 9. concurrent edits conflict instead of overwriting ---- */
{
  const ed = await text(await req('/studio/edit/page:philosophy'));
  const v = ed.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/page:philosophy', { baseVersion: v, action: 'save', 'f:lede': 'First editor version.' });
  const stale = await text(await post('/studio/edit/page:philosophy', { baseVersion: v, action: 'save', 'f:lede': 'Second editor, stale.' }));
  ok('stale save is stopped with both versions preserved', stale.includes('Someone else saved'));
  const ed2 = await text(await req('/studio/edit/page:philosophy'));
  ok('newer draft survived the conflict', ed2.includes('First editor version.'));
}

/* ---- 10. section operations ---- */
{
  const ed = await text(await req('/studio/edit/page:philosophy'));
  const v = ed.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/page:philosophy', { baseVersion: v, action: '', listop: 'add|sections|-1', addkind: 'quote', 'f:lede': 'First editor version.' });
  const ed2 = await text(await req('/studio/edit/page:philosophy'));
  ok('section added via the library', (ed2.match(/section-card-head/g) || []).length >= 5);
  const v2 = ed2.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/page:philosophy', { baseVersion: v2, listop: 'toggle|sections|0' });
  const ed3 = await text(await req('/studio/edit/page:philosophy'));
  ok('section hidden (restorable)', ed3.includes('hidden-section'));
  const v3 = ed3.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/page:philosophy', { baseVersion: v3, listop: 'toggle|sections|0' });
}

/* ---- 11. slug rename creates a redirect ---- */
{
  const ed = await text(await req('/studio/edit/blogpost:none'));
  // create an article
  await post('/studio/list/blogpost', { action: 'create', title: 'Grey hair, gracefully' });
  const ed2 = await text(await req('/studio/edit/blogpost:grey-hair-gracefully'));
  const v2 = ed2.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/blogpost:grey-hair-gracefully', {
    baseVersion: v2, action: 'save',
    'f:body': 'A first article body.', 'f:author': 'Maison Coiffure', 'f:summary': 'On going grey.',
  });
  const ed3 = await text(await req('/studio/edit/blogpost:grey-hair-gracefully'));
  const v3 = ed3.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/blogpost:grey-hair-gracefully', { baseVersion: v3, action: 'publish' });
  const ed4 = await text(await req('/studio/edit/blogpost:grey-hair-gracefully'));
  const v4 = ed4.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/blogpost:grey-hair-gracefully', { baseVersion: v4, action: 'publish-confirm' });
  ok('published article is live on the blog', (await text(await req('/blog'))).includes('Grey hair, gracefully'));
  // rename slug
  const ed5 = await text(await req('/studio/edit/blogpost:grey-hair-gracefully'));
  const v5 = ed5.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/blogpost:grey-hair-gracefully', { baseVersion: v5, action: 'save', 'f:slug': 'gracefully-grey-story' });
  const redir = await req('/blog/grey-hair-gracefully');
  ok('old article address redirects to the new one', redir.status === 301 && redir.headers.get('location') === '/blog/gracefully-grey-story');
}

/* ---- 12. editor role without publishing rights ---- */
{
  await post('/studio/settings', { action: 'invite', name: 'Assistant Editor', email: 'editor@example.com', password: 'drafts-only-pass' });
  const owner = { ...cookies };
  cookies = {};
  await post('/studio/login', { email: 'editor@example.com', password: 'drafts-only-pass' });
  const ed = await text(await req('/studio/edit/page:gallery'));
  ok('editor can open the editor', ed.includes('Gallery'));
  const v = ed.match(/name="baseVersion" value="(\d+)"/)[1];
  await post('/studio/edit/page:gallery', { baseVersion: v, action: 'save', 'f:lede': 'Editor draft lede.' });
  const ed2 = await text(await req('/studio/edit/page:gallery'));
  const v2 = ed2.match(/name="baseVersion" value="(\d+)"/)[1];
  const conf = await text(await post('/studio/edit/page:gallery', { baseVersion: v2, action: 'publish' }));
  ok('draft-only editor cannot publish', conf.includes('ask the owner to publish'));
  ok('gallery lede unchanged on live site', !(await text(await req('/gallery'))).includes('Editor draft lede.'));
  cookies = owner;
}

/* ---- 13. history restore ---- */
{
  const hist = await text(await req('/studio/history/page:philosophy'));
  const firstRev = [...hist.matchAll(/name="rev" value="(\d+)"/g)].at(-1)[1]; // oldest
  await post('/studio/history/page:philosophy', { rev: firstRev });
  const ed = await text(await req('/studio/edit/page:philosophy'));
  ok('restore puts the original version back into the draft', !ed.includes('First editor version.'));
}

/* ---- 14. media upload with sharp ---- */
{
  const { default: sharp } = await import('sharp');
  const png = await sharp({ create: { width: 640, height: 480, channels: 3, background: { r: 91, g: 23, b: 24 } } })
    .png()
    .toBuffer();
  const fd = new FormData();
  fd.set('file', new File([png], 'salon-test.png', { type: 'image/png' }));
  fd.set('alt', 'A plain test image');
  const up = await req('/studio/media', { method: 'POST', body: fd });
  ok('media upload accepted', up.status === 302 && up.headers.get('location')?.includes('/studio/media/salon-test'));
  const loc = up.headers.get('location') ?? '';
  const id = loc.split('/').pop()?.split('?')[0] ?? '';
  const derivative = await req(`/media/${id}-480.webp`);
  ok('web derivative is served', derivative.status === 200 && derivative.headers.get('content-type') === 'image/webp');
  const traversal = await req('/media/..%2F..%2Fmc.db');
  ok('media route refuses anything outside the library', traversal.status === 404);
}

/* ---- 15. studio never indexed, search works ---- */
{
  const r = await req('/studio');
  ok('studio responses carry noindex and no-store', r.headers.get('x-robots-tag') === 'noindex' && r.headers.get('cache-control') === 'no-store');
  const s = await text(await req('/studio/search?q=Gracefully'));
  ok('content search finds records', s.includes('result') && s.includes('Gracefully'));
}

console.log(results.join('\n'));
const fails = results.filter((r) => r.startsWith('FAIL'));
console.log(`\n${results.length - fails.length}/${results.length} passed`);
server.kill();
process.exit(fails.length ? 1 : 0);
