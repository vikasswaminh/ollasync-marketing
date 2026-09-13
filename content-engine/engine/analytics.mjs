// Analytics feedback loop (policy analytics_feedback_loop) on what exists today: Google Search Console exports.
// Drop the "Pages" and "Queries" CSV exports from Search Console into content-engine/analytics/ and run
// `node engine/analytics.mjs` — it writes analytics/summary.json with per-URL impressions/clicks/CTR/position and the
// policy's decision flags: refresh (high impressions, low CTR), expand (position 5–15), consolidate (queries that
// land on two blog URLs). It decides nothing on its own and never generates articles: after the initial 50 the
// next topics come from this summary and a human. Conversions, Start-free clicks and AI-referral traffic are not
// measurable with the current stack (edge page-view analytics only) and are reported as such.
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((c) => c !== ''));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim().toLowerCase(), (r[i] || '').trim()])));
}

const num = (v) => Number(String(v).replace(/[%,]/g, '')) || 0;

export function summarize(pagesRows, queriesRows) {
  const pages = pagesRows.map((r) => {
    const url = r['top pages'] || r.page || r.url || '';
    return { url, clicks: num(r.clicks), impressions: num(r.impressions), ctr: num(r.ctr), position: num(r.position) };
  }).filter((p) => p.url);
  const flags = [];
  for (const p of pages) {
    if (p.impressions >= 200 && p.ctr < 1.5) flags.push({ url: p.url, action: 'refresh', why: `high impressions (${p.impressions}) and low CTR (${p.ctr}%): rewrite the title and description` });
    if (p.position >= 5 && p.position <= 15 && p.impressions >= 50) flags.push({ url: p.url, action: 'expand', why: `position ${p.position}: near page one — expand the article's coverage of its query` });
  }
  const byQuery = {};
  for (const r of queriesRows) {
    const q = r['top queries'] || r.query || '';
    const url = r.page || r.url || '';
    if (!q) continue;
    byQuery[q] = byQuery[q] || new Set();
    if (url) byQuery[q].add(url);
  }
  for (const [q, urls] of Object.entries(byQuery)) {
    const blog = [...urls].filter((u) => u.includes('/blog/'));
    if (blog.length >= 2) flags.push({ query: q, urls: blog, action: 'consolidate', why: 'one query lands on two blog articles: merge or re-target one of them' });
  }
  return {
    generated: new Date().toISOString(),
    pages: pages.sort((a, b) => b.impressions - a.impressions),
    flags,
    notMeasurable: ['article conversions', 'Start Free clicks', 'demo clicks', 'pillar-assisted conversions', 'article-assisted conversions', 'ChatGPT referral traffic', 'AI-search referral traffic'],
    note: 'Search Console data only. Conversion and referral attribution need instrumentation the site does not have (edge page-view analytics only, no ref capture in the app).',
  };
}

export function run(dir) {
  if (!existsSync(dir)) return { generated: new Date().toISOString(), pages: [], flags: [], note: `no ${dir} — export the Search Console "Pages" and "Queries" reports as CSV into it` };
  const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.csv'));
  const pages = [];
  const queries = [];
  for (const f of files) {
    const rows = parseCSV(readFileSync(join(dir, f), 'utf8'));
    if (!rows.length) continue;
    const keys = Object.keys(rows[0]);
    if (keys.includes('top pages') || keys.includes('page')) pages.push(...rows);
    if (keys.includes('top queries') || keys.includes('query')) queries.push(...rows);
  }
  const s = summarize(pages, queries);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'summary.json'), `${JSON.stringify(s, null, 2)}\n`);
  return s;
}

if (process.argv[1] && process.argv[1].endsWith('analytics.mjs')) {
  const dir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'analytics');
  const s = run(dir);
  console.log(`${s.pages.length} pages, ${s.flags.length} flags → ${join(dir, 'summary.json')}`);
  for (const f of s.flags) console.log(`  ${f.action}: ${f.url || f.query} — ${f.why}`);
}
