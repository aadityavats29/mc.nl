/**
 * Durable content storage for the public site and Maison Coiffure Studio.
 * SQLite via Node's built-in node:sqlite: a real, file-based, transactional
 * database with no native-module install step and no external service,
 * chosen as a vendor-neutral default until a hosting environment is selected
 * (the data model ports directly to Postgres or a hosted CMS). The database
 * lives in data/mc.db next to the project; uploaded media lives in
 * data/media/. Both are covered by the backup export in Studio → Settings.
 *
 * TEMPORARY VERCEL STAGING SHORTCUT (preview-only): a Vercel Preview
 * deployment has no writable/persistent app directory, so on Preview the
 * data lives in /tmp/maison-coiffure instead. /tmp is EPHEMERAL there:
 * Studio edits, logins, uploads and redirects made on staging can vanish on
 * any cold start or redeploy, and the empty database re-seeds itself with
 * the default Maison Coiffure content (via the existing ensureSeeded call in
 * the middleware). This is for temporary review only; it deliberately does
 * NOT activate on Vercel Production, so promoting the branch cannot silently
 * put production data in /tmp. Local development keeps using data/.
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const isVercelPreview =
  process.env.VERCEL === '1' &&
  process.env.VERCEL_ENV !== 'production';

export const DATA_DIR = isVercelPreview
  ? join('/tmp', 'maison-coiffure')
  : join(process.cwd(), 'data');

export const MEDIA_DIR = join(DATA_DIR, 'media');

mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(MEDIA_DIR, { recursive: true });

export const db = new DatabaseSync(join(DATA_DIR, 'mc.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','editor')),
  can_publish INTEGER NOT NULL DEFAULT 0,
  pass_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  draft TEXT NOT NULL,
  published TEXT,
  draft_version INTEGER NOT NULL DEFAULT 1,
  published_version INTEGER NOT NULL DEFAULT 0,
  ever_published INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_records_type ON records(type);
CREATE TABLE IF NOT EXISTS revisions (
  rev_id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  action TEXT NOT NULL,
  json TEXT NOT NULL,
  editor TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revisions_record ON revisions(record_id);
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('static','upload')),
  base TEXT NOT NULL,          -- '/images/<slug>' or upload id
  ext TEXT NOT NULL DEFAULT 'webp',
  widths TEXT NOT NULL,        -- JSON array of available widths
  w INTEGER NOT NULL, h INTEGER NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  credit TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ready',   -- ready | needs-permission | draft
  focal_x REAL NOT NULL DEFAULT 50, focal_y REAL NOT NULL DEFAULT 50,
  focal_xm REAL NOT NULL DEFAULT 50, focal_ym REAL NOT NULL DEFAULT 50,
  origin TEXT NOT NULL DEFAULT '',        -- original archive path, private
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  ev_id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  record_id TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS redirects (
  from_path TEXT PRIMARY KEY,
  to_path TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

export function now(): string {
  return new Date().toISOString();
}

export function getConfig(key: string): string | null {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? row.value : null;
}
export function setConfig(key: string, value: string): void {
  db.prepare('INSERT INTO config(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}
