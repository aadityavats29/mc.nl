/**
 * The approved-content export for the future assistant: an authenticated,
 * read-only projection of EXPLICITLY PUBLISHED public content only.
 *
 * - Auth: Authorization: Bearer <integration token> (server-side credential,
 *   visible to the owner in Studio → Settings; never shipped to frontend code).
 * - Contains: stable IDs, canonical URLs, titles, clean readable text,
 *   structured current prices/durations with their semantics, publication
 *   revisions and timestamps, plus withdrawal records for incremental
 *   consumers.
 * - Never contains: drafts, Studio content, internal notes, media source
 *   paths, enquiries, credentials or unconfirmed brand entries. The
 *   projection is built field by field; raw records are never serialised.
 */
import type { APIRoute } from 'astro';
import { listRecords, withdrawnRecordIds, lastEvent } from '../../../../lib/content';
import { getContent } from '../../../../lib/content';
import { getConfig } from '../../../../lib/db';
import { richTextToPlain } from '../../../../lib/richtext';

function sectionText(sections: any[] = []): string {
  return sections
    .filter((s) => s.visible !== false)
    .map((s) => {
      if (s.type === 'richtext') return richTextToPlain(s.text);
      if (s.type === 'quote') return s.text;
      if (s.type === 'faq') return (s.items ?? []).map((f: any) => `${f.q}\n${richTextToPlain(f.a)}`).join('\n\n');
      return '';
    })
    .filter(Boolean)
    .join('\n\n');
}

export const GET: APIRoute = ({ request }) => {
  const token = getConfig('assistant_token');
  const header = request.headers.get('authorization') ?? '';
  if (!token || header !== `Bearer ${token}`) {
    return new Response(JSON.stringify({ error: 'unauthorised' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const site = getContent<any>('settings:site', 'published');
  const base = (site?.url ?? 'https://maisoncoiffure.nl').replace(/\/$/, '');
  const records: any[] = [];

  if (site) {
    records.push({
      id: 'settings:site', type: 'business', lang: 'en', url: `${base}/contact`,
      title: site.name,
      text: `${site.name}. ${site.tagline} Address: ${site.addressLine}. Open ${site.availability}. ${site.walkIns} WhatsApp/telephone: ${site.phoneDisplay}. Email: ${site.email}. On location in ${site.onLocationArea}.`,
      state: 'active',
    });
  }

  const rules = getContent<any>('settings:booking', 'published');

  for (const r of listRecords('page')) {
    if (!r.published) continue;
    const c: any = r.published;
    const path = c.slug ? `/${c.slug}` : '/';
    let text = '';
    if (c.template === 'home') {
      text = [richTextToPlain(c.intro?.body ?? ''), c.intro?.tagline, richTextToPlain(c.salonParty?.body ?? ''), richTextToPlain(c.practical?.body ?? '')].filter(Boolean).join('\n\n');
    } else if (c.sections) {
      text = sectionText(c.sections);
    } else if (c.body) {
      text = richTextToPlain(c.body);
    } else {
      text = c.lede ?? '';
    }
    records.push({
      id: r.id, type: 'page', lang: 'en', url: `${base}${path}`,
      title: c.seo?.title ?? r.title,
      heading: c.heading ?? '',
      text,
      revision: r.published_version,
      updatedAt: r.updated_at,
      state: 'active',
    });
  }

  const groups = listRecords('service-group').filter((r) => r.published);
  const groupById = new Map(groups.map((r) => [(r.published as any).id, r]));

  for (const r of listRecords('treatment')) {
    if (!r.published) continue;
    const c: any = r.published;
    const url = `${base}/treatments/${c.slug}`;
    const options: any[] = [];
    for (const gid of c.groups ?? []) {
      const g = groupById.get(gid)?.published as any;
      if (!g) continue;
      for (const o of g.options) {
        options.push({
          group: g.title,
          name: o.name,
          description: o.copy ?? g.sharedCopy ?? '',
          priceType: o.priceType, // fixed | from | quote | consultation
          amountEUR: o.amount ?? null,
          duration: o.duration ?? null,
          consultationRequired: Boolean(g.consultationGated || g.id.includes('consultation') || o.priceType === 'quote'),
        });
      }
    }
    records.push({
      id: r.id, type: 'treatment', lang: 'en', url,
      title: c.title,
      summary: c.summary,
      text: richTextToPlain(c.body ?? ''),
      options,
      conditions: rules?.globalPriceCondition ?? '',
      revision: r.published_version,
      updatedAt: r.updated_at,
      state: 'active',
    });
  }

  for (const r of listRecords('stylist')) {
    if (!r.published || !(r.published as any).active) continue;
    const c: any = r.published;
    records.push({
      id: r.id, type: 'person', lang: 'en', url: `${base}/about/hairstylists`,
      title: c.displayName || 'The Maison Coiffure hairstylist',
      role: c.role,
      text: richTextToPlain(c.story ?? ''),
      specialties: c.specialties ?? [],
      revision: r.published_version,
      updatedAt: r.updated_at,
      state: 'active',
    });
  }

  for (const r of listRecords('blogpost')) {
    if (!r.published) continue;
    const c: any = r.published;
    records.push({
      id: r.id, type: 'article', lang: 'en', url: `${base}/blog/${c.slug}`,
      title: c.title, summary: c.summary, text: richTextToPlain(c.body ?? ''),
      author: c.author, publishedDate: c.publishedDate,
      revision: r.published_version, updatedAt: r.updated_at, state: 'active',
    });
  }

  for (const b of listRecords('brand')) {
    if (!b.published) continue;
    const c: any = b.published;
    if (!c.visible || !c.confirmed) continue; // drafts and unconfirmed brands never leave Studio
    records.push({ id: b.id, type: 'brand', title: c.name, state: 'active' });
  }

  const withdrawn = withdrawnRecordIds().map((w) => ({ id: w.id, state: 'withdrawn', withdrawnAt: w.at }));
  const ev = lastEvent();

  return new Response(
    JSON.stringify(
      {
        version: 'v1',
        generatedAt: new Date().toISOString(),
        lastContentChange: ev?.at ?? null,
        records: [...records, ...withdrawn],
      },
      null,
      1
    ),
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
  );
};
