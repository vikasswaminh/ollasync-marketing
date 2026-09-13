// The product-facts manifest is human-curated; this test re-derives the countable facts from the site's data files
// and fails when they drift (a new language, a changed per-session cap, a removed feature page).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadFacts } from '../engine/corpus.mjs';
import { ENGINE_DIR, SITE_DIR } from '../engine/config.mjs';

const src = (p) => readFileSync(join(SITE_DIR, 'src', p), 'utf8');

test('language facts match src/data/languages.ts', () => {
  const langs = src('data/languages.ts');
  const entries = [...langs.matchAll(/\{\s*code:\s*'([a-z]+)',\s*name:\s*'([^']+)'/g)].map((m) => ({ code: m[1], name: m[2] }));
  const perSession = Number((langs.match(/LANGS_PER_SESSION\s*=\s*(\d+)/) || [])[1]);
  const { product } = loadFacts(ENGINE_DIR);
  const f = (id) => product.facts.find((x) => x.id === id).text;
  assert.equal(entries.length, 19);
  assert.ok(f('F01').includes(`${entries.length} languages`), 'F01 states the shipped count');
  assert.ok(f('F02').includes(`up to ${perSession} different languages`), 'F02 states the per-session cap');
  for (const e of entries) assert.ok(f('F03').includes(e.name), `F03 names ${e.name}`);
  assert.ok(product.never.some((n) => n.includes(`${entries.length}`)) && product.never.some((n) => n.includes(`${perSession} languages per session`)));
});

test('every fact source that names a feature or use-case page points at one that exists', () => {
  const features = src('data/features.ts');
  const useCases = src('data/useCases.ts');
  const { product } = loadFacts(ENGINE_DIR);
  for (const fact of product.facts) {
    for (const m of fact.source.matchAll(/features\.ts\s+([a-z-]+)/g)) assert.ok(features.includes(`slug: '${m[1]}'`), `${fact.id}: feature ${m[1]}`);
    for (const m of fact.source.matchAll(/useCases\.ts\s+([a-z]+)/g)) assert.ok(useCases.includes(`slug: '${m[1]}'`), `${fact.id}: use case ${m[1]}`);
    for (const m of fact.source.matchAll(/src\/pages\/([a-z-]+\.astro)/g)) assert.ok(existsSync(join(SITE_DIR, 'src', 'pages', m[1])), `${fact.id}: page ${m[1]}`);
  }
  assert.ok(product.facts.length >= 20);
  assert.ok(new Set(product.facts.map((f) => f.id)).size === product.facts.length, 'unique fact ids');
});

test('the pillar and spoke pages the manifest links to exist as routes', () => {
  const pillars = JSON.parse(readFileSync(join(ENGINE_DIR, 'pillars.json'), 'utf8'));
  const manifest = JSON.parse(readFileSync(join(ENGINE_DIR, 'manifest.json'), 'utf8'));
  const useCases = src('data/useCases.ts');
  const features = src('data/features.ts');
  const vs = src('data/vs.ts');
  const langs = src('data/languages.ts');
  const exists = (path) => {
    if (path === '/languages/') return existsSync(join(SITE_DIR, 'src', 'pages', 'languages', 'index.astro'));
    let m;
    if ((m = path.match(/^\/use-cases\/([a-z]+)\/$/))) return useCases.includes(`slug: '${m[1]}'`);
    if ((m = path.match(/^\/features\/([a-z-]+)\/$/))) return features.includes(`slug: '${m[1]}'`);
    if ((m = path.match(/^\/vs\/([a-z-]+)\/$/))) return vs.includes(`slug: '${m[1]}'`);
    if ((m = path.match(/^\/languages\/([a-z]+)\/$/))) return langs.includes(`code: '${m[1]}'`);
    if ((m = path.match(/^\/([a-z-]+)\/$/))) return existsSync(join(SITE_DIR, 'src', 'pages', `${m[1]}.astro`)) || existsSync(join(SITE_DIR, 'src', 'pages', m[1], 'index.astro'));
    return false;
  };
  for (const p of Object.values(pillars)) {
    assert.ok(exists(p.url), `pillar ${p.url}`);
    for (const s of p.spokes) assert.ok(exists(s), `spoke ${s}`);
  }
  for (const it of manifest.items) {
    assert.ok(Object.keys(pillars).includes(it.primaryPillar), `${it.id} pillar`);
    for (const t of it.internalLinkTargets) assert.ok(exists(t), `${it.id} link target ${t}`);
    if (it.languageSpecifics) assert.ok(langs.includes(`code: '${it.languageSpecifics.code}'`), `${it.id} language ${it.languageSpecifics.code}`);
  }
});
