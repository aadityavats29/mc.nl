import { defineMiddleware } from 'astro:middleware';
import { ensureSeeded } from './lib/seed';
import { currentUser, userCount } from './lib/auth';
import { db } from './lib/db';

let seeded = false;

export const onRequest = defineMiddleware(async (context, next) => {
  if (!seeded) {
    ensureSeeded();
    seeded = true;
  }

  const path = context.url.pathname.replace(/\/+$/, '') || '/';

  // CSRF: state-changing form posts must come from this site itself.
  if (context.request.method === 'POST') {
    const origin = context.request.headers.get('origin');
    const host = context.request.headers.get('host');
    if (origin && host) {
      try {
        if (new URL(origin).host !== host) return new Response('Cross-origin request rejected', { status: 403 });
      } catch {
        return new Response('Cross-origin request rejected', { status: 403 });
      }
    }
  }

  const user = currentUser(context.cookies);
  context.locals.user = user;

  // Draft preview is only ever served to a signed-in Studio session.
  context.locals.preview = Boolean(user) && context.url.searchParams.get('preview') === 'draft';

  const isStudio = path === '/studio' || path.startsWith('/studio/');
  const isStudioApi = path.startsWith('/api/studio/');
  if (isStudio || isStudioApi) {
    context.response?.headers?.set?.('X-Robots-Tag', 'noindex');
    const open = path === '/studio/login' || path === '/studio/setup';
    if (!user && !open) {
      if (userCount() === 0) return context.redirect('/studio/setup');
      return context.redirect('/studio/login');
    }
    if (user && path === '/studio/login') return context.redirect('/studio');
    const res = await next();
    res.headers.set('X-Robots-Tag', 'noindex');
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }

  // Public URL redirects (kept up to date when Studio renames a page URL).
  const redirect = db.prepare('SELECT to_path FROM redirects WHERE from_path = ?').get(path) as
    | { to_path: string }
    | undefined;
  if (redirect && redirect.to_path !== path) {
    return context.redirect(redirect.to_path, 301);
  }

  return next();
});
