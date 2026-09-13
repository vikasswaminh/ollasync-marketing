import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { articleFile, writeDraft, promote, addBacklinks, readTimeFor } from '../engine/publish.mjs';
import { parseFrontmatter } from '../engine/corpus.mjs';
import { Store } from '../engine/state.mjs';
import { goodArticle, manifestItem, tempState } from './fixtures.mjs';

test('the article file carries the frontmatter the blog collection expects and parses back', () => {
  const item = manifestItem(1, { primaryPillar: 'pillar_3', primaryQuery: 'english to hindi live translation', secondaryQueries: ['hindi class'] });
  const text = articleFile(item, goodArticle({ title: 'A "quoted" title: with colon' }), { pubDate: '2026-09-13', sources: [{ url: 'https://x.test/p', publisher: 'X', accessDate: '2026-09-13', claim: 'a claim' }], related: ['existing-a'] });
  const { data, body } = parseFrontmatter(text);
  assert.equal(data.title, 'A "quoted" title: with colon');
  assert.equal(data.category, 'Translation');
  assert.equal(data.pubDate, '2026-09-13');
  assert.equal(data.draft, false);
  assert.deepEqual(data.keywords, ['english to hindi live translation', 'hindi class']);
  assert.deepEqual(data.related, ['existing-a']);
  assert.ok(text.includes('sources:\n  - url: "https://x.test/p"'));
  assert.ok(body.startsWith(goodArticle().body.slice(0, 40)));
  assert.equal(readTimeFor('word '.repeat(1000)), 5);
  assert.ok(!/^# /m.test(body), 'no H1 in the body');
});

test('drafts live outside the site; promote moves an approved draft in with today\'s date; blocked drafts never move', () => {
  const dir = tempState([manifestItem(1)]);
  const store = new Store(dir);
  const site = mkdtempSync(join(tmpdir(), 'ce-site-'));
  mkdirSync(join(site, 'src', 'content', 'blog'), { recursive: true });
  const text = articleFile(manifestItem(1), goodArticle(), { pubDate: '2026-01-01' });
  const p = writeDraft(store, 'test-article-1', text);
  assert.ok(p.endsWith(join('drafts', 'test-article-1.md')));
  const bp = writeDraft(store, 'test-article-2', text, { blocked: true });
  assert.ok(bp.endsWith('blocked-test-article-2.md'));
  const dest = promote(store, site, 'test-article-1', '2026-09-13');
  assert.equal(existsSync(p), false);
  assert.ok(readFileSync(dest, 'utf8').includes('pubDate: 2026-09-13'));
  assert.throws(() => promote(store, site, 'test-article-1', '2026-09-13'), /already exists|no approved draft/);
  assert.throws(() => promote(store, site, 'test-article-2', '2026-09-13'), /no approved draft/);
});

test('back-links: an older post gains related + updatedDate once, at most two posts', () => {
  const site = mkdtempSync(join(tmpdir(), 'ce-site-'));
  const dir = join(site, 'src', 'content', 'blog');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'Old-Post.mdx'), '---\ntitle: "Old"\ndescription: "d"\npubDate: 2026-08-01\ncategory: "Guides"\n---\n\nbody\n');
  writeFileSync(join(dir, 'other.md'), '---\ntitle: "Other"\ndescription: "d"\npubDate: 2026-08-02\ncategory: "Guides"\nrelated: ["x"]\n---\n\nbody\n');
  writeFileSync(join(dir, 'third.md'), '---\ntitle: "Third"\ndescription: "d"\npubDate: 2026-08-03\ncategory: "Guides"\n---\n\nbody\n');
  const done = addBacklinks(site, 'new-post', ['old-post', 'other', 'third'], '2026-09-13');
  assert.equal(done.length, 2);
  const old = readFileSync(join(dir, 'Old-Post.mdx'), 'utf8');
  assert.ok(old.includes('related: ["new-post"]') && old.includes('updatedDate: 2026-09-13'));
  const other = readFileSync(join(dir, 'other.md'), 'utf8');
  assert.ok(other.includes('related: ["x", "new-post"]'));
  assert.ok(!readFileSync(join(dir, 'third.md'), 'utf8').includes('related'), 'third post untouched (max two)');
  assert.deepEqual(addBacklinks(site, 'new-post', ['old-post'], '2026-09-14'), [], 'idempotent');
});
