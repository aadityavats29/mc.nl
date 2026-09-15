/**
 * Shared content records: the single source for the public site, Studio and
 * the assistant export. Every record keeps a private draft and an explicitly
 * published version, a full revision history, and change events that drive
 * freshness reporting. Public rendering reads ONLY published content unless
 * an authorised Studio session asks for a draft preview.
 */
import { db, now } from './db';

export interface ContentRecord<T = any> {
  id: string;
  type: string;
  title: string;
  draft: T;
  published: T | null;
  draft_version: number;
  published_version: number;
  ever_published: number;
  updated_at: string;
  updated_by: string;
}

export type Mode = 'published' | 'draft';

function parse<T>(row: any): ContentRecord<T> | null {
  if (!row) return null;
  return {
    ...row,
    draft: JSON.parse(row.draft),
    published: row.published ? JSON.parse(row.published) : null,
  };
}

export function getRecord<T = any>(id: string): ContentRecord<T> | null {
  return parse<T>(db.prepare('SELECT * FROM records WHERE id = ?').get(id));
}

/** Content for public rendering: published, or the draft in preview mode. */
export function getContent<T = any>(id: string, mode: Mode = 'published'): T | null {
  const rec = getRecord<T>(id);
  if (!rec) return null;
  if (mode === 'draft') return rec.draft;
  return rec.published;
}

export function listRecords<T = any>(type: string): ContentRecord<T>[] {
  return (db.prepare('SELECT * FROM records WHERE type = ? ORDER BY id').all(type) as any[])
    .map((r) => parse<T>(r)!)
    .filter(Boolean);
}

export function createRecord(id: string, type: string, title: string, data: any, editor = 'seed'): void {
  db.prepare(
    'INSERT INTO records(id, type, title, draft, published, draft_version, published_version, ever_published, updated_at, updated_by) VALUES(?,?,?,?,?,?,?,?,?,?)'
  ).run(id, type, title, JSON.stringify(data), null, 1, 0, 0, now(), editor);
  db.prepare('INSERT INTO revisions(record_id, version, action, json, editor, created_at) VALUES(?,?,?,?,?,?)').run(
    id, 1, 'create', JSON.stringify(data), editor, now()
  );
}

export class VersionConflictError extends Error {
  current: ContentRecord;
  constructor(current: ContentRecord) {
    super('This content was changed by someone else while you were editing.');
    this.current = current;
  }
}

/** Save a draft. baseVersion must match the current draft_version, otherwise
 *  the newer work is preserved and a conflict is raised (both drafts survive:
 *  the caller still holds the submitted values). */
export function saveDraft(id: string, data: any, editor: string, baseVersion: number): ContentRecord {
  const rec = getRecord(id);
  if (!rec) throw new Error(`No such record: ${id}`);
  if (baseVersion !== rec.draft_version) throw new VersionConflictError(rec);
  const version = rec.draft_version + 1;
  db.prepare('UPDATE records SET draft = ?, draft_version = ?, updated_at = ?, updated_by = ? WHERE id = ?').run(
    JSON.stringify(data), version, now(), editor, id
  );
  db.prepare('INSERT INTO revisions(record_id, version, action, json, editor, created_at) VALUES(?,?,?,?,?,?)').run(
    id, version, 'save', JSON.stringify(data), editor, now()
  );
  return getRecord(id)!;
}

export function publishRecord(id: string, editor: string): ContentRecord {
  const rec = getRecord(id);
  if (!rec) throw new Error(`No such record: ${id}`);
  db.prepare(
    'UPDATE records SET published = draft, published_version = draft_version, ever_published = 1, updated_at = ?, updated_by = ? WHERE id = ?'
  ).run(now(), editor, id);
  db.prepare('INSERT INTO revisions(record_id, version, action, json, editor, created_at) VALUES(?,?,?,?,?,?)').run(
    id, rec.draft_version, 'publish', JSON.stringify(rec.draft), editor, now()
  );
  db.prepare('INSERT INTO events(kind, record_id, at) VALUES(?,?,?)').run('publish', id, now());
  return getRecord(id)!;
}

export function unpublishRecord(id: string, editor: string): void {
  const rec = getRecord(id);
  if (!rec) return;
  db.prepare('UPDATE records SET published = NULL, published_version = 0, updated_at = ?, updated_by = ? WHERE id = ?').run(
    now(), editor, id
  );
  db.prepare('INSERT INTO revisions(record_id, version, action, json, editor, created_at) VALUES(?,?,?,?,?,?)').run(
    id, rec.draft_version, 'unpublish', JSON.stringify(rec.draft), editor, now()
  );
  db.prepare('INSERT INTO events(kind, record_id, at) VALUES(?,?,?)').run('unpublish', id, now());
}

export function deleteRecord(id: string, editor: string): void {
  const rec = getRecord(id);
  if (!rec) return;
  db.prepare('INSERT INTO revisions(record_id, version, action, json, editor, created_at) VALUES(?,?,?,?,?,?)').run(
    id, rec.draft_version, 'delete', JSON.stringify(rec.draft), editor, now()
  );
  db.prepare('DELETE FROM records WHERE id = ?').run(id);
  db.prepare('INSERT INTO events(kind, record_id, at) VALUES(?,?,?)').run('delete', id, now());
}

/** Restore a past revision INTO THE DRAFT (publication is a separate step). */
export function restoreRevision(id: string, revId: number, editor: string): ContentRecord {
  const rev = db.prepare('SELECT * FROM revisions WHERE rev_id = ? AND record_id = ?').get(revId, id) as any;
  if (!rev) throw new Error('Revision not found');
  const rec = getRecord(id)!;
  return saveDraft(id, JSON.parse(rev.json), editor, rec.draft_version);
}

export function recordStatus(rec: ContentRecord): 'Draft' | 'Published' | 'Unpublished changes' {
  if (!rec.published) return 'Draft';
  if (rec.draft_version > rec.published_version) return 'Unpublished changes';
  return 'Published';
}

export function listRevisions(id: string) {
  return db.prepare('SELECT rev_id, version, action, editor, created_at FROM revisions WHERE record_id = ? ORDER BY rev_id DESC LIMIT 60').all(id) as any[];
}

export function recentEdits(limit = 8) {
  return (db.prepare('SELECT * FROM records ORDER BY updated_at DESC LIMIT ?').all(limit) as any[]).map((r) => parse(r)!);
}

export function unpublishedChanges() {
  return (db
    .prepare('SELECT * FROM records WHERE published IS NULL OR draft_version > published_version ORDER BY updated_at DESC')
    .all() as any[]).map((r) => parse(r)!);
}

export function searchDrafts(q: string) {
  const like = `%${q.replaceAll('%', '').replaceAll('_', '')}%`;
  return (db
    .prepare('SELECT * FROM records WHERE draft LIKE ? OR title LIKE ? ORDER BY updated_at DESC LIMIT 40')
    .all(like, like) as any[]).map((r) => parse(r)!);
}

export function lastEvent(): { kind: string; record_id: string; at: string } | null {
  return (db.prepare('SELECT kind, record_id, at FROM events ORDER BY ev_id DESC LIMIT 1').get() as any) ?? null;
}

export function withdrawnRecordIds(): { id: string; at: string }[] {
  // Records whose published content was withdrawn or deleted after having been live.
  const rows = db
    .prepare(
      `SELECT r.id AS id, MAX(e.at) AS at FROM records r JOIN events e ON e.record_id = r.id
       WHERE r.ever_published = 1 AND r.published IS NULL AND e.kind IN ('unpublish') GROUP BY r.id`
    )
    .all() as any[];
  const deleted = db
    .prepare(
      `SELECT e.record_id AS id, MAX(e.at) AS at FROM events e
       WHERE e.kind = 'delete' AND e.record_id NOT IN (SELECT id FROM records) GROUP BY e.record_id`
    )
    .all() as any[];
  return [...rows, ...deleted];
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

export interface MediaRow {
  id: string;
  kind: 'static' | 'upload';
  base: string;
  ext: string;
  widths: string;
  w: number;
  h: number;
  alt: string;
  caption: string;
  credit: string;
  status: string;
  focal_x: number;
  focal_y: number;
  focal_xm: number;
  focal_ym: number;
  origin: string;
  created_at: string;
}

export function getMedia(id: string): MediaRow | null {
  return (db.prepare('SELECT * FROM media WHERE id = ?').get(id) as MediaRow) ?? null;
}
export function listMedia(): MediaRow[] {
  return db.prepare('SELECT * FROM media ORDER BY created_at DESC').all() as MediaRow[];
}
export function mediaUrl(m: MediaRow, w: number): string {
  const widths = JSON.parse(m.widths) as number[];
  const pick = widths.find((x) => x >= w) ?? widths[widths.length - 1];
  return m.kind === 'static' ? `${m.base}-${pick}.${m.ext}` : `/media/${m.id}-${pick}.${m.ext}`;
}
export function mediaSrcset(m: MediaRow): string {
  const widths = JSON.parse(m.widths) as number[];
  return widths
    .map((w) => (m.kind === 'static' ? `${m.base}-${w}.${m.ext} ${w}w` : `/media/${m.id}-${w}.${m.ext} ${w}w`))
    .join(', ');
}

/** Where a media item is used, by scanning drafts and published content. */
export function mediaUsages(mediaId: string): { id: string; title: string; where: string }[] {
  const rows = db.prepare("SELECT id, title, draft, published FROM records").all() as any[];
  const out: { id: string; title: string; where: string }[] = [];
  for (const r of rows) {
    const inDraft = r.draft.includes(`"${mediaId}"`);
    const inPub = r.published ? r.published.includes(`"${mediaId}"`) : false;
    if (inDraft || inPub) out.push({ id: r.id, title: r.title, where: inPub ? 'published' : 'draft' });
  }
  return out;
}
