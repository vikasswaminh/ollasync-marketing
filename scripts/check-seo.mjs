import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(process.argv[2] || 'dist');
assert.ok(existsSync(join(root, 'index.html')), 'Build the site before running the SEO checks.');

function* htmlFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith('.html')) yield path;
  }
}

const isFile = (path) => existsSync(path) && statSync(path).isFile();
const imageFile = (url) => {
  const path = new URL(url, 'https://www.ollasync.com').pathname;
  return path.startsWith('/') && isFile(join(root, decodeURIComponent(path)));
};
let pages = 0;
let breadcrumbs = 0;
const htmlByRoute = new Map();
for (const file of htmlFiles(root)) {
  const html = readFileSync(file, 'utf8');
  const label = relative(root, file);
  const route = `/${label.replaceAll('\\', '/').replace(/index\.html$/, '')}`;
  htmlByRoute.set(route, html);
  if (/<meta\b[^>]*http-equiv="refresh"/i.test(html)) continue;

  assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${label}: expected exactly one page H1`);
  pages++;
  for (const [element] of html.matchAll(/<(?:img|source)\b[^>]+>/gi)) {
    // The complete responsive set matters: browsers may choose a missing srcset size even when src exists.
    for (const [, value] of element.matchAll(/\b(?:src|srcset)="([^"]+)"/gi)) {
      for (const candidate of value.split(',')) {
        const url = candidate.trim().split(/\s+/)[0];
        if (url.startsWith('/') || url.startsWith('https://www.ollasync.com/')) {
          assert.ok(imageFile(url), `${label}: missing image ${url}`);
        }
      }
    }
  }
  const previewImage = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i)?.[1];
  if (previewImage) assert.ok(imageFile(previewImage), `${label}: missing Open Graph image ${previewImage}`);

  const nav = html.match(/<nav\b[^>]*aria-label="Breadcrumb"[^>]*>([\s\S]*?)<\/nav>/i)?.[1];
  if (nav) {
    assert.equal((nav.match(/aria-current="page"/g) || []).length, 1, `${label}: only the current breadcrumb should have aria-current`);
    for (const [, href] of nav.matchAll(/<a\b[^>]*href="([^"]+)"/gi)) {
      const url = new URL(href, 'https://www.ollasync.com');
      if (url.origin !== 'https://www.ollasync.com') continue;
      const destination = join(root, decodeURIComponent(url.pathname));
      assert.ok(isFile(destination) || isFile(join(destination, 'index.html')), `${label}: broken breadcrumb ${href}`);
    }
    breadcrumbs++;
  }

  for (const [, raw] of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    const schema = JSON.parse(raw);
    if (schema['@type'] !== 'BreadcrumbList') continue;
    const items = schema.itemListElement;
    items.forEach((item, index) => {
      assert.equal(item.position, index + 1, `${label}: breadcrumb schema positions must be consecutive`);
      if (index < items.length - 1) {
        assert.ok(item.item, `${label}: intermediate schema breadcrumbs require a destination`);
      }
    });
  }
}
const listingPages = [...htmlByRoute].filter(([route]) => route === '/blog/' || /^\/blog\/page\/\d+\/$/.test(route));
const listedArticles = new Map();
for (const [route, html] of listingPages) {
  const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
  assert.equal(canonical, `https://www.ollasync.com${route}`, `${route}: wrong canonical`);
  const cards = [...html.matchAll(/<a\b[^>]*href="\/blog\/([^"/]+)\/"[^>]*class="(?:feat|post-card)[^"]*"/g)].map((match) => match[1]);
  assert.ok(cards.length > 0 && cards.length <= 18, `${route}: expected 1–18 article cards`);
  assert.equal(cards.length, new Set(cards).size, `${route}: duplicate article cards`);
  for (const slug of cards) {
    assert.ok(!listedArticles.has(slug), `${slug}: repeated across ${listedArticles.get(slug)} and ${route}`);
    listedArticles.set(slug, route);
  }
  const next = html.match(/<a\b[^>]*rel="next"[^>]*href="([^"]+)"/i)?.[1];
  if (next) assert.ok(htmlByRoute.has(next), `${route}: missing next listing ${next}`);
}
const articleRoutes = [...htmlByRoute.keys()].filter((route) => /^\/blog\/[^/]+\/$/.test(route));
const redirects = readFileSync(join(root, '_redirects'), 'utf8').split(/\r?\n/)
  .filter((line) => line.trim() && !line.trim().startsWith('#'))
  .map((line) => line.trim().split(/\s+/))
  .filter((parts) => parts.length >= 3 && parts[2] === '301');
const redirectedPaths = new Set(redirects.map(([from]) => from).filter((from) => !from.includes('*')));
let internalLinks = 0;
let contextualArticleLinks = 0;
const brokenInternalLinks = new Map();
for (const [route, html] of htmlByRoute) {
  if (/<meta\b[^>]*http-equiv="refresh"/i.test(html)) continue;
  for (const [, href] of html.matchAll(/<a\b[^>]*href="([^"]+)"/gi)) {
    if (!href || href.startsWith('#')) continue;
    const url = new URL(href, 'https://www.ollasync.com');
    if (url.origin !== 'https://www.ollasync.com') continue;
    if (!htmlByRoute.has(url.pathname) && !redirectedPaths.has(url.pathname) && !isFile(join(root, decodeURIComponent(url.pathname))) && !isFile(join(root, decodeURIComponent(url.pathname), 'index.html'))) {
      const sources = brokenInternalLinks.get(url.pathname) || [];
      sources.push(route);
      brokenInternalLinks.set(url.pathname, sources);
    }
    internalLinks++;
  }
  if (articleRoutes.includes(route)) {
    const body = html.match(/<div\b[^>]*class="prose-post"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || '';
    if (/<a\b[^>]*href="\/(?!#)/i.test(body)) contextualArticleLinks++;
    const topicLink = html.match(/<p\b[^>]*class="post__topic-link"[^>]*>([\s\S]*?)<\/p>/i)?.[1];
    if (topicLink) assert.equal((topicLink.match(/<a\b/g) || []).length, 2, `${route}: expected topic and product links`);
  }
}
for (const [from, to] of redirects) {
  if (from.includes('*')) continue;
  assert.ok(htmlByRoute.has(to) || isFile(join(root, decodeURIComponent(to))) || isFile(join(root, decodeURIComponent(to), 'index.html')), `Redirect ${from} has no destination: ${to}`);
}
assert.equal(brokenInternalLinks.size, 0, `Broken internal links:\n${[...brokenInternalLinks].map(([url, routes]) => `${url} (${routes.length} pages; e.g. ${routes.slice(0, 2).join(', ')})`).join('\n')}`);
assert.equal(listedArticles.size, articleRoutes.length, 'Every published article must appear once in the main listing');
for (const route of articleRoutes) assert.ok(listedArticles.has(route.split('/')[2]), `${route}: missing from main listing`);
assert.equal(listingPages.length, Math.ceil(articleRoutes.length / 18), 'Unexpected main blog page count');

const hubRoutes = [...htmlByRoute.keys()].filter((route) => /^\/blog\/topics\/[^/]+\/$/.test(route));
assert.equal(hubRoutes.length, 4, 'Expected four distinct blog topic hubs');
let topicListings = 0;
for (const route of hubRoutes) {
  const slug = route.split('/')[3];
  const topicPages = [...htmlByRoute].filter(([pageRoute]) => pageRoute === route || new RegExp(`^/blog/topics/${slug}/page/\\d+/$`).test(pageRoute));
  const listed = new Set();
  for (const [pageRoute, html] of topicPages) {
    const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
    assert.equal(canonical, `https://www.ollasync.com${pageRoute}`, `${pageRoute}: wrong canonical`);
    const cards = [...html.matchAll(/<article\b[^>]*class="topic-card"[^>]*>[\s\S]*?<h3\b[^>]*>\s*<a\b[^>]*href="\/blog\/([^/]+)\//g)].map((match) => match[1]);
    assert.ok(cards.length > 0 && cards.length <= 18, `${pageRoute}: expected 1–18 topic cards`);
    for (const article of cards) {
      assert.ok(!listed.has(article), `${pageRoute}: duplicate topic article ${article}`);
      assert.ok(htmlByRoute.has(`/blog/${article}/`), `${pageRoute}: missing article ${article}`);
      listed.add(article);
    }
    topicListings++;
  }
  const advertised = Number(htmlByRoute.get(route).match(/<p\b[^>]*class="topic-count"[^>]*>(\d+) articles/)?.[1]);
  assert.equal(listed.size, advertised, `${route}: topic listing omitted articles`);
  assert.equal(topicPages.length, Math.ceil(advertised / 18), `${route}: incorrect topic page count`);
}
const sitemap = readFileSync(join(root, 'sitemap-0.xml'), 'utf8');
const urls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
assert.ok(urls.has('https://www.ollasync.com/'), 'Homepage must be in the sitemap');
for (const route of articleRoutes) assert.ok(urls.has(`https://www.ollasync.com${route}`), `${route}: missing from sitemap`);
const robots = readFileSync(join(root, 'robots.txt'), 'utf8');
assert.ok(robots.includes('Sitemap: https://www.ollasync.com/sitemap-index.xml'), 'robots.txt must reference the sitemap');
const llms = readFileSync(join(root, 'llms.txt'), 'utf8');
assert.ok(llms.includes('dedicated hosted deployments') && !llms.includes('100 % cloud SaaS'), 'llms.txt must reflect current deployment options');
for (const [, url] of llms.matchAll(/\]\((https:\/\/www\.ollasync\.com\/[^)]+)\)/g)) {
  if (url.endsWith('.xml')) continue;
  assert.ok(urls.has(url), `llms.txt references a URL not in the sitemap: ${url}`);
}
const security = readFileSync(join(root, '.well-known', 'security.txt'), 'utf8');
assert.ok(security.includes('Contact: mailto:security@ollasync.com'), 'security.txt contact missing');
assert.ok(Date.parse(security.match(/^Expires:\s*(.+)$/m)?.[1] || '') > Date.now(), 'security.txt has expired');
console.log(`SEO checks passed: ${pages} pages, ${breadcrumbs} breadcrumbs, ${listingPages.length} blog listing pages, ${listedArticles.size} unique articles, ${topicListings} topic listing pages, ${internalLinks} checked internal links, ${contextualArticleLinks} articles with contextual links, and discovery files.`);
