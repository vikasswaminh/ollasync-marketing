import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  site: 'https://quick-messaging.pages.dev',
  compressHTML: true,
  build: {
    format: 'file'
  }
});
