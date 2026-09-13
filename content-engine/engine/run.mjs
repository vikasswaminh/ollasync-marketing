#!/usr/bin/env node
// The pipeline runner. One item at a time, in the policy's order:
//   select → cannibalization → product context → competitor claims (live-checked) → brief → writer → editor pass →
//   deterministic gates → independent review → (one repair pass) → originality → publish step → run record.
// State is the manifest; every stage persists its artifact under work/<id>/ so an interrupted run resumes without
// paying for what it already produced. Blocked articles are kept as drafts and never retried unless asked.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync, unlinkSync, renameSync } from 'node:fs';
import { parseArgs, loadConfig, ENGINE_DIR, SITE_DIR, REPO_DIR, PILLARS, POLICY, istDate } from './config.mjs';
import { Store, selectItems } from './state.mjs';
import { LLM, fetchPricing, preflight, CeilingError } from './llm.mjs';
import { loadCorpus, TfIdf, noLeakPatterns, loadFacts, htmlText } from './corpus.mjs';
import { deterministicGates, hasBlockers, needsRepair, parseArticle, matchHeading } from './gates.mjs';
import { productContext, buildBrief, briefText, writerPrompt, editorPrompt, reviewerPrompt, repairPrompt, intentPrompt, parseMetaBody, parseJSON, verdictFor } from './stages.mjs';
import { articleFile, writeDraft, promote, addBacklinks, openPr } from './publish.mjs';
import { report } from './report.mjs';

const SIMILARITY_BLOCK = POLICY.cannibalization_and_duplicate_protection.semantic_similarity_block_threshold; // 0.82
const INTENT_CHECK_MIN = 0.05; // batch-1 calibration: brief-vs-page TF-IDF scores sit at 0.04–0.16 even for true neighbours, so the top three always get the (cheap) intent check unless nothing is lexically related at all

export async function main(argv = process.argv.slice(2), env = process.env) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log('node engine/run.mjs [--dry-run] [--batch N] [--limit N] [--only ID] [--retry ID] [--fresh ID] [--publish none|pr] [--promote ID] [--open-pr] [--report]');
    return 0;
  }
  const cfg = loadConfig(env);
  const store = new Store(cfg.stateDir);
  if (!store.lock()) { // every mode below reads and rewrites the manifest or the drafts — never concurrently with a run
    console.error('another run holds the lock (content-engine/.lock)');
    return 2;
  }
  try {
    return await dispatch(args, cfg, store);
  } finally {
    store.unlock();
  }
}

async function dispatch(args, cfg, store) {
  if (args.report) {
    console.log(await report(store, cfg));
    return 0;
  }
  if (args.block) {
    if (!args.reason) throw new Error('--block needs --reason "why"');
    const it = blockItem(store, args.block, args.reason);
    console.log(`[${it.id}] blocked by human review — ${args.reason}`);
    return 0;
  }
  if (args.rejudge) {
    const store2 = store;
    const code = await rejudge(args.rejudge, cfg, store2, buildDeps, args);
    return code;
  }
  if (args.promote) {
    const m = store.loadManifest();
    const it = store.item(m, args.promote);
    if (it.status !== 'approved') throw new Error(`${it.id} is ${it.status}, not approved`);
    const dest = promote(store, SITE_DIR, it.slug, istDate());
    store.setStatus(m, it, 'approved', { promotedAt: new Date().toISOString(), sitePath: dest });
    console.log(`promoted ${it.id} → ${dest} (status stays approved until the URL is live; --report flips it to published)`);
    return 0;
  }
  if (args.openPr) {
    const m = store.loadManifest();
    const day = istDate();
    const r = openPr(REPO_DIR, { branch: `content/${day}`, title: `content: articles of ${day}`, body: `Content engine run of ${day}. See marketing-site/content-engine/runs/.\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)`, paths: PR_PATHS });
    console.log(`PR: ${r.url || '-'} (${r.note})`);
    void m;
    return 0;
  }
  return runBatch(args, cfg, store, buildDeps);
}

/** what a content PR may carry: articles and the engine's editorial records — never analytics exports or work artifacts */
export const PR_PATHS = ['marketing-site/src/content/blog', 'marketing-site/content-engine/manifest.json', 'marketing-site/content-engine/questions.json', 'marketing-site/content-engine/runs', 'marketing-site/content-engine/drafts', 'marketing-site/content-engine/reports'];

/** Real dependencies; tests pass fakes with the same shape. */
export async function buildDeps(cfg, store, args, manifest) {
  const pricing = cfg.openrouter.enabled ? await fetchPricing(cfg, { cacheDir: store.dir }) : {};
  const facts = loadFacts(ENGINE_DIR);
  const corpus = loadCorpus({ distDir: cfg.distDir, blogSrcDir: join(SITE_DIR, 'src', 'content', 'blog'), manifest, warn: (m) => console.error(`warn: ${m}`) });
  return {
    pricing,
    facts,
    corpus,
    index: new TfIdf(corpus.docs),
    leakPatterns: noLeakPatterns(join(REPO_DIR, 'scripts', 'mkt_no_leak.sh')),
    llm: new LLM(cfg, { pricing }),
    fetchImpl: fetch,
    now: () => Date.now(),
    siteDir: SITE_DIR, // where promote/addBacklinks write; tests point it at a temporary site
  };
}

export async function runBatch(args, cfg, store, deps) {
  const manifest = store.loadManifest();
  const run = store.newRun({ ...args }); // the record exists before anything can fail, so a run that produced nothing still says why
  let d;
  try {
    d = typeof deps === 'function' ? await deps(cfg, store, args, manifest) : deps;
  } catch (e) {
    run.refused = { reason: 'setup', problems: [e.message] };
    run.finished = new Date().toISOString();
    store.saveRun(run);
    console.error(`refusing to run: setup failed: ${e.message}`);
    return 3;
  }
  const pf = preflight(cfg, d.pricing);
  if (!pf.ok) {
    run.refused = { reason: 'preflight', problems: pf.problems };
    run.finished = new Date().toISOString();
    store.saveRun(run);
    console.error(`refusing to run:\n  ${pf.problems.join('\n  ')}`);
    return 3;
  }
  run.models = pf.models;
  d.llm.onRecord = (row) => { // the ledger reaches the run record after EVERY call, so an interrupted run still shows what it paid
    run.calls.push(row);
    store.saveRun(run);
  };
  if (args.retry && store.item(manifest, args.retry).status !== 'blocked') throw new Error(`${args.retry} is ${store.item(manifest, args.retry).status}; --retry applies to blocked items`); // checked before anything is cleared
  for (const id of [args.fresh, args.retry].filter(Boolean)) {
    store.item(manifest, id); // an unknown id throws before anything is deleted
    store.clearWork(id); // --fresh discards cached stages; --retry regenerates a blocked item from scratch, never a replay
  }
  const items = selectItems(manifest, args, store.attemptsOn(istDate()));
  if (!items.length) {
    run.finished = new Date().toISOString();
    store.saveRun(run);
    console.log('nothing to do (no planned items match, or today\'s attempt cap is reached)');
    return 0;
  }
  const t0 = d.now();
  const sameRun = { titles: new Set(), slugs: new Set(), texts: [] };
  for (const item of items) {
    const spent = d.llm.totals().costUsd;
    if (spent >= cfg.budgets.maxCostPerRunUsd) {
      run.stopped = `run budget reached ($${spent.toFixed(3)} ≥ $${cfg.budgets.maxCostPerRunUsd})`;
      break;
    }
    if ((d.now() - t0) / 60000 >= cfg.budgets.maxRunMinutes) {
      run.stopped = `run time budget reached (${cfg.budgets.maxRunMinutes} min)`;
      break;
    }
    run.attempted.push(item.id);
    store.saveRun(run);
    let result;
    try {
      result = await processItem(item, manifest, { args, cfg, store, d, sameRun, run });
    } catch (e) {
      const ceiling = e instanceof CeilingError;
      result = { status: 'blocked', reason: `${ceiling ? 'price ceiling' : 'engine error'}: ${e.message}` };
      pullFromSite(store, item); // a failure after the promotion: the file leaves src/content/blog and becomes the blocked draft
      store.setStatus(manifest, item, 'blocked', { blockedReason: result.reason, sitePath: null, promotedAt: null });
      if (ceiling) run.stopped = result.reason;
      else console.error(`[${item.id}] ${e.stack || e}`);
    }
    const tot = d.llm.totals(item.id);
    item.cost = Number(((item.cost || 0) + tot.costUsd).toFixed(4));
    store.saveManifest(manifest);
    run.articles[item.id] = { slug: item.slug, title: item.title, status: result.status, reason: result.reason || null, score: result.score ?? null, repaired: !!result.repaired, tokens: { in: tot.in, out: tot.out }, costUsd: Number(tot.costUsd.toFixed(4)), stages: stageCosts(d.llm.ledger, item.id), draft: result.draftPath || null };
    if (result.status === 'approved') run.approved.push(item.id);
    else run.blocked.push(item.id);
    store.saveRun(run);
    console.log(`[${item.id}] ${result.status}${result.score != null ? ` score=${result.score}` : ''}${result.reason ? ` — ${result.reason}` : ''} ($${tot.costUsd.toFixed(4)}, ${tot.in}+${tot.out} tokens)`);
    if (run.stopped) break;
  }
  const t = d.llm.totals();
  run.totals = { in: t.in, out: t.out, costUsd: Number(t.costUsd.toFixed(4)), calls: t.calls };
  run.finished = new Date().toISOString();
  store.saveRun(run);
  console.log(`run ${run.id}: attempted ${run.attempted.length}, approved ${run.approved.length}, blocked ${run.blocked.length}, $${run.totals.costUsd} (${run.totals.in} in / ${run.totals.out} out)${run.stopped ? ` — stopped: ${run.stopped}` : ''}`);
  return 0;
}

/** per-stage tokens and cost for one article, billed failures included (an empty or truncated reply is paid for in
 *  the stage it happened in, so the stage columns add up to the article total) */
export function stageCosts(ledger, id) {
  const out = {};
  for (const l of ledger.filter((x) => x.articleId === id && (x.status === 'ok' || (x.in || 0) + (x.out || 0) > 0 || (x.cost || 0) > 0))) {
    const k = l.stage || l.task;
    out[k] = out[k] || { in: 0, out: 0, costUsd: 0, model: l.model, route: l.route };
    out[k].in += l.in || 0;
    out[k].out += l.out || 0;
    out[k].costUsd = Number((out[k].costUsd + (l.cost || 0)).toFixed(5));
  }
  return out;
}

async function stage(store, id, name, produce) {
  const cached = store.loadWork(id, name);
  if (cached) return cached;
  const v = await produce();
  store.saveWork(id, name, v);
  return v;
}

/** The per-item pipeline. Returns { status, reason?, score?, repaired?, draftPath? }. */
export async function processItem(item, manifest, { args, cfg, store, d, sameRun, run }) {
  const id = item.id;
  const pillar = PILLARS[item.primaryPillar];
  if (!pillar) return block(store, manifest, item, `unknown pillar ${item.primaryPillar}`);
  const today = istDate();
  const prior = store.priorSpend(id, run?.id); // what earlier (interrupted or repeated) runs already paid for this item
  const budgetOK = () => {
    const t = d.llm.totals(id);
    const cost = t.costUsd + prior.costUsd;
    const tokens = t.in + t.out + prior.tokens;
    if (cost > cfg.budgets.maxCostPerArticleUsd) throw new Error(`article budget exceeded ($${cost.toFixed(3)} including $${prior.costUsd.toFixed(3)} from earlier runs)`);
    if (tokens > cfg.budgets.maxTokensPerArticle) throw new Error(`article token budget exceeded (${tokens} including ${prior.tokens} from earlier runs)`);
  };
  const ctx = { productContext: productContext(d.facts) };

  // 1. cannibalization — the manifest lint may already have decided
  if (item.collision?.decision === 'consolidate') return block(store, manifest, item, `covered by ${item.collision.path} — expand that page instead`);
  const plannedText = [item.title, item.primaryQuery, ...(item.secondaryQueries || []), item.searchIntent, item.uniqueAngle].join('. ');
  const cann = await stage(store, id, 'cannibalization.json', async () => {
    const near = d.index.similar(plannedText, 6, (doc) => doc.key === `planned:${id}`); // every built page and every OTHER manifest topic, planned or done: two planned topics with one intent must not both be written
    const candidates = near.filter((n) => n.score >= INTENT_CHECK_MIN).slice(0, 3);
    if (!candidates.length) return { near: near.map((n) => ({ path: n.doc.path, score: +n.score.toFixed(3) })), results: [] };
    const r = await d.llm.chat({ task: 'content_reviewer', stage: 'intent', articleId: id, ...intentPrompt(buildBrief(item, { pillarUrl: pillar.url, pillarName: pillar.name }), candidates.map((c) => c.doc)), maxTokens: 800, temperature: 0.1 });
    const j = parseJSON(r.content);
    const known = new Set(candidates.map((c) => c.doc.path));
    return { near: near.map((n) => ({ path: n.doc.path, score: +n.score.toFixed(3) })), results: (j.results || []).filter((x) => known.has(x.path)).map((x) => ({ ...x, score: candidates.find((c) => c.doc.path === x.path)?.score })) }; // a path the model invented can never block an item
  });
  const same = cann.results.find((r) => r.sameIntent === true);
  if (same) {
    item.collision = { path: same.path, decision: 'consolidate', reason: same.reason };
    return block(store, manifest, item, `same search intent as ${same.path} (${same.reason}) — expand that page instead of a new URL`);
  }

  // 2. brief: related links from the corpus, live-checked competitor claims
  store.setStatus(manifest, item, 'researching');
  const brief = await stage(store, id, 'brief.json', async () => {
    const related = d.index.similar(plannedText, 8, (doc) => doc.kind === 'planned' || doc.path === '/blog/' || doc.path === '/').filter((n) => n.doc.kind === 'post' || n.doc.kind === 'page').slice(0, 5).map((n) => ({ path: n.doc.path, title: n.doc.title, description: n.doc.description }));
    const claims = await verifiedClaims(item, d, today);
    return buildBrief(item, { pillarUrl: pillar.url, pillarName: pillar.name, spokes: pillar.spokes, related, competitorClaims: claims });
  });
  await refreshClaims(brief, item, d, store, today); // a cached brief never carries yesterday's verification

  // 3. write, 4. editor pass
  store.setStatus(manifest, item, 'drafting');
  const draft = await stage(store, id, 'draft.json', async () => {
    const r = await d.llm.chat({ task: 'content_writer', stage: 'write', articleId: id, ...writerPrompt(brief, ctx), maxTokens: 5000, temperature: cfg.writerTemperature });
    store.saveWork(id, 'draft.raw.txt', r.content);
    budgetOK();
    return { ...parseMetaBody(r.content), model: r.model };
  });
  const edited = await stage(store, id, 'edited.json', async () => {
    const r = await d.llm.chat({ task: 'content_writer', stage: 'edit', articleId: id, ...editorPrompt(draft, brief, ctx), maxTokens: 5000, temperature: 0.3 }); // the writer's route: the reviewer must never score text it edited
    store.saveWork(id, 'edited.raw.txt', r.content);
    budgetOK();
    return { ...parseMetaBody(r.content), model: r.model };
  });

  // 5. gates + review, one repair pass, gates + review again
  const gateCtx = gateContext(item, manifest, brief, pillar, d, store, sameRun);
  store.setStatus(manifest, item, 'review');
  let article = edited;
  let evalr = await stage(store, id, 'review.json', () => evaluate(article, brief, gateCtx, ctx, d, id, budgetOK));
  let repaired = false;
  let decision = decide(evalr);
  if (decision === 'REPAIR' && cfg.maxRepairPasses >= 1) {
    store.setStatus(manifest, item, 'repair');
    article = await stage(store, id, 'repair.json', async () => {
      const r = await d.llm.chat({ task: 'content_writer', stage: 'repair', articleId: id, ...repairPrompt(article, brief, evalr.issues, evalr.review, ctx), maxTokens: 5000, temperature: 0.3 });
      store.saveWork(id, 'repair.raw.txt', r.content);
      budgetOK();
      return { ...parseMetaBody(r.content), model: r.model };
    });
    repaired = true;
    evalr = await stage(store, id, 'review2.json', () => evaluate(article, brief, gateCtx, ctx, d, id, budgetOK));
    decision = decide(evalr);
    if (decision === 'REPAIR') decision = 'BLOCK'; // after_failed_repair: BLOCK_AND_KEEP_AS_DRAFT
  }
  const score = evalr.review?.total ?? null;
  const summary = evalr.issues.filter((i) => i.severity !== 'warn').map((i) => `${i.code}: ${i.msg}`).slice(0, 8).join('; ');
  const cited = citedSources(article, evalr.review, brief);
  const fileText = articleFile(item, article, { pubDate: today, sources: cited.map((c) => ({ url: c.url, publisher: c.publisher, accessDate: c.accessDate, claim: c.claim })), related: relatedSlugs(article) });
  if (decision === 'BLOCK') {
    const p = writeDraft(store, item.slug, fileText, { blocked: true });
    const reason = score !== null && score < 75 ? `review score ${score} < 75` : repaired ? `still failing after the repair pass (${score !== null ? `score ${score}; ` : ''}${summary || 'blockers'})` : summary || `review score ${score}`;
    return { ...block(store, manifest, item, reason, { qualityScore: score, writerModel: draft.model, reviewerModel: evalr.review?.model || null }), score, repaired, draftPath: p };
  }

  // 6. originality on the final text (the policy's 0.82 block) — against the site and this run's other drafts
  const finalText = `${article.title}. ${article.description}. ${article.body}`;
  const dup = d.index.similar(finalText, 1, (doc) => doc.kind === 'planned')[0];
  if (dup && dup.score >= SIMILARITY_BLOCK) {
    const p = writeDraft(store, item.slug, fileText, { blocked: true });
    return { ...block(store, manifest, item, `near-duplicate of ${dup.doc.path} (similarity ${dup.score.toFixed(2)})`, { qualityScore: score }), score, repaired, draftPath: p };
  }
  for (const t of sameRun.texts) {
    const v = new TfIdf([{ title: '', description: '', headings: [], text: t }]);
    const s = TfIdf.cosine(v.vector(t), v.vector(finalText));
    if (s >= SIMILARITY_BLOCK) {
      const p = writeDraft(store, item.slug, fileText, { blocked: true });
      return { ...block(store, manifest, item, `near-duplicate of another article of this run (similarity ${s.toFixed(2)})`, { qualityScore: score }), score, repaired, draftPath: p };
    }
  }

  // 7. approved: draft file (dry run) or into the site (pr). A rejected copy from an earlier attempt retires. The
  //    manifest learns the site path BEFORE the fallible follow-up work; a failure after the promotion is caught by
  //    runBatch, which pulls the file back out of the publishable tree.
  const stale = join(store.draftsDir, `blocked-${item.slug}.md`);
  if (existsSync(stale)) unlinkSync(stale);
  let draftPath = writeDraft(store, item.slug, fileText);
  let sitePath = null;
  if (args.publish === 'pr') {
    sitePath = promote(store, d.siteDir || SITE_DIR, item.slug, today);
    draftPath = sitePath;
  }
  store.setStatus(manifest, item, 'approved', { qualityScore: score, writerModel: draft.model, reviewerModel: evalr.review?.model || null, finalTitle: article.title, approvedAt: new Date().toISOString(), sitePath, ...(sitePath ? { promotedAt: new Date().toISOString() } : {}), blockedReason: null, collision: item.collision || null, sources: cited.map((c) => c.id) });
  if (sitePath) addBacklinks(d.siteDir || SITE_DIR, item.slug, relatedSlugs(article), today);
  store.addQuestions(item.slug, questionHeadings(article.body)); // the validated headings, not the model's META list
  sameRun.titles.add(article.title.toLowerCase());
  sameRun.slugs.add(item.slug);
  sameRun.texts.push(finalText);
  return { status: 'approved', score, repaired, draftPath };
}

function gateContext(item, manifest, brief, pillar, d, store, sameRun) {
  return {
    item,
    pillarUrl: pillar.url,
    existingPaths: d.corpus.paths,
    allowedSlugs: new Set([...manifest.items.filter((x) => x.status === 'published').map((x) => x.slug), ...sameRun.slugs]),
    existingTitles: new Map(d.corpus.docs.filter((x) => x.kind !== 'planned' && x.path !== `/blog/${item.slug}/`).map((x) => [x.title.toLowerCase(), x.path])), // the item's own page (after a promotion) is not a duplicate of itself
    sameRunTitles: sameRun.titles,
    forbidden: POLICY.editorial_voice_policy.forbidden_phrases_and_patterns,
    leakPatterns: d.leakPatterns,
    factIds: new Set(d.facts.product.facts.map((f) => f.id)),
    sourceUrls: new Set(brief.competitorClaims.map((c) => c.url)),
    registry: store.questions().questions.filter((x) => x.slug !== item.slug).map((x) => x.q),
    relatedCandidates: brief.related.length,
    plannedLinks: brief.plannedLinks || item.internalLinkTargets || [],
  };
}

/**
 * --rejudge <id>: apply the CURRENT deterministic gates to the item's last evaluated draft together with its stored
 * review. No model call, no attempt counted. Approves only when every gate passes and the stored score allows it;
 * otherwise refreshes the blocked reason. Used after a gate is tuned, so a good article is not re-generated.
 */
export async function rejudge(id, cfg, store, deps, args = {}) {
  const manifest = store.loadManifest();
  const item = store.item(manifest, id);
  if (!['blocked', 'approved'].includes(item.status)) throw new Error(`${id} is ${item.status}; --rejudge applies to blocked or approved items`);
  const d = typeof deps === 'function' ? await deps(cfg, store, args, manifest) : deps;
  const article = store.loadWork(id, 'repair.json') || store.loadWork(id, 'edited.json');
  const ev = store.loadWork(id, 'review2.json') || store.loadWork(id, 'review.json');
  const brief = store.loadWork(id, 'brief.json');
  if (!article || !ev || !brief) throw new Error(`${id}: no stored draft/review/brief to re-judge (work/${id}/)`);
  const pillar = PILLARS[item.primaryPillar];
  await refreshClaims(brief, item, d, store, istDate());
  const sameRun = { titles: new Set(), slugs: new Set(), texts: [] };
  const gateCtx = gateContext(item, manifest, brief, pillar, d, store, sameRun);
  const insights = mergeInsights(article, ev.review, gateCtx.factIds);
  const issues = deterministicGates({ ...article, insights }, gateCtx);
  for (const c of ev.review.claims || []) if (c.supported === false && c.kind !== 'general') issues.push({ code: 'UNSUPPORTED_CLAIM', severity: 'repair', msg: `unsupported ${c.kind} claim: "${c.text}"` });
  const evalr = { issues, review: ev.review };
  const decision = decide(evalr);
  const score = ev.review.total;
  const today = istDate();
  const cited = citedSources(article, ev.review, brief);
  const fileText = articleFile(item, article, { pubDate: today, sources: cited.map((c) => ({ url: c.url, publisher: c.publisher, accessDate: c.accessDate, claim: c.claim })), related: relatedSlugs(article) });
  const summary = issues.filter((i) => i.severity !== 'warn').map((i) => `${i.code}: ${i.msg}`).slice(0, 8).join('; ');
  if (decision !== 'APPROVE') {
    const p = writeDraft(store, item.slug, fileText, { blocked: true });
    pullFromSite(store, item);
    block(store, manifest, item, `re-judged: ${summary || `review score ${score}`}`, { qualityScore: score, sitePath: null, promotedAt: null });
    console.log(`[${id}] still blocked — ${summary} (${p})`);
    return 0;
  }
  const finalText = `${article.title}. ${article.description}. ${article.body}`;
  const own = item.sitePath ? `/blog/${item.slug}/` : null; // a promoted article is in the corpus (source and built page): it is not a duplicate of itself
  const dup = d.index.similar(finalText, 1, (doc) => doc.kind === 'planned' || doc.path === own)[0];
  if (dup && dup.score >= SIMILARITY_BLOCK) {
    pullFromSite(store, item);
    block(store, manifest, item, `near-duplicate of ${dup.doc.path} (similarity ${dup.score.toFixed(2)})`, { qualityScore: score, sitePath: null, promotedAt: null });
    console.log(`[${id}] blocked — near-duplicate of ${dup.doc.path}`);
    return 0;
  }
  const blockedFile = join(store.draftsDir, `blocked-${item.slug}.md`);
  if (existsSync(blockedFile)) unlinkSync(blockedFile);
  const p = writeDraft(store, item.slug, fileText);
  store.addQuestions(item.slug, questionHeadings(article.body));
  store.setStatus(manifest, item, 'approved', { qualityScore: score, writerModel: article.model || item.writerModel, reviewerModel: ev.review.model || item.reviewerModel, finalTitle: article.title, approvedAt: new Date().toISOString(), blockedReason: null, rejudged: true, sources: cited.map((c) => c.id) });
  console.log(`[${id}] approved on re-judge (score ${score}) → ${p}`);
  return 0;
}

/** the question headings the gates validated (a heading ending in "?"), verbatim */
export function questionHeadings(body) {
  return parseArticle(body || '').headings.map((h) => h.text.trim()).filter((t) => /\?$/.test(t));
}

/** the competitor claims the article rests on: those the writer listed in META plus those the reviewer mapped a
 *  supported competitor claim to, so the Sources section shows the evidence the review actually relied on */
export function citedSources(article, review, brief) {
  const ids = new Set((article.sourcesUsed || []).map(String));
  for (const c of review?.claims || []) {
    if (!c || c.supported !== true || c.kind === 'ollasync') continue;
    for (const r of String(c.ref || '').match(/\bC\d{2}\b/g) || []) ids.add(r);
  }
  return (brief.competitorClaims || []).filter((c) => ids.has(c.id));
}

function relatedSlugs(article) {
  return [...new Set([...String(article.body).matchAll(/\]\(\/blog\/([a-z0-9-]+)\/?\)/g)].map((m) => m[1]))];
}

/** whatever of the article is publishable (an approved draft, a promoted site file) becomes the blocked draft */
export function pullFromSite(store, it) {
  const blockedFile = join(store.draftsDir, `blocked-${it.slug}.md`);
  const approvedDraft = join(store.draftsDir, `${it.slug}.md`);
  if (existsSync(approvedDraft)) renameSync(approvedDraft, blockedFile);
  if (it.sitePath && existsSync(it.sitePath)) renameSync(it.sitePath, blockedFile); // promoted already: leave the publishable tree
}

/** human review: an approved (or promoted) article is pulled out of anything publishable and marked blocked */
export function blockItem(store, id, reason) {
  const m = store.loadManifest();
  const it = store.item(m, id);
  if (!['approved', 'blocked'].includes(it.status)) throw new Error(`${it.id} is ${it.status}; --block applies to approved or blocked items`);
  pullFromSite(store, it);
  store.setStatus(m, it, 'blocked', { blockedReason: `human review: ${reason}`, humanBlockedAt: new Date().toISOString(), sitePath: null, promotedAt: null });
  return it;
}

/** the stored brief's competitor claims are re-verified against their pages right now; dropped claims disappear */
export async function refreshClaims(brief, item, d, store, today) {
  if (!(brief.competitorClaims || []).length) return brief;
  brief.competitorClaims = await verifiedClaims(item, d, today);
  store.saveWork(item.id, 'brief.json', brief);
  return brief;
}

function block(store, manifest, item, reason, extra = {}) {
  store.setStatus(manifest, item, 'blocked', { blockedReason: reason, ...extra });
  return { status: 'blocked', reason };
}

/** the independent review first, then the deterministic gates over the article with insight sections known to
 *  both the writer (META) and the reviewer — merged into one issue list */
async function evaluate(article, brief, gateCtx, ctx, d, id, budgetOK) {
  let review = null;
  let rerr = null;
  for (let n = 0; n < 2 && !review; n++) {
    const r = await d.llm.chat({ task: 'content_reviewer', stage: 'review', articleId: id, ...reviewerPrompt(article, brief, ctx), maxTokens: 2500, temperature: 0.1 });
    budgetOK();
    try {
      const j = parseJSON(r.content);
      const weights = POLICY.editorial_review.dimensions;
      const scores = {};
      let total = 0;
      for (const [k, w] of Object.entries(weights)) {
        const v = Math.max(0, Math.min(w, Number(j.scores?.[k] ?? 0)));
        scores[k] = v;
        total += v;
      }
      review = { model: r.model, scores, total: Math.round(total), answers: j.answers || {}, claims: Array.isArray(j.claims) ? j.claims : [], insightSections: Array.isArray(j.insightSections) ? j.insightSections : [], repairInstructions: Array.isArray(j.repairInstructions) ? j.repairInstructions : [], summary: j.summary || '' };
    } catch (e) {
      rerr = e;
    }
  }
  if (!review) throw new Error(`reviewer returned no usable JSON: ${rerr?.message}`);
  const insights = mergeInsights(article, review, gateCtx.factIds);
  const issues = deterministicGates({ ...article, insights }, gateCtx);
  const claimIds = new Set((brief.competitorClaims || []).map((c) => c.id));
  for (const c of review.claims) {
    if (!c || c.kind === 'general') continue;
    const refs = String(c.ref || '').match(/\b[FC]\d{2}\b/g) || [];
    const valid = refs.some((r) => (c.kind !== 'competitor' && gateCtx.factIds.has(r)) || (c.kind !== 'ollasync' && claimIds.has(r)));
    if (c.supported === false) issues.push({ code: 'UNSUPPORTED_CLAIM', severity: 'repair', msg: `unsupported ${c.kind} claim: "${c.text}"` });
    else if (!valid) issues.push({ code: 'UNSUPPORTED_CLAIM', severity: 'repair', msg: `unreferenced ${c.kind} claim (no valid fact or source id): "${c.text}"` }); // "supported" without evidence is not supported
  }
  if (review.insightSections.length < POLICY.first_hand_experience_policy.minimum_original_insight_sections_per_article) issues.push({ code: 'INSIGHTS_REVIEW', severity: 'repair', msg: `the reviewer found ${review.insightSections.length} genuine original-insight section(s)` });
  return { issues, review };
}

/** insight sections named by the writer (META) or the reviewer, kept only when they are a real heading of the
 *  body (the editor renames sections) and cite known fact ids; de-duplicated by the heading they resolve to */
export function mergeInsights(article, review, factIds) {
  const headings = parseArticle(article.body || '').headings;
  const seen = new Set();
  const out = [];
  for (const s of [...(article.insights || []), ...(review?.insightSections || [])]) {
    const h = matchHeading(headings, s.heading || '');
    if (!h) continue;
    const key = h.text.toLowerCase();
    const ids = (s.factIds || []).map(String).filter((f) => factIds.has(f));
    if (!ids.length) continue;
    if (seen.has(key)) {
      const prev = out.find((o) => o.heading === h.text);
      for (const f of ids) if (!prev.factIds.includes(f)) prev.factIds.push(f);
      continue;
    }
    seen.add(key);
    out.push({ heading: h.text, factIds: ids });
  }
  return out;
}

function decide(evalr) {
  const v = verdictFor(evalr.review.total);
  if (hasBlockers(evalr.issues) || v === 'BLOCK') return 'BLOCK';
  if (v === 'ONE_REPAIR_PASS' || needsRepair(evalr.issues)) return 'REPAIR';
  return 'APPROVE';
}

/** Competitor claims for this item, re-verified against their official page right now: the stored quote must still
 *  be on the page. Nothing fetched ever reaches a model — only the curated claim text does. */
export async function verifiedClaims(item, d, today) {
  const wanted = new Set((item.comparison?.competitors || []).map((c) => c.toLowerCase()));
  const all = d.facts.competitors.claims || [];
  const mine = all.filter((c) => wanted.has(String(c.competitor).toLowerCase()));
  const out = [];
  const pages = new Map(); // url → normalised page text (null when unreachable); every claim's own quote is checked against it
  for (const c of mine) {
    if (!pages.has(c.url)) {
      let text = null;
      try {
        const r = await d.fetchImpl(c.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OllasyncContentEngine/1.0; +https://www.ollasync.com)' }, signal: AbortSignal.timeout(20000), redirect: 'follow' });
        if (r.ok) text = htmlText(await r.text()).toLowerCase().replace(/\s+/g, ' ');
      } catch {
        text = null;
      }
      pages.set(c.url, text);
    }
    const text = pages.get(c.url);
    const live = !!text && text.includes(String(c.quote).toLowerCase().replace(/\s+/g, ' '));
    if (live) out.push({ ...c, accessDate: today });
    else console.error(`warn: competitor claim ${c.id} dropped — its quote is no longer on ${c.url}`);
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => process.exit(code), (e) => {
    console.error(e.stack || e);
    process.exit(1);
  });
}
