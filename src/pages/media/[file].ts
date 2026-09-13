/**
 * Serves web derivatives of media uploaded through Studio. Only files that
 * exist in the managed media directory are served; nothing else on disk is
 * reachable through this route.
 */
import type { APIRoute } from 'astro';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { Readable } from 'node:stream';
import { MEDIA_DIR } from '../../lib/db';

export const GET: APIRoute = ({ params }) => {
  const file = String(params.file ?? '');
  if (!/^[a-z0-9-]+-\d+\.(webp|jpg|jpeg|png)$/i.test(file)) {
    return new Response('Not found', { status: 404 });
  }
  const path = normalize(join(MEDIA_DIR, file));
  if (!path.startsWith(MEDIA_DIR) || !existsSync(path)) {
    return new Response('Not found', { status: 404 });
  }
  const stat = statSync(path);
  const type = file.endsWith('.webp') ? 'image/webp' : file.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return new Response(Readable.toWeb(createReadStream(path)) as any, {
    headers: {
      'Content-Type': type,
      'Content-Length': String(stat.size),
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
