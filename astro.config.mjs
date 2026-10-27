import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

const isStaticBuild =
  process.env.ASTRO_STATIC === 'true' || process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  site: 'https://nedder3.github.io',
  base: isStaticBuild ? process.env.ASTRO_BASE || '/formularios-web-isft' : '/',
  output: isStaticBuild ? 'static' : 'server',
  adapter: isStaticBuild
    ? undefined
    : node({
        mode: 'standalone',
      }),
  devToolbar: {
    enabled: false,
  },
  server: {
    port: 4321,
    host: true,
  },
  vite: {
    server: {
      allowedHosts: true,
    },
  },
});
