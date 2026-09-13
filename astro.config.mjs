// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Domain appears in the preserved MC material; live DNS/hosting is not verified.
// Confirm before launch (see _handoff/HANDOFF.md).
//
// The site runs as a served app (SSR) so that Maison Coiffure Studio edits are
// live immediately after publishing, pages stay server-rendered HTML for
// visitors, crawlers and the future assistant, and /studio can enforce real
// server-side authorisation. The sitemap is generated dynamically from
// published content at /sitemap.xml.
export default defineConfig({
  site: 'https://maisoncoiffure.nl',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  // Cross-origin form posts are rejected in src/middleware.ts by comparing the
  // Origin header's host with the request host; Astro's built-in check is
  // disabled because it misresolves the request origin behind the standalone
  // node adapter on localhost.
  security: { checkOrigin: false },
});
