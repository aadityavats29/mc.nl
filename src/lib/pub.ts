/**
 * Read helpers for public rendering. Everything comes from published content;
 * a signed-in Studio session may request ?preview=draft (checked in the
 * middleware) to see the complete draft with the real site renderer.
 */
import type { AstroGlobal } from 'astro';
import { getContent, listRecords, getMedia, type Mode, type MediaRow } from './content';

export function modeOf(Astro: Readonly<AstroGlobal>): Mode {
  return (Astro.locals as any).preview ? 'draft' : 'published';
}

export interface SiteSettings {
  name: string; tagline: string; addressLine: string; streetAddress: string; locality: string;
  phoneDisplay: string; phoneIntl: string; whatsappBase: string; email: string; instagram: string;
  availability: string; walkIns: string; onLocationArea: string; url: string;
}

export function sitePub(mode: Mode): SiteSettings {
  return getContent<SiteSettings>('settings:site', mode) ?? (getContent<SiteSettings>('settings:site', 'draft') as SiteSettings);
}

export function navPub(mode: Mode) {
  return getContent<any>('settings:nav', mode) ?? getContent<any>('settings:nav', 'draft');
}

export function bookingRules(mode: Mode) {
  return getContent<any>('settings:booking', mode) ?? getContent<any>('settings:booking', 'draft');
}

export function waLinkFor(site: SiteSettings, message: string): string {
  return `${site.whatsappBase}?text=${encodeURIComponent(message)}`;
}

export function serviceGroups(mode: Mode) {
  return listRecords('service-group')
    .map((r) => (mode === 'draft' ? r.draft : r.published))
    .filter(Boolean)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
}

export function serviceGroupsById(ids: string[], mode: Mode) {
  const all = serviceGroups(mode);
  return ids.map((id) => all.find((g: any) => g.id === id)).filter(Boolean);
}

export function treatmentsPub(mode: Mode) {
  return listRecords('treatment')
    .map((r) => (mode === 'draft' ? r.draft : r.published))
    .filter(Boolean)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
}

export function brandsPub(mode: Mode) {
  return listRecords('brand')
    .map((r) => (mode === 'draft' ? r.draft : r.published))
    .filter((b: any) => b && b.visible && b.confirmed)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
}

export function blogPostsPub(mode: Mode) {
  return listRecords('blogpost')
    .map((r) => (mode === 'draft' ? r.draft : r.published))
    .filter(Boolean)
    .sort((a: any, b: any) => String(b.publishedDate ?? '').localeCompare(String(a.publishedDate ?? '')));
}

export function stylistsPub(mode: Mode) {
  return listRecords('stylist')
    .map((r) => (mode === 'draft' ? r.draft : r.published))
    .filter((s: any) => s && s.active)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
}

export function media(id: string | undefined | null): MediaRow | null {
  if (!id) return null;
  return getMedia(id);
}
