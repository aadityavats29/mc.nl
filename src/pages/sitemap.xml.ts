/**
 * Sitemap generated from the CURRENT publication state: published canonical
 * pages only, with real last-modification dates. Withdrawn URLs disappear
 * immediately; Studio and previews are never listed.
 */
import type { APIRoute } from 'astro';
import { listRecords, getRecord } from '../lib/content';
import { getContent } from '../lib/content';

export const GET: APIRoute = () => {
  const site = getContent<any>('settings:site', 'published') ?? getContent<any>('settings:site', 'draft');
  const base = (site?.url ?? 'https://maisoncoiffure.nl').replace(/\/$/, '');
  const urls: { loc: string; lastmod: string }[] = [];

  const add = (path: string, updated: string) => {
    urls.push({ loc: `${base}${path}`, lastmod: updated.slice(0, 10) });
  };

  for (const r of listRecords('page')) {
    if (!r.published) continue;
    const slug = (r.published as any).slug ?? '';
    add(slug ? `/${slug}` : '/', r.updated_at);
  }
  for (const r of listRecords('treatment')) {
    if (!r.published) continue;
    add(`/treatments/${(r.published as any).slug}`, r.updated_at);
  }
  for (const r of listRecords('blogpost')) {
    if (!r.published) continue;
    add(`/blog/${(r.published as any).slug}`, r.updated_at);
  }
  const stylists = listRecords('stylist').filter((r) => r.published && (r.published as any).active);
  if (stylists.length > 1) {
    for (const r of stylists) add(`/about/hairstylists/${(r.published as any).slug}`, r.updated_at);
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
