import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runBatch, mergeInsights, rejudge, verifiedClaims, questionHeadings, blockItem, PR_PATHS, stageCosts } from '../engine/run.mjs';
import { runTotals, report } from '../engine/report.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { Store } from '../engine/state.mjs';
import { TfIdf, loadFacts } from '../engine/corpus.mjs';
import { loadConfig, ENGINE_DIR } from '../engine/config.mjs';
import { goodArticle, envelope, reviewJSON, tempState, manifestItem, fakeLLM, EXISTING } from './fixtures.mjs';

const PRICING = { 'google/gemini-2.5-flash-lite': { prompt: 0.1, completion: 0.4 }, 'deepseek/deepseek-v4-flash-0731': { prompt: 0.04, completion: 0.08 }, 'qwen/qwen3-32b': { prompt: 0.08, completion: 0.28 }, 'nvidia/nemotron-3.5-lightning': { prompt: 0.08, completion: 0.2 } };
const CFG = (dir, extra = {}) => loadConfig({ OPENROUTER_API_KEY: 'k', OPENROUTER_PROVIDERS: 'CoreWeave', CONTENT_ENGINE_STATE: dir, MARKETING_DIST: join(dir, 'no-dist'), ...extra });
const corpusDocs = [
  { key: '/blog/existing-a/', kind: 'post', path: '/blog/existing-a/', title: 'What a server can see', description: 'metadata versus content', headings: ['Metadata'], text: 'what a server can see on an encrypted call metadata content' },
  { key: '/blog/existing-b/', kind: 'post', path: '/blog/existing-b/', title: 'Class notes that write themselves', description: 'AI notes', headings: ['Notes'], text: 'ai class notes automatic lecture notes summary' },
];
const deps = (llm, extra = {}) => ({ pricing: PRICING, facts: loadFacts(ENGINE_DIR), corpus: { docs: corpusDocs, paths: EXISTING }, index: new TfIdf(corpusDocs), leakPatterns: [{ name: 'vendor/infra name', re: /livekit/i }], llm, fetchImpl: async () => { throw new Error('no network in tests'); }, now: () => Date.now(), ...extra });
const args = (o = {}) => ({ dryRun: true, batch: null, limit: 5, only: null, retry: null, fresh: null, promote: null, publish: 'none', openPr: false, report: false, ...o });
const happy = () => fakeLLM({ intent: JSON.stringify({ results: [] }), write: envelope(goodArticle()), edit: envelope(goodArticle()), review: reviewJSON({ total: 92 }) });

test('a dry run approves a good article: draft on disk, manifest updated, run record with costs, nothing in the site', async () => {
  const dir = tempState([manifestItem(1)]);
  const store = new Store(dir);
  const llm = happy();
  assert.equal(await runBatch(args(), CFG(dir), store, deps(llm)), 0);
  const m = store.loadManifest();
  assert.equal(m.items[0].status, 'approved');
  assert.equal(m.items[0].qualityScore, 92);
  assert.equal(m.items[0].writerModel, 'writer/model');
  assert.equal(m.items[0].reviewerModel, 'reviewer/model');
  assert.ok(m.items[0].cost > 0);
  assert.ok(existsSync(join(dir, 'drafts', 'test-article-1.md')));
  assert.deepEqual(llm.calls.map((c) => c.stage), ['write', 'edit', 'review'], 'no intent call when nothing is lexically close; one pass each');
  assert.equal(llm.calls[0].temperature, 0.45, 'the policy writer temperature');
  assert.equal(llm.calls.find((c) => c.stage === 'edit').task, 'content_writer', 'the editor pass runs on the writer route; the reviewer never scores text it edited');
  const run = store.runs()[0];
  assert.deepEqual(run.approved, ['b1-01']);
  assert.equal(run.articles['b1-01'].status, 'approved');
  assert.ok(run.articles['b1-01'].stages.write.costUsd > 0 && run.articles['b1-01'].stages.review);
  assert.equal(run.totals.calls, 3);
  assert.ok(store.questions().questions.some((q) => q.q.startsWith('how do learners join')), 'question registry updated');
});

test('re-running the same day is idempotent, and resume reuses persisted stages after a crash', async () => {
  const dir = tempState([manifestItem(1), manifestItem(2)]);
  const store = new Store(dir);
  let boom = true;
  // each article asks a different question (the registry forbids repeating one across articles)
  const perItem = (req) => {
    const a = goodArticle();
    const q = `How do learners join a class without installing anything for ${req.articleId}?`;
    a.body = a.body.replace('## How do learners join a class without installing anything?', `## ${q}`);
    a.questions = [q];
    return envelope(a);
  };
  const llm = fakeLLM({ intent: JSON.stringify({ results: [] }), write: perItem, edit: (req) => { if (boom) { boom = false; return new Error('crash after the draft'); } return perItem(req); }, review: reviewJSON({ total: 90 }) });
  await runBatch(args({ limit: 1 }), CFG(dir), store, deps(llm));
  let m = store.loadManifest();
  assert.equal(m.items[0].status, 'blocked', 'an engine error blocks the item with its reason');
  assert.match(m.items[0].blockedReason, /crash after the draft/);
  assert.ok(existsSync(join(dir, 'work', 'b1-01', 'draft.json')), 'the draft stage survived');
  const writes = () => llm.calls.filter((c) => c.stage === 'write').length;
  const before = writes();
  await runBatch(args({ only: 'b1-01' }), CFG(dir), store, deps(llm), );
  m = store.loadManifest();
  assert.equal(m.items[0].status, 'blocked', '--only never runs a blocked item');
  const r0 = store.runs()[0];
  assert.ok(r0.calls.length >= 2 && r0.calls.every((c) => c.articleId === 'b1-01'), 'the interrupted run persisted its calls');
  await runBatch(args({ retry: 'b1-01' }), CFG(dir), store, deps(llm));
  m = store.loadManifest();
  assert.equal(m.items[0].status, 'approved');
  assert.equal(writes(), before + 1, '--retry regenerates from scratch (cached stages are discarded)');
  const calls = llm.calls.length;
  await runBatch(args(), CFG(dir), store, deps(llm));
  assert.equal(store.loadManifest().items[1].status, 'approved');
  const again = llm.calls.length;
  await runBatch(args(), CFG(dir), store, deps(llm));
  assert.equal(llm.calls.length, again, 'nothing left to attempt: no model call');
  assert.ok(calls < again);
});

test('what an interrupted run paid counts against the article budget on retry', async () => {
  const dir = tempState([manifestItem(1)]);
  const store = new Store(dir);
  const r = store.newRun({});
  r.calls.push({ articleId: 'b1-01', stage: 'write', status: 'ok', in: 30000, out: 20000, cost: 0.3 }); // already over the $0.25 article cap
  r.attempted.push('b1-01');
  store.saveRun(r);
  const m = store.loadManifest();
  store.setStatus(m, m.items[0], 'blocked', { blockedReason: 'interrupted' });
  assert.equal(store.priorSpend('b1-01').costUsd, 0.3);
  const llm = happy();
  await runBatch(args({ retry: 'b1-01' }), CFG(dir), store, deps(llm));
  const it = store.loadManifest().items[0];
  assert.equal(it.status, 'blocked');
  assert.match(it.blockedReason, /budget exceeded .* including \$0\.300 from earlier runs/);
});

test('competitor claims are checked quote by quote against a page fetched once', async () => {
  const facts = { product: { facts: [], never: [] }, competitors: { claims: [
    { id: 'C07', competitor: 'Zoom', claim: 'a', quote: '40 minutes max per meeting', url: 'https://z.test/p', publisher: 'Zoom' },
    { id: 'C08', competitor: 'Zoom', claim: 'b', quote: '100 participants max per meeting', url: 'https://z.test/p', publisher: 'Zoom' },
    { id: 'C09', competitor: 'Zoom', claim: 'c', quote: 'Breakout rooms', url: 'https://z.test/other', publisher: 'Zoom' },
  ] } };
  let fetches = 0;
  const fetchImpl = async (url) => { fetches++; return new Response(url.endsWith('/p') ? '<p>Meetings: 40 minutes max per meeting on the free plan</p>' : 'nope', { status: 200 }); };
  const out = await verifiedClaims({ comparison: { competitors: ['Zoom'] } }, { facts, fetchImpl }, '2026-09-13');
  assert.deepEqual(out.map((c) => c.id), ['C07'], 'C08 shares the URL but its own quote is gone; C09 page lacks the quote');
  assert.equal(fetches, 2, 'one fetch per URL');
});

test('registered questions come from the validated headings, not the model metadata', () => {
  assert.deepEqual(questionHeadings(goodArticle().body), ['How do learners join a class without installing anything?']);
  assert.deepEqual(questionHeadings('## Plain heading\n\ntext\n\n### Is this a question?\n\nyes'), ['Is this a question?']);
});

test('a human block after a promotion pulls the article out of the publishable tree', () => {
  const dir = tempState([manifestItem(1, { status: 'approved' })]);
  const store = new Store(dir);
  const site = join(dir, 'fake-site');
  mkdirSync(site, { recursive: true });
  const promoted = join(site, 'test-article-1.md');
  writeFileSync(promoted, '---\ntitle: "t"\n---\nbody');
  const m = store.loadManifest();
  store.setStatus(m, m.items[0], 'approved', { sitePath: promoted, promotedAt: 'x' });
  blockItem(store, 'b1-01', 'invented mechanism');
  assert.equal(existsSync(promoted), false, 'the promoted file is gone from the site');
  assert.ok(existsSync(join(dir, 'drafts', 'blocked-test-article-1.md')));
  const it = store.loadManifest().items[0];
  assert.equal(it.status, 'blocked');
  assert.equal(it.sitePath, null);
  assert.ok(!PR_PATHS.some((p) => p.endsWith('content-engine')) && !PR_PATHS.some((p) => p.includes('analytics')), 'a content PR stages an allowlist, never the whole engine directory');
});

test('--retry refuses a non-blocked item before touching its artifacts; a rejudge that blocks pulls a promoted file', async () => {
  const dir = tempState([manifestItem(1, { status: 'approved' })]);
  const store = new Store(dir);
  store.saveWork('b1-01', 'draft.json', { title: 'keep me' });
  await assert.rejects(runBatch(args({ retry: 'b1-01' }), CFG(dir), store, deps(happy())), /applies to blocked items/);
  assert.deepEqual(store.loadWork('b1-01', 'draft.json'), { title: 'keep me' }, 'nothing was cleared');
  // rejudge of a promoted article that now fails a gate: the site file leaves the publishable tree
  const site = join(dir, 'fake-site');
  mkdirSync(site, { recursive: true });
  const promoted = join(site, 'test-article-1.md');
  writeFileSync(promoted, 'promoted');
  const m = store.loadManifest();
  store.setStatus(m, m.items[0], 'approved', { sitePath: promoted, promotedAt: 'x' });
  const bad = goodArticle({ title: 'Existing Title' });
  store.saveWork('b1-01', 'brief.json', { id: 'b1-01', title: 'T', slug: 'test-article-1', primaryQuery: 'q', secondaryQueries: [], searchIntent: 'i', audience: 'a', funnelStage: 'f', uniqueAngle: 'u', requiredOriginalInsights: ['x', 'y'], pillar: { name: 'P', url: '/virtual-classroom-software/' }, spokes: [], related: [], comparison: null, languageSpecifics: null, competitorClaims: [], optionalElements: [], typicalLength: '1200-2400' });
  store.saveWork('b1-01', 'edited.json', { ...bad, model: 'writer/model' });
  store.saveWork('b1-01', 'review.json', { issues: [], review: JSON.parse(reviewJSON({ total: 95 })) });
  const corpusWithDup = [...corpusDocs, { key: '/blog/existing-a/', kind: 'post', path: '/blog/existing-c/', title: 'Existing Title', description: 'd', headings: [], text: 'x' }];
  await rejudge('b1-01', CFG(dir), store, deps(happy(), { corpus: { docs: corpusWithDup, paths: EXISTING }, index: new TfIdf(corpusWithDup) }));
  const it = store.loadManifest().items[0];
  assert.equal(it.status, 'blocked');
  assert.equal(existsSync(promoted), false, 'the promoted file was pulled from the site');
  assert.equal(it.sitePath, null);
});

test('a promoted article is not a duplicate of its own page on rejudge', async () => {
  const dir = tempState([manifestItem(1, { status: 'approved', sitePath: 'promoted-elsewhere.md' })]);
  const store = new Store(dir);
  const own = goodArticle();
  store.saveWork('b1-01', 'brief.json', { id: 'b1-01', title: 'T', slug: 'test-article-1', primaryQuery: 'q', secondaryQueries: [], searchIntent: 'i', audience: 'a', funnelStage: 'f', uniqueAngle: 'u', requiredOriginalInsights: ['x', 'y'], pillar: { name: 'P', url: '/virtual-classroom-software/' }, spokes: [], related: [], comparison: null, languageSpecifics: null, competitorClaims: [], optionalElements: [], typicalLength: '1200-2400' });
  store.saveWork('b1-01', 'edited.json', { ...own, model: 'writer/model' });
  store.saveWork('b1-01', 'review.json', { issues: [], review: JSON.parse(reviewJSON({ total: 95 })) });
  const withOwn = [...corpusDocs, { key: '/blog/test-article-1/', kind: 'post', path: '/blog/test-article-1/', title: own.title, description: own.description, headings: [], text: `${own.title}. ${own.description}. ${own.body}` }]; // the full text, as loadCorpus stores it: similarity 1.0 without the exclusion
  await rejudge('b1-01', CFG(dir), store, deps(happy(), { corpus: { docs: withOwn, paths: new Set([...EXISTING, '/blog/test-article-1/']) }, index: new TfIdf(withOwn) }));
  assert.equal(store.loadManifest().items[0].status, 'approved');
});

test('two planned topics with one intent: the second is blocked against the first', async () => {
  const dir = tempState([manifestItem(1, { status: 'approved' }), manifestItem(2, { title: 'Test article 1 again', primaryQuery: 'test query 1', uniqueAngle: 'angle 1' })]);
  const store = new Store(dir);
  const manifest = store.loadManifest();
  const planned = manifest.items.map((it) => ({ key: `planned:${it.id}`, kind: 'planned', id: it.id, path: `/blog/${it.slug}/`, title: it.title, description: it.uniqueAngle, headings: [], text: [it.primaryQuery, it.searchIntent, it.uniqueAngle].join('. '), status: it.status }));
  const docs = [...corpusDocs, ...planned];
  const llm = fakeLLM({ intent: JSON.stringify({ results: [{ path: '/blog/test-article-1/', sameIntent: true, reason: 'same topic' }] }), write: envelope(goodArticle()), edit: envelope(goodArticle()), review: reviewJSON({ total: 95 }) });
  await runBatch(args(), CFG(dir), store, deps(llm, { corpus: { docs, paths: EXISTING }, index: new TfIdf(docs) }));
  const it = store.loadManifest().items[1];
  assert.equal(it.status, 'blocked');
  assert.equal(it.collision.path, '/blog/test-article-1/');
});

test('--fresh and --retry only accept manifest ids, never paths', async () => {
  const dir = tempState([manifestItem(1)]);
  const store = new Store(dir);
  assert.throws(() => store.clearWork('..'), /refusing/);
  assert.throws(() => store.clearWork('../manifest'), /refusing/);
  await assert.rejects(runBatch(args({ fresh: 'nope' }), CFG(dir), store, deps(happy())), /no manifest item nope/);
  assert.ok(existsSync(join(dir, 'manifest.json')), 'nothing was deleted');
});

test('an intent-check path the model invented never blocks an item', async () => {
  const dir = tempState([manifestItem(1, { title: 'What a server can see on an encrypted call', primaryQuery: 'what a server can see encrypted call', uniqueAngle: 'metadata versus content on an encrypted call' })]);
  const store = new Store(dir);
  const llm = fakeLLM({ intent: JSON.stringify({ results: [{ path: '/blog/ghost/', sameIntent: true, reason: 'made up' }] }), write: envelope(goodArticle()), edit: envelope(goodArticle()), review: reviewJSON({ total: 95 }) });
  await runBatch(args(), CFG(dir), store, deps(llm));
  assert.equal(store.loadManifest().items[0].status, 'approved');
  assert.ok(llm.calls.some((c) => c.stage === 'intent'), 'the intent check ran');
});

test('a claim the reviewer calls supported without a valid fact or source id is treated as unsupported', async () => {
  const dir = tempState([manifestItem(1)]);
  const store = new Store(dir);
  const bad = JSON.parse(reviewJSON({ total: 92 }));
  bad.claims.push({ text: 'translation runs in the browser', kind: 'ollasync', supported: true, ref: null });
  const llm = fakeLLM({ intent: '{"results":[]}', write: envelope(goodArticle()), edit: envelope(goodArticle()), repair: envelope(goodArticle()), review: (req, n) => (n === 1 ? JSON.stringify(bad) : reviewJSON({ total: 92 })) });
  await runBatch(args(), CFG(dir), store, deps(llm));
  assert.equal(store.loadManifest().items[0].status, 'approved');
  const rep = llm.calls.find((c) => c.stage === 'repair');
  assert.ok(rep && rep.user.includes('unreferenced ollasync claim') && rep.user.includes('translation runs in the browser'), 'the unreferenced claim went to repair');
});

test('a resumed item re-verifies its cached competitor claims', async () => {
  const dir = tempState([manifestItem(1, { status: 'drafting', comparison: { competitors: ['Zoom'] } })]);
  const store = new Store(dir);
  store.saveWork('b1-01', 'cannibalization.json', { near: [], results: [] });
  store.saveWork('b1-01', 'brief.json', { id: 'b1-01', title: 'Test article 1', slug: 'test-article-1', primaryQuery: 'q', secondaryQueries: [], searchIntent: 'i', audience: 'a', funnelStage: 'f', uniqueAngle: 'u', requiredOriginalInsights: ['x', 'y'], pillar: { name: 'P', url: '/virtual-classroom-software/' }, spokes: [], related: [], comparison: { competitors: ['Zoom'] }, languageSpecifics: null, competitorClaims: [{ id: 'C07', competitor: 'Zoom', claim: 'a', quote: 'gone from the page', url: 'https://z.test/p', publisher: 'Zoom', accessDate: '2026-01-01' }], optionalElements: [], typicalLength: '1200-2400' });
  let fetches = 0;
  const facts = { ...loadFacts(ENGINE_DIR), competitors: { claims: [{ id: 'C07', competitor: 'Zoom', claim: 'a', quote: 'gone from the page', url: 'https://z.test/p', publisher: 'Zoom' }] } };
  const llm = fakeLLM({ intent: '{"results":[]}', write: envelope(goodArticle()), edit: envelope(goodArticle()), repair: envelope(goodArticle()), review: reviewJSON({ total: 92 }) }); // a comparison item wants its fairness section → one repair
  await runBatch(args(), CFG(dir), store, deps(llm, { facts, fetchImpl: async () => { fetches++; return new Response('<p>nothing here</p>', { status: 200 }); } }));
  assert.equal(fetches, 1, 'the cached brief was re-verified');
  assert.deepEqual(store.loadWork('b1-01', 'brief.json').competitorClaims, [], 'the stale claim was dropped');
});

test('an interrupted run reports the totals of its persisted calls', () => {
  assert.deepEqual(runTotals({ calls: [{ in: 10, out: 5, cost: 0.01 }, { in: 20, out: 0, cost: 0.002, status: 'error' }], totals: { in: 0, out: 0, costUsd: 0 } }), { in: 30, out: 5, costUsd: 0.012 });
  assert.deepEqual(runTotals({ calls: [], totals: { in: 7, out: 3, costUsd: 0.5 } }), { in: 7, out: 3, costUsd: 0.5 });
});

test('the per-day cap counts every run: five attempts today → the next run does nothing', async () => {
  const dir = tempState(Array.from({ length: 5 }, (_, i) => manifestItem(i + 1)));
  const store = new Store(dir);
  const r = store.newRun({});
  r.attempted.push('a', 'b', 'c', 'd', 'e');
  store.saveRun(r);
  const llm = happy();
  await runBatch(args(), CFG(dir), store, deps(llm));
  assert.equal(llm.calls.length, 0);
});

test('a low review score blocks and keeps the draft; a 75–84 score gets exactly one repair, then approval or a block', async () => {
  const low = tempState([manifestItem(1)]);
  const s1 = new Store(low);
  const l1 = fakeLLM({ intent: '{"results":[]}', write: envelope(goodArticle()), edit: envelope(goodArticle()), review: reviewJSON({ total: 70 }) });
  await runBatch(args(), CFG(low), s1, deps(l1));
  assert.equal(s1.loadManifest().items[0].status, 'blocked');
  assert.match(s1.loadManifest().items[0].blockedReason, /70 < 75/);
  assert.ok(existsSync(join(low, 'drafts', 'blocked-test-article-1.md')), 'BLOCK_AND_KEEP_AS_DRAFT');
  assert.ok(!l1.calls.some((c) => c.stage === 'repair'));

  const mid = tempState([manifestItem(1)]);
  const s2 = new Store(mid);
  const l2 = fakeLLM({ intent: '{"results":[]}', write: envelope(goodArticle()), edit: envelope(goodArticle()), repair: envelope(goodArticle()), review: (req, n) => reviewJSON({ total: n === 1 ? 80 : 90 }) });
  await runBatch(args(), CFG(mid), s2, deps(l2));
  const it = s2.loadManifest().items[0];
  assert.equal(it.status, 'approved');
  assert.equal(it.qualityScore, 90);
  assert.equal(l2.calls.filter((c) => c.stage === 'repair').length, 1);
  assert.equal(l2.calls.filter((c) => c.stage === 'review').length, 2);
  assert.equal(s2.runs()[0].articles['b1-01'].repaired, true);

  const stuck = tempState([manifestItem(1)]);
  const s3 = new Store(stuck);
  const l3 = fakeLLM({ intent: '{"results":[]}', write: envelope(goodArticle()), edit: envelope(goodArticle()), repair: envelope(goodArticle()), review: reviewJSON({ total: 80 }) });
  await runBatch(args(), CFG(stuck), s3, deps(l3));
  assert.equal(s3.loadManifest().items[0].status, 'blocked', 'after a failed repair: blocked');
  assert.equal(l3.calls.filter((c) => c.stage === 'repair').length, 1, 'never a second repair');
});

test('an unsupported claim or a forbidden phrase forces the repair; a duplicate title blocks outright', async () => {
  const dir = tempState([manifestItem(1)]);
  const store = new Store(dir);
  const bad = goodArticle();
  bad.body += '\n\nLet\'s dive in.';
  const llm = fakeLLM({ intent: '{"results":[]}', write: envelope(bad), edit: envelope(bad), repair: envelope(goodArticle()), review: (req, n) => reviewJSON({ total: 90, unsupported: n === 1 ? ['Ollasync is SOC 2 certified'] : [] }) });
  await runBatch(args(), CFG(dir), store, deps(llm));
  assert.equal(store.loadManifest().items[0].status, 'approved');
  const rep = llm.calls.find((c) => c.stage === 'repair');
  assert.ok(rep && rep.user.includes('[FORBIDDEN_PHRASE]') && rep.user.includes('[UNSUPPORTED 1 ollasync]'));

  const dup = tempState([manifestItem(1)]);
  const s2 = new Store(dup);
  const l2 = fakeLLM({ intent: '{"results":[]}', write: envelope(goodArticle({ title: 'What a server can see' })), edit: envelope(goodArticle({ title: 'What a server can see' })), review: reviewJSON({ total: 95 }) });
  await runBatch(args(), CFG(dup), s2, deps(l2));
  assert.equal(s2.loadManifest().items[0].status, 'blocked');
  assert.ok(!l2.calls.some((c) => c.stage === 'repair'), 'a blocker is not repaired');
});

test('cannibalization: a lexical neighbour triggers the intent check, and same intent blocks with the page to expand', async () => {
  const dir = tempState([manifestItem(1, { title: 'What a server can see on an encrypted call', primaryQuery: 'what a server can see encrypted call', uniqueAngle: 'metadata versus content on an encrypted call' })]);
  const store = new Store(dir);
  const llm = fakeLLM({ intent: JSON.stringify({ results: [{ path: '/blog/existing-a/', sameIntent: true, reason: 'identical question' }] }), write: envelope(goodArticle()), edit: envelope(goodArticle()), review: reviewJSON({ total: 95 }) });
  await runBatch(args(), CFG(dir), store, deps(llm));
  const it = store.loadManifest().items[0];
  assert.equal(it.status, 'blocked');
  assert.match(it.blockedReason, /expand that page/);
  assert.equal(it.collision.path, '/blog/existing-a/');
  assert.deepEqual(llm.calls.map((c) => c.stage), ['intent'], 'no draft was paid for');
  const pre = tempState([manifestItem(2, { status: 'blocked', collision: { path: '/x/', decision: 'consolidate', reason: 'r' }, blockedReason: 'r' })]);
  const s2 = new Store(pre);
  const l2 = happy();
  await runBatch(args(), CFG(pre), s2, deps(l2));
  assert.equal(l2.calls.length, 0, 'a pre-marked collision is never attempted');
});

test('preflight refuses to run on a model over the ceiling, and the run record says so', async () => {
  const dir = tempState([manifestItem(1)]);
  const store = new Store(dir);
  const llm = happy();
  const code = await runBatch(args(), CFG(dir, { OPENROUTER_MODEL_CONTENT: 'google/gemini-3.1-flash-lite' }), store, deps(llm, { pricing: { ...PRICING, 'google/gemini-3.1-flash-lite': { prompt: 0.25, completion: 1.5 } } }));
  assert.equal(code, 3);
  assert.equal(llm.calls.length, 0);
  assert.equal(store.runs()[0].refused.reason, 'preflight');
  assert.equal(store.loadManifest().items[0].status, 'planned');
});

test('insight sections come from the writer and the reviewer, de-duplicated, with unknown fact ids dropped', () => {
  const body = goodArticle().body;
  const merged = mergeInsights({ body, insights: [{ heading: 'The hour after class', factIds: ['F11', 'F99'] }, { heading: 'Renamed away by the editor', factIds: ['F02'] }] }, { insightSections: [{ heading: 'The Hour After Class', factIds: ['F12'] }, { heading: 'Five languages in a session', factIds: ['F02'] }, { heading: 'Section 0', factIds: ['F11'] }] }, new Set(['F02', 'F11', 'F12']));
  assert.deepEqual(merged, [{ heading: 'The hour after class', factIds: ['F11', 'F12'] }, { heading: 'Five languages in one session', factIds: ['F02'] }], 'stale writer headings and phantom reviewer sections are dropped; a paraphrase resolves to the real heading');
});

test('--rejudge re-applies the current gates to the stored draft without a model call', async () => {
  const dir = tempState([manifestItem(1)]);
  const store = new Store(dir);
  const bad = goodArticle();
  bad.body += '\n\nLet\'s dive in.'; // a forbidden phrase the fake repair does not remove → blocked after repair
  const llm = fakeLLM({ intent: '{"results":[]}', write: envelope(bad), edit: envelope(bad), repair: envelope(bad), review: reviewJSON({ total: 90 }) });
  await runBatch(args(), CFG(dir), store, deps(llm));
  assert.equal(store.loadManifest().items[0].status, 'blocked');
  const calls = llm.calls.length;
  // the stored repair.json is what gets re-judged: replace it with a clean article, as a tuned gate would see it
  store.saveWork('b1-01', 'repair.json', { ...goodArticle(), model: 'writer/model' });
  await rejudge('b1-01', CFG(dir), store, deps(llm));
  const it = store.loadManifest().items[0];
  assert.equal(it.status, 'approved');
  assert.equal(it.rejudged, true);
  assert.equal(llm.calls.length, calls, 'no model call');
  assert.ok(existsSync(join(dir, 'drafts', 'test-article-1.md')) && !existsSync(join(dir, 'drafts', 'blocked-test-article-1.md')));
  assert.equal(store.runs().length, 1, 'no attempt recorded');
});

test('the run budget stops the run between articles and records why', async () => {
  const dir = tempState([manifestItem(1), manifestItem(2)]);
  const store = new Store(dir);
  const llm = happy();
  await runBatch(args(), CFG(dir, { MAX_COST_PER_RUN_USD: '0.002' }), store, deps(llm));
  const run = store.runs()[0];
  assert.equal(run.attempted.length, 1);
  assert.match(run.stopped, /run budget/);
  assert.equal(store.loadManifest().items[1].status, 'planned');
  assert.equal(readdirSync(join(dir, 'drafts')).length, 1);
});

// ── Codex round 4 ──────────────────────────────────────────────────────────────────────────────────────────
test('a setup failure (pricing unreachable) leaves a run record that says so', async () => {
  const dir = tempState([manifestItem(1)]);
  const store = new Store(dir);
  const code = await runBatch(args(), CFG(dir), store, async () => { throw new Error('pricing endpoint down'); });
  assert.equal(code, 3);
  const r = store.runs()[0];
  assert.equal(r.refused.reason, 'setup');
  assert.match(r.refused.problems[0], /pricing endpoint down/);
  assert.ok(r.finished);
  assert.equal(store.loadManifest().items[0].status, 'planned');
});

test('a successful --retry retires the earlier blocked draft', async () => {
  const dir = tempState([manifestItem(1, { status: 'blocked', blockedReason: 'x' })]);
  const store = new Store(dir);
  writeFileSync(join(dir, 'drafts', 'blocked-test-article-1.md'), 'rejected copy');
  await runBatch(args({ retry: 'b1-01' }), CFG(dir), store, deps(happy()));
  assert.equal(store.loadManifest().items[0].status, 'approved');
  assert.ok(existsSync(join(dir, 'drafts', 'test-article-1.md')));
  assert.equal(existsSync(join(dir, 'drafts', 'blocked-test-article-1.md')), false, 'no rejected copy travels with the approved article');
});

const fakeSite = (dir) => {
  const site = join(dir, 'site');
  const blog = join(site, 'src', 'content', 'blog');
  mkdirSync(blog, { recursive: true });
  return { site, blog };
};

test('--publish pr promotes into the site, back-links an older post, and records the site path', async () => {
  const dir = tempState([manifestItem(1)]);
  const store = new Store(dir);
  const { site, blog } = fakeSite(dir);
  writeFileSync(join(blog, 'existing-a.md'), '---\ntitle: "What a server can see"\npubDate: 2026-01-01\n---\nbody\n');
  await runBatch(args({ dryRun: false, publish: 'pr' }), CFG(dir), store, deps(happy(), { siteDir: site }));
  const it = store.loadManifest().items[0];
  assert.equal(it.status, 'approved', it.blockedReason);
  assert.equal(it.sitePath, join(blog, 'test-article-1.md'));
  assert.ok(it.promotedAt);
  assert.ok(existsSync(it.sitePath) && !existsSync(join(dir, 'drafts', 'test-article-1.md')), 'the draft moved into the site');
  const older = readFileSync(join(blog, 'existing-a.md'), 'utf8');
  assert.match(older, /^related: \["test-article-1"\]$/m);
  assert.match(older, /^updatedDate: \d{4}-\d{2}-\d{2}$/m);
});

test('a failure after the promotion pulls the article back out of the publishable tree', async () => {
  const dir = tempState([manifestItem(1)]);
  const store = new Store(dir);
  const { site, blog } = fakeSite(dir);
  mkdirSync(join(blog, 'existing-a.md')); // a directory where addBacklinks expects a post: the back-link step throws EISDIR
  await runBatch(args({ dryRun: false, publish: 'pr' }), CFG(dir), store, deps(happy(), { siteDir: site }));
  const it = store.loadManifest().items[0];
  assert.equal(it.status, 'blocked');
  assert.match(it.blockedReason, /engine error/);
  assert.equal(it.sitePath, null);
  assert.equal(existsSync(join(blog, 'test-article-1.md')), false, 'nothing of the article remains in src/content/blog');
  assert.ok(existsSync(join(dir, 'drafts', 'blocked-test-article-1.md')), 'the article is kept as the blocked draft');
});

test('stage costs include billed failures so the stage columns add up to the article total', () => {
  const ledger = [
    { articleId: 'x', stage: 'write', task: 'content_writer', route: 'openrouter', model: 'a', in: 1000, out: 5000, cost: 0.002, status: 'error', error: 'truncated' },
    { articleId: 'x', stage: 'write', task: 'content_writer', route: 'openrouter', model: 'b', in: 1000, out: 500, cost: 0.001, status: 'ok' },
    { articleId: 'y', stage: 'write', task: 'content_writer', route: 'openrouter', model: 'b', in: 1, out: 1, cost: 0.001, status: 'ok' },
  ];
  const s = stageCosts(ledger, 'x');
  assert.equal(s.write.costUsd, 0.003);
  assert.equal(s.write.in, 2000);
  assert.equal(s.write.out, 5500);
});

test('the report average counts every article a model was called for, gateway-served ($0) ones included', async () => {
  const dir = tempState([manifestItem(1), manifestItem(2)]);
  const store = new Store(dir);
  const run = store.newRun({});
  run.attempted = ['b1-01', 'b1-02', 'b1-03'];
  run.articles = {
    'b1-01': { status: 'approved', costUsd: 0.01, tokens: { in: 1, out: 1 }, stages: { write: { in: 1, out: 1, costUsd: 0.01, model: 'm', route: 'openrouter' } } },
    'b1-02': { status: 'approved', costUsd: 0, tokens: { in: 1, out: 1 }, stages: { write: { in: 1, out: 1, costUsd: 0, model: 'g', route: 'gateway' } } },
    'b1-03': { status: 'blocked', reason: 'covered by an existing page', costUsd: 0, tokens: { in: 0, out: 0 }, stages: {} },
  };
  run.finished = new Date().toISOString();
  store.saveRun(run);
  const text = await report(store, CFG(dir), { live: false });
  assert.match(text, /Average cost per attempted article: \$0\.0050 over 2 article\(s\)/);
});

test('the Sources section carries the claims the reviewer relied on, not only the ones the writer listed', async () => {
  const dir = tempState([manifestItem(1, { comparison: { competitors: ['Zoom'], requireWhenBetter: true } })]);
  const store = new Store(dir);
  const facts = loadFacts(ENGINE_DIR);
  facts.competitors = { claims: [{ id: 'C07', competitor: 'Zoom', claim: 'Free meetings stop at 40 minutes', quote: '40 minutes max per meeting', url: 'https://z.test/p', publisher: 'Zoom' }] };
  const fair = goodArticle();
  fair.body += '\n\n## When Zoom is the better choice\n\nIf the sessions are internal status meetings inside a suite the team already pays for, the suite is the better choice, and a classroom adds nothing.';
  const llm = fakeLLM({ intent: '{"results":[]}', write: envelope(fair), edit: envelope(fair), review: reviewJSON({ total: 92, claims: [{ text: 'Zoom free meetings stop at 40 minutes', kind: 'competitor', supported: true, ref: 'C07' }] }) });
  await runBatch(args(), CFG(dir), store, deps(llm, { facts, fetchImpl: async () => new Response('<p>Meetings: 40 minutes max per meeting on the free plan</p>', { status: 200 }) }));
  const it = store.loadManifest().items[0];
  assert.equal(it.status, 'approved', it.blockedReason);
  assert.deepEqual(it.sources, ['C07']);
  const draft = readFileSync(join(dir, 'drafts', 'test-article-1.md'), 'utf8');
  assert.ok(draft.includes('https://z.test/p') && draft.includes('Free meetings stop at 40 minutes'), 'the frontmatter carries the reviewer-referenced source');
});
