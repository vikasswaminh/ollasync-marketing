import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

// Build timestamp for sitemap <lastmod> (Google uses it as a freshness signal) — used for every page that has no
// date of its own. Blog posts get their frontmatter date (updatedDate, else pubDate): one build stamp on 80 URLs
// told search engines nothing. astro:content is not available here, so the frontmatter is read with fs.
const BUILD_DATE = new Date().toISOString();
// Astro's slug for a content file: the `slug:` frontmatter override when present, otherwise every path segment
// slugified the github-slugger way (lowercase, punctuation dropped, spaces → hyphens) with a trailing `/index` removed.
const slugSegment = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s+/g, '-');
const POST_DATES = (() => {
  const out = {};
  const root = new URL('./src/content/blog/', import.meta.url);
  const walk = (dir, segments) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        walk(new URL(`${e.name}/`, dir), [...segments, e.name]);
        continue;
      }
      const m = e.name.match(/^(.+)\.(md|mdx)$/);
      if (!m) continue;
      const fm = readFileSync(new URL(e.name, dir), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!fm) continue;
      const pick = (k) => {
        const r = fm[1].match(new RegExp(`^${k}:\\s*["']?(\\d{4}-\\d{2}-\\d{2})`, 'm'));
        return r ? r[1] : null;
      };
      const d = pick('updatedDate') || pick('pubDate');
      if (!d) continue;
      const override = fm[1].match(/^slug:\s*["']?([^"'\n]+?)["']?\s*$/m);
      const parts = [...segments, m[1]].filter((p, i, a) => !(i === a.length - 1 && p === 'index' && a.length > 1));
      out[override ? override[1].trim() : parts.map(slugSegment).join('/')] = new Date(d).toISOString();
    }
  };
  walk(root, []);
  return out;
})();

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
      // /licenses is noindex (OSS attribution page) — keep it out of the sitemap too.
      filter: (page) => !page.includes('/thanks') && !page.includes('/licenses'),
      serialize(item) {
        const post = item.url.match(/\/blog\/(.+?)\/?$/);
        item.lastmod = (post && POST_DATES[post[1]]) || BUILD_DATE;
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
