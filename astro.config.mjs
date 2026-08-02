import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Build timestamp for sitemap <lastmod> (Google uses it as a freshness signal).
const BUILD_DATE = new Date().toISOString();

// Multi-page static marketing site for Ollasync.
// output: 'static' + directory URLs → /security serves /security/index.html.
export default defineConfig({
  site: 'https://www.ollasync.com',
  output: 'static',
  compressHTML: true,
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/thanks'),
      serialize(item) {
        item.lastmod = BUILD_DATE;
        item.changefreq = item.url === 'https://www.ollasync.com/' ? 'weekly' : 'monthly';
        item.priority = item.url === 'https://www.ollasync.com/' ? 1.0 : item.url.includes('/blog/') ? 0.6 : 0.8;
        return item;
      },
    }),
  ],
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
});
