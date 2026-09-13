// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Domain appears in the preserved MC material; live DNS/hosting is not verified.
// Confirm before launch (see _handoff/HANDOFF.md).
export default defineConfig({
  site: 'https://maisoncoiffure.nl',
  integrations: [sitemap()],
});
