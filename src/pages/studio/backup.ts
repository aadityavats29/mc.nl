/** Owner backup: full content export as JSON (records, revisions, media
 *  registry, redirects, settings). Media files themselves live in data/media/;
 *  the owner guide explains copying the whole data/ folder. */
import type { APIRoute } from 'astro';
import { db } from '../../lib/db';

export const GET: APIRoute = ({ locals }) => {
  const user = (locals as any).user;
  if (!user || user.role !== 'owner') return new Response('Owner only', { status: 403 });
  const dump = {
    exportedAt: new Date().toISOString(),
    records: db.prepare('SELECT * FROM records').all(),
    revisions: db.prepare('SELECT * FROM revisions').all(),
    media: db.prepare('SELECT * FROM media').all(),
    redirects: db.prepare('SELECT * FROM redirects').all(),
    events: db.prepare('SELECT * FROM events').all(),
  };
  return new Response(JSON.stringify(dump, null, 1), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="maison-coiffure-content-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
};
