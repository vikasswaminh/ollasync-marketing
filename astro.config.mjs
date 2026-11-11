import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';

// Blog articles use their published/updated date; other pages use the last committed source change.
// Do not turn every deploy into an artificial content update in the sitemap.
const COMMIT_DATE = (() => {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cI'], { encoding: 'utf8' }).trim();
  } catch {
    return undefined;
  }
})();
const lastChanged = (paths) => {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cI', '--', ...paths], { encoding: 'utf8' }).trim() || COMMIT_DATE;
  } catch {
    return COMMIT_DATE;
  }
};
const CORE_DATE = lastChanged(['src/layouts', 'src/components', 'src/styles', 'src/consts.ts', 'src/data']);
const BLOG_LIST_DATE = lastChanged(['src/content/blog', 'src/pages/blog', 'src/layouts/BlogPost.astro', 'src/data/blogTopics.ts']);
const PAGE_DATES = (() => {
  const dates = {};
  const walk = (dir, segments) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(new URL(`${entry.name}/`, dir), [...segments, entry.name]);
      } else if (entry.name.endsWith('.astro')) {
        const stem = entry.name.slice(0, -6);
        if (stem.startsWith('[') || stem === '404') continue;
        const route = [...segments, stem === 'index' ? '' : stem].filter(Boolean).join('/');
        dates[route] = lastChanged([relative(fileURLToPath(new URL('.', import.meta.url)), fileURLToPath(new URL(entry.name, dir)))]);
      }
    }
  };
  walk(new URL('./src/pages/', import.meta.url), []);
  return dates;
})();
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

// Retired product URLs stay reachable for existing links, including blog articles.
const retiredRoutes = {
  "/features/webinars": "/features/video-meetings/",
  "/features/deal-rooms": "/features/video-meetings/",
  "/roles/customer-success-webinars": "/roles/customer-success-meetings/",
  "/use-cases/customer-education-webinars": "/use-cases/customer-education-meetings/",
  "/alternatives/cvent": "/features/video-meetings/",
  "/integrations/scorm-virtual-classroom": "/virtual-classroom-software/",
  "/integrations/ai-video-analytics": "/features/ai/"
};

// Multi-page static marketing site for OllaSync.
// output: 'static' + directory URLs → /security serves /security/index.html.
export default defineConfig({
  site: 'https://www.ollasync.com',
  output: 'static',
  redirects: retiredRoutes,
  compressHTML: true,
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    sitemap({
      // /licenses is noindex (OSS attribution page) — keep it out of the sitemap too.
      filter: (page) => !page.includes('/thanks') && !page.includes('/licenses') && !Object.hasOwn(retiredRoutes, new URL(page).pathname.replace(/\/$/, '')),
      serialize(item) {
        const pathname = new URL(item.url).pathname.replace(/^\/|\/$/g, '');
        const post = pathname.match(/^blog\/(.+)$/);
        const changed = post && POST_DATES[post[1]];
        const sourceDate = changed || (pathname.startsWith('blog/') ? BLOG_LIST_DATE : PAGE_DATES[pathname]);
        const dates = (changed ? [changed] : [sourceDate, CORE_DATE]).filter(Boolean).map((date) => new Date(date).getTime());
        if (dates.length) item.lastmod = new Date(Math.max(...dates)).toISOString();
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
