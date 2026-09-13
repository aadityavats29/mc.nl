/**
 * Studio editing engine: applies submitted form fields onto a record's draft
 * by dot-path, performs list operations (add / move / hide / duplicate /
 * remove) with accessible buttons, validates before publishing, and reports
 * where shared records are used.
 */
import { randomUUID } from 'node:crypto';
import { db, now } from './db';
import { getRecord, listRecords, getMedia, recordStatus, type ContentRecord } from './content';

/* ---------------- form → draft ---------------- */

function setPath(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key: any = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
    if (cur[key] == null || typeof cur[key] !== 'object') {
      cur[key] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    }
    cur = cur[key];
  }
  const last: any = /^\d+$/.test(parts.at(-1)!) ? Number(parts.at(-1)) : parts.at(-1);
  cur[last] = value;
}

export function getPath(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[/^\d+$/.test(k) ? Number(k) : k]), obj);
}

/**
 * Apply submitted fields to a copy of the draft.
 * Field name conventions:
 *   f:<path>        text value (kept as string; '' allowed)
 *   n:<path>        number ('' → null)
 *   b:<path>        checkbox (presence → true); pair with bm:<path> marker
 *   l:<path>        one-item-per-line list of strings
 * Unlisted paths keep their current draft values.
 */
export function applyForm(draft: any, form: FormData): any {
  const next = structuredClone(draft);
  const boolPaths = new Set<string>();
  for (const [name] of form.entries()) {
    if (name.startsWith('bm:')) boolPaths.add(name.slice(3));
  }
  for (const path of boolPaths) setPath(next, path, false);
  for (const [name, raw] of form.entries()) {
    if (typeof raw !== 'string') continue;
    if (name.startsWith('f:')) setPath(next, name.slice(2), raw);
    else if (name.startsWith('n:')) setPath(next, name.slice(2), raw.trim() === '' ? null : Number(raw));
    else if (name.startsWith('b:')) setPath(next, name.slice(2), true);
    else if (name.startsWith('l:'))
      setPath(
        next,
        name.slice(2),
        raw.split('\n').map((s) => s.trim()).filter(Boolean)
      );
  }
  return next;
}

/* ---------------- list operations ---------------- */

export const SECTION_LIBRARY: Record<string, () => any> = {
  richtext: () => ({ id: randomUUID().slice(0, 8), type: 'richtext', visible: true, text: '' }),
  quote: () => ({ id: randomUUID().slice(0, 8), type: 'quote', visible: true, text: '' }),
  image: () => ({ id: randomUUID().slice(0, 8), type: 'image', visible: true, media: '', caption: '' }),
  image_text: () => ({ id: randomUUID().slice(0, 8), type: 'image_text', visible: true, media: '', text: '' }),
  faq: () => ({ id: randomUUID().slice(0, 8), type: 'faq', visible: true, items: [{ q: '', a: '' }] }),
  cta: () => ({ id: randomUUID().slice(0, 8), type: 'cta', visible: true, label: '', href: '/', style: 'link' }),
};

export function newListItem(listPath: string, kind: string): any {
  if (listPath === 'sections') return (SECTION_LIBRARY[kind] ?? SECTION_LIBRARY.richtext)();
  if (listPath === 'options') return { name: '', copy: '', priceType: 'fixed', amount: null, duration: '' };
  if (listPath.endsWith('cards')) return { media: '', label: '', title: '', summary: '', href: '/', cta: 'Read more', visible: true };
  if (listPath === 'notes') return '';
  if (listPath === 'steps') return { t: '', d: '' };
  if (listPath.endsWith('items')) return { label: '', href: '/', children: [] };
  if (listPath.endsWith('media')) return '';
  if (listPath.endsWith('.items')) return { q: '', a: '' };
  return {};
}

export function applyListOp(draft: any, op: string, listPath: string, index: number, kind?: string): any {
  const next = structuredClone(draft);
  const list = getPath(next, listPath);
  if (!Array.isArray(list)) return next;
  switch (op) {
    case 'add':
      list.push(newListItem(listPath, kind ?? 'richtext'));
      break;
    case 'up':
      if (index > 0) [list[index - 1], list[index]] = [list[index], list[index - 1]];
      break;
    case 'down':
      if (index < list.length - 1) [list[index + 1], list[index]] = [list[index], list[index + 1]];
      break;
    case 'remove':
      list.splice(index, 1);
      break;
    case 'duplicate': {
      const copy = structuredClone(list[index]);
      if (copy && typeof copy === 'object' && 'id' in copy) copy.id = randomUUID().slice(0, 8);
      list.splice(index + 1, 0, copy);
      break;
    }
    case 'toggle':
      if (list[index] && typeof list[index] === 'object') list[index].visible = !(list[index].visible !== false);
      break;
  }
  return next;
}

/* ---------------- validation before publishing ---------------- */

export interface Problem {
  field: string;
  message: string;
  level: 'error' | 'warning';
}

export function validateForPublish(rec: ContentRecord): Problem[] {
  const p: Problem[] = [];
  const c: any = rec.draft;
  const err = (field: string, message: string) => p.push({ field, message, level: 'error' });
  const warn = (field: string, message: string) => p.push({ field, message, level: 'warning' });

  const checkMedia = (id: string | undefined | null, field: string, required = false) => {
    if (!id) {
      if (required) err(field, 'Choose a photo.');
      return;
    }
    const m = getMedia(id);
    if (!m) err(field, `The photo "${id}" no longer exists. Choose another.`);
    else if (m.status === 'needs-permission') warn(field, `"${id}": client publication permission is not yet confirmed for this photo.`);
    else if (m.status === 'draft') warn(field, `"${id}" is marked as not ready for publication.`);
  };

  if (rec.type === 'page') {
    if (!c.seo?.title?.trim()) err('seo.title', 'A search title is required.');
    if (!c.seo?.description?.trim()) err('seo.description', 'A search description is required.');
    if (c.template !== 'home' && !c.heading?.trim()) err('heading', 'The page needs a heading.');
    if (c.template === 'home') {
      checkMedia(c.hero?.mediaDesktop, 'hero.mediaDesktop', true);
      checkMedia(c.hero?.mediaMobile, 'hero.mediaMobile');
      (c.aboutCards?.cards ?? []).forEach((card: any, i: number) => {
        if (card.visible) {
          checkMedia(card.media, `aboutCards.cards.${i}.media`, true);
          if (!card.title?.trim()) err(`aboutCards.cards.${i}.title`, 'Every visible card needs a title.');
          if (!card.href?.trim()) err(`aboutCards.cards.${i}.href`, 'Every visible card needs a destination.');
        }
      });
      (c.recentWork?.media ?? []).forEach((id: string, i: number) => checkMedia(id, `recentWork.media.${i}`));
    }
    if (typeof c.media === 'string' && c.media) checkMedia(c.media, 'media');
    (c.sections ?? []).forEach((s: any, i: number) => {
      if (s.visible === false) return;
      if ((s.type === 'image' || s.type === 'image_text')) checkMedia(s.media, `sections.${i}.media`, true);
      if (s.type === 'cta' && !s.href?.trim()) err(`sections.${i}.href`, 'The call to action needs a destination.');
    });
    if (Array.isArray(c.media)) c.media.forEach((id: string, i: number) => checkMedia(id, `media.${i}`));
  }

  if (rec.type === 'treatment') {
    if (!c.title?.trim()) err('title', 'The treatment needs a name.');
    if (!c.seoDescription?.trim()) err('seoDescription', 'A search description is required.');
    if (!c.summary?.trim()) err('summary', 'The explorer summary is required (it is always visible).');
    if (!c.slug?.trim()) err('slug', 'The page address (slug) is required.');
    if (c.media) checkMedia(c.media, 'media');
    const groups = listRecords('service-group').map((g) => (g.draft as any).id);
    (c.groups ?? []).forEach((gid: string, i: number) => {
      if (!groups.includes(gid)) err(`groups.${i}`, `Price group "${gid}" does not exist.`);
    });
  }

  if (rec.type === 'service-group') {
    if (!c.title?.trim()) err('title', 'The group needs a name.');
    (c.options ?? []).forEach((o: any, i: number) => {
      if (!o.name?.trim()) err(`options.${i}.name`, 'Every service needs a name.');
      if (!['fixed', 'from', 'quote', 'consultation'].includes(o.priceType))
        err(`options.${i}.priceType`, 'Choose how the price works.');
      if (o.priceType !== 'quote' && (o.amount == null || Number.isNaN(o.amount)))
        err(`options.${i}.amount`, 'A price amount is required unless the service is quoted personally. An unknown price stays a personal quotation; it never becomes €0.');
      if (o.priceType === 'quote' && o.amount != null)
        err(`options.${i}.amount`, 'A personally quoted service cannot also carry a fixed amount.');
    });
  }

  if (rec.type === 'stylist') {
    checkMedia(c.portrait, 'portrait', true);
    if (!c.story?.trim()) err('story', 'The profile needs its story text.');
    if (!c.displayName?.trim()) warn('displayName', 'No display name has been confirmed by the owner yet; the profile publishes without a name.');
  }

  if (rec.type === 'brand') {
    if (!c.name?.trim()) err('name', 'The brand needs a name.');
    if (c.visible && !c.confirmed) err('confirmed', 'Only confirmed brands can be shown on the website. Confirm the brand or keep it hidden.');
  }

  if (rec.type === 'blogpost') {
    if (!c.title?.trim()) err('title', 'The article needs a title.');
    if (!c.slug?.trim()) err('slug', 'The article needs a page address (slug).');
    if (!c.body?.trim()) err('body', 'The article needs its text.');
    if (!c.author?.trim()) err('author', 'A real author is required.');
    if (c.media) checkMedia(c.media, 'media');
  }

  return p;
}

/* ---------------- shared-record usage ("Used on…") ---------------- */

export function usedOn(needle: string, excludeId?: string): { id: string; title: string; type: string }[] {
  const rows = db.prepare('SELECT id, type, title, draft, published FROM records').all() as any[];
  const out: { id: string; title: string; type: string }[] = [];
  for (const r of rows) {
    if (r.id === excludeId) continue;
    if (r.draft.includes(`"${needle}"`) || (r.published ?? '').includes(`"${needle}"`)) {
      out.push({ id: r.id, title: r.title, type: r.type });
    }
  }
  return out;
}

/* ---------------- routes and redirects ---------------- */

export function publicPathOf(rec: ContentRecord): string | null {
  const c: any = rec.draft;
  if (rec.type === 'page') return c.slug != null ? (c.slug ? `/${c.slug}` : '/') : null;
  if (rec.type === 'treatment') return `/treatments/${c.slug}`;
  if (rec.type === 'blogpost') return `/blog/${c.slug}`;
  return null;
}

export function addRedirect(from: string, to: string): void {
  if (!from || from === to) return;
  db.prepare('INSERT INTO redirects(from_path, to_path, created_at) VALUES(?,?,?) ON CONFLICT(from_path) DO UPDATE SET to_path = excluded.to_path').run(from, to, now());
  // Never redirect a path onto itself through a chain.
  db.prepare('DELETE FROM redirects WHERE from_path = ?').run(to);
}

/* ---------------- labels ---------------- */

export const TYPE_LABELS: Record<string, { one: string; many: string }> = {
  page: { one: 'Page', many: 'Pages' },
  treatment: { one: 'Treatment', many: 'Treatments' },
  'service-group': { one: 'Price group', many: 'Services & prices' },
  stylist: { one: 'Hairstylist', many: 'Hairstylists' },
  brand: { one: 'Brand', many: 'Brands' },
  blogpost: { one: 'Article', many: 'Blog' },
  settings: { one: 'Settings', many: 'Settings' },
};

export function statusBadge(rec: ContentRecord): { label: string; cls: string } {
  const s = recordStatus(rec);
  if (s === 'Published') return { label: 'Published', cls: 'published' };
  if (s === 'Unpublished changes') return { label: 'Unpublished changes', cls: 'changes' };
  return { label: 'Draft', cls: 'draft' };
}
