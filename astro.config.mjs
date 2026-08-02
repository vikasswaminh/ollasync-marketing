import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Multi-page static marketing site for Ollasync.
// output: 'static' + directory URLs → /security serves /security/index.html.
export default defineConfig({
  site: 'https://ollasync.com',
  output: 'static',
  compressHTML: true,
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/thanks'),
    }),
  ],
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
});
