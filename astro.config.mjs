import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Static by default; server routes opt in with `export const prerender = false`.
export default defineConfig({
  output: 'static',
  adapter: vercel(),
  redirects: {
    '/dashboard': '/journey',
    '/movements': '/learn/movements',
    '/music': '/learn/music',
  },
});
