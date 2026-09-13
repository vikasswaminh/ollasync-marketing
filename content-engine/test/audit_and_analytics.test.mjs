import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { REPO_DIR, SITE_DIR } from '../engine/config.mjs';
import { parseCSV, summarize, run as runAnalytics } from '../engine/analytics.mjs';

const dist = join(SITE_DIR, 'dist');

test('the built site passes the SEO audit gate (one H1, canonical, BlogPosting + BreadcrumbList, sitemap, drafts)', { skip: !existsSync(dist) && 'no marketing-site/dist — run npm run build' }, () => {
  const r = spawnSync(process.execPath, [join(REPO_DIR, 'scripts', 'mkt_seo_audit.mjs'), dist], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /seo-audit passed/);
});

test('the SEO audit catches a broken post: two H1s, a draft that got built, a mismatched headline', () => {
  const d = mkdtempSync(join(tmpdir(), 'ce-dist-'));
  const page = (path, html) => {
    const dir = join(d, ...path.split('/').filter(Boolean));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html);
  };
  const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
  const post = (title, h1, extra = '', headline = h1) => `<html><head><title>${title}</title><meta name="description" content="desc ${title}"><link rel="canonical" href="https://www.ollasync.com/blog/${title}/">${ld({ '@type': 'BlogPosting', headline, description: `desc ${title}`, mainEntityOfPage: `https://www.ollasync.com/blog/${title}/`, datePublished: '2026-09-01T00:00:00Z', dateModified: '2026-09-01T00:00:00Z', author: { name: 'The Ollasync team' }, image: 'x' })}${ld({ '@type': 'BreadcrumbList', itemListElement: [{ position: 1, name: 'Home' }, { position: 2, name: 'Blog' }, { position: 3, name: h1 }] })}</head><body><article><h1>${h1}</h1><time datetime="2026-09-01T00:00:00.000Z">1 September 2026</time>${extra}<p>${'word '.repeat(400)}</p><span>The Ollasync team</span></article></body></html>`;
  page('/blog/good/', post('good', 'good'));
  page('/blog/bad/', post('bad', 'other', '<h1>again</h1>', 'a different headline'));
  page('/blog/draft-x/', post('draft-x', 'draft-x'));
  writeFileSync(join(d, 'sitemap-0.xml'), '<urlset><url><loc>https://www.ollasync.com/blog/good/</loc></url><url><loc>https://www.ollasync.com/blog/bad/</loc></url><url><loc>https://www.ollasync.com/blog/draft-x/</loc></url></urlset>');
  const src = mkdtempSync(join(tmpdir(), 'ce-src-'));
  writeFileSync(join(src, 'draft-x.md'), '---\ntitle: "x"\ndraft: true\n---\nbody');
  const r = spawnSync(process.execPath, [join(REPO_DIR, 'scripts', 'mkt_seo_audit.mjs'), d, src], { encoding: 'utf8' });
  assert.equal(r.status, 1, `${r.stdout}\n${r.stderr}`);
  assert.match(r.stderr, /\/blog\/bad\/: 2 <h1>/);
  assert.match(r.stderr, /headline ≠ visible <h1>/);
  assert.match(r.stderr, /draft draft-x was built/);
  assert.match(r.stderr, /draft draft-x is in the sitemap/);
  assert.doesNotMatch(r.stderr, /\/blog\/good\//);
});

test('analytics: Search Console CSV exports become flags (refresh, expand, consolidate) and name what is not measurable', () => {
  const rows = parseCSV('Top pages,Clicks,Impressions,CTR,Position\r\n"https://www.ollasync.com/blog/a/",3,900,"0.33%",12.4\r\nhttps://www.ollasync.com/blog/b/,40,500,8%,3.1\r\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[0]['top pages'], 'https://www.ollasync.com/blog/a/');
  const s = summarize(rows, parseCSV('Top queries,Page\nvirtual classroom,https://www.ollasync.com/blog/a/\nvirtual classroom,https://www.ollasync.com/blog/b/\n'));
  assert.ok(s.flags.some((f) => f.action === 'refresh' && f.url.endsWith('/blog/a/')));
  assert.ok(s.flags.some((f) => f.action === 'expand' && f.url.endsWith('/blog/a/')));
  assert.ok(s.flags.some((f) => f.action === 'consolidate' && f.query === 'virtual classroom'));
  assert.ok(s.notMeasurable.includes('Start Free clicks'));
  const dir = mkdtempSync(join(tmpdir(), 'ce-an-'));
  writeFileSync(join(dir, 'Pages.csv'), 'Top pages,Clicks,Impressions,CTR,Position\nhttps://www.ollasync.com/blog/a/,3,900,0.33%,12.4\n');
  const out = runAnalytics(dir);
  assert.equal(out.pages.length, 1);
  assert.ok(existsSync(join(dir, 'summary.json')));
  assert.equal(JSON.parse(readFileSync(join(dir, 'summary.json'), 'utf8')).flags.length, 2);
});
