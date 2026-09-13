// Publication helpers: the frontmatter the blog collection expects, draft files (never inside src/content), the
// promote step that moves an approved draft into the site, back-links on older posts, and the explicit PR step.
// Nothing here talks to a model. Blocked articles never reach src/content.
import { existsSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { writeTextAtomic } from './state.mjs';
import { parseFrontmatter } from './corpus.mjs';

const CATEGORY_BY_PILLAR = { pillar_1: 'Teaching', pillar_2: 'Comparisons', pillar_3: 'Translation' };
const q = (s) => JSON.stringify(String(s)); // a JSON string is a valid double-quoted YAML scalar

export function readTimeFor(body) {
  const words = String(body).split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.round(words / 200));
}

/** Frontmatter + body for the blog collection (marketing-site/src/content/config.ts). */
export function articleFile(item, article, { pubDate, sources = [], related = [], cover = '/og-classroom.jpg' }) {
  const category = item.category || CATEGORY_BY_PILLAR[item.primaryPillar] || 'Teaching';
  const keywords = [item.primaryQuery, ...(item.secondaryQueries || [])].filter(Boolean);
  const lines = ['---'];
  lines.push(`title: ${q(article.title)}`);
  lines.push(`description: ${q(article.description)}`);
  lines.push(`pubDate: ${pubDate}`);
  lines.push(`category: ${q(category)}`);
  lines.push(`cover: ${q(cover)}`);
  lines.push(`readTime: ${readTimeFor(article.body)}`);
  lines.push('author: "The Ollasync team"');
  lines.push('authorRole: "Trainer tools & product"');
  lines.push(`keywords: [${keywords.map(q).join(', ')}]`);
  if (article.takeaways?.length) {
    lines.push('takeaways:');
    for (const t of article.takeaways) lines.push(`  - ${q(t)}`);
  }
  if (sources.length) {
    lines.push('sources:');
    for (const s of sources) lines.push(`  - url: ${q(s.url)}\n    publisher: ${q(s.publisher)}\n    accessDate: ${q(s.accessDate)}\n    claim: ${q(s.claim)}`);
  }
  if (related.length) lines.push(`related: [${related.map(q).join(', ')}]`);
  lines.push('draft: false');
  lines.push('---');
  lines.push('');
  return `${lines.join('\n')}${article.body.trim()}\n`;
}

export function writeDraft(store, slug, text, { blocked = false } = {}) {
  const p = join(store.draftsDir, `${blocked ? 'blocked-' : ''}${slug}.md`);
  writeTextAtomic(p, text);
  return p;
}

/** Move an approved draft into the site (pubDate = today). Returns the site path. */
export function promote(store, siteDir, slug, today) {
  const src = join(store.draftsDir, `${slug}.md`);
  if (!existsSync(src)) throw new Error(`no approved draft ${src}`);
  const dest = join(siteDir, 'src', 'content', 'blog', `${slug}.md`);
  if (existsSync(dest) || existsSync(dest.replace(/\.md$/, '.mdx'))) throw new Error(`${slug} already exists in the site`);
  const text = readFileSync(src, 'utf8').replace(/^pubDate: .*$/m, `pubDate: ${today}`);
  writeTextAtomic(dest, text);
  unlinkSync(src);
  return dest;
}

/** Add `related: [newSlug]` (+ updatedDate) to older posts the new article links — the policy's "update older
 *  articles when a new article creates an important contextual link". At most `max` posts; returns the files. */
export function addBacklinks(siteDir, newSlug, targetSlugs, today, max = 2) {
  const dir = join(siteDir, 'src', 'content', 'blog');
  const done = [];
  for (const slug of targetSlugs.slice(0, max)) {
    const file = readdirSync(dir).find((f) => f.replace(/\.(md|mdx)$/, '').toLowerCase() === slug && /\.(md|mdx)$/.test(f));
    if (!file) continue;
    const p = join(dir, file);
    const src = readFileSync(p, 'utf8');
    const { data } = parseFrontmatter(src);
    const related = Array.isArray(data.related) ? data.related : [];
    if (related.includes(newSlug)) continue;
    let out = src.replace(/\r\n/g, '\n');
    const rel = `related: [${[...related, newSlug].map(q).join(', ')}]`;
    if (/^related:.*$/m.test(out)) out = out.replace(/^related:.*$/m, rel);
    else out = out.replace(/\n---\n/, `\n${rel}\n---\n`);
    if (/^updatedDate:.*$/m.test(out)) out = out.replace(/^updatedDate:.*$/m, `updatedDate: ${today}`);
    else out = out.replace(/^(pubDate:.*)$/m, `$1\nupdatedDate: ${today}`);
    writeFileSync(p, out);
    done.push(p);
  }
  return done;
}

/** The explicit PR step (--open-pr): branch, commit what the run wrote, push, open or update the PR with gh. */
export function openPr(repoDir, { branch, title, body, paths }) {
  const git = (...args) => {
    const r = spawnSync('git', args, { cwd: repoDir, encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr || r.stdout}`);
    return r.stdout.trim();
  };
  const current = git('rev-parse', '--abbrev-ref', 'HEAD');
  if (current !== branch) {
    if (current !== 'dealroom' && !current.startsWith('content/')) throw new Error(`run --open-pr from dealroom or a content/ branch, not from ${current} (this repository's main is a different product)`);
    git('fetch', '-q', 'origin', 'dealroom');
    const exists = spawnSync('git', ['rev-parse', '--verify', branch], { cwd: repoDir, encoding: 'utf8' }).status === 0;
    if (exists) git('checkout', branch);
    else git('checkout', '-b', branch, 'origin/dealroom'); // always the updated dealroom, never the current branch
  }
  const preStaged = git('diff', '--cached', '--name-only');
  if (preStaged) throw new Error(`the index already holds staged changes — unstage them first:\n${preStaged}`); // never sweep unrelated work into a content PR
  git('add', ...paths);
  const staged = git('diff', '--cached', '--name-only');
  if (!staged) return { url: null, note: 'nothing to commit' };
  const stray = staged.split('\n').filter((f) => !paths.some((p) => f === p || f.startsWith(`${p}/`)));
  if (stray.length) {
    git('reset', '-q');
    throw new Error(`refusing to commit paths outside the content allowlist:\n${stray.join('\n')}`);
  }
  git('commit', '-q', '-m', `${title}\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`);
  git('push', '-q', '-u', 'origin', branch);
  const remote = git('ls-remote', 'origin', `refs/heads/${branch}`).split('\t')[0];
  const local = git('rev-parse', 'HEAD');
  if (remote !== local) throw new Error(`push not verified: local ${local} remote ${remote}`);
  const view = spawnSync('gh', ['pr', 'view', branch, '--json', 'url,state'], { cwd: repoDir, encoding: 'utf8' });
  if (view.status === 0) {
    const j = JSON.parse(view.stdout);
    if (j.state === 'OPEN') return { url: j.url, note: 'updated the open PR' };
  }
  const r = spawnSync('gh', ['pr', 'create', '--base', 'dealroom', '--head', branch, '--title', title, '--body', body], { cwd: repoDir, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`gh pr create: ${r.stderr}`);
  return { url: r.stdout.trim(), note: 'opened' };
}
