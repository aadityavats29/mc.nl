// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://maisoncoiffure.nl',
  output: 'server',
  adapter: vercel(),

  security: {
    checkOrigin: false,
  },
});