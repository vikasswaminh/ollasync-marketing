// Durable state: the manifest (the state machine), per-item work artifacts (resumable stages), run records, the
// question registry and the lock. Every write is atomic (tmp + rename) so an interrupted run never leaves a
// half-written manifest behind.
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync, openSync, closeSync, unlinkSync, statSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { STATUSES, BATCH_CAP, istDate } from './config.mjs';

export function readJSON(path, fallback) {
  if (!existsSync(path)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`missing ${path}`);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function writeJSONAtomic(path, obj) {
  mkdirSync(resolve(path, '..'), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(obj, null, 2)}\n`);
  renameSync(tmp, path);
}

export function writeTextAtomic(path, text) {
  mkdirSync(resolve(path, '..'), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, text);
  renameSync(tmp, path);
}

// ── manifest ─────────────────────────────────────────────────────────────────────────────────────────────────
const REQUIRED = ['id', 'status', 'batch', 'scheduledDay', 'slug', 'title', 'primaryPillar', 'primaryQuery', 'secondaryQueries', 'searchIntent', 'audience', 'funnelStage', 'uniqueAngle', 'requiredOriginalInsights', 'internalLinkTargets', 'researchRequired', 'publishedUrl', 'qualityScore', 'writerModel', 'reviewerModel', 'cost'];

export function validateManifest(m) {
  const errors = [];
  if (!Array.isArray(m.items)) return ['manifest.items must be an array'];
  const ids = new Set();
  const slugs = new Set();
  const perBatch = {};
  for (const it of m.items) {
    for (const k of REQUIRED) if (!(k in it)) errors.push(`${it.id || '?'}: missing field ${k}`);
    if (!STATUSES.includes(it.status)) errors.push(`${it.id}: status ${it.status} not in ${STATUSES.join('|')}`);
    if (ids.has(it.id)) errors.push(`duplicate id ${it.id}`);
    ids.add(it.id);
    if (slugs.has(it.slug)) errors.push(`duplicate slug ${it.slug}`);
    slugs.add(it.slug);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(it.slug || '')) errors.push(`${it.id}: slug ${it.slug} is not kebab-case`);
    if ((it.slug || '').length > 80) errors.push(`${it.id}: slug longer than 80`);
    if (!Array.isArray(it.requiredOriginalInsights) || it.requiredOriginalInsights.length < 2) errors.push(`${it.id}: needs ≥ 2 requiredOriginalInsights`);
    if (!Array.isArray(it.internalLinkTargets) || !it.internalLinkTargets.length) errors.push(`${it.id}: needs internalLinkTargets`);
    perBatch[it.batch] = (perBatch[it.batch] || 0) + 1;
  }
  for (const [b, n] of Object.entries(perBatch)) if (n > BATCH_CAP) errors.push(`batch ${b} has ${n} items (cap ${BATCH_CAP})`);
  return errors;
}

export class Store {
  constructor(dir) {
    this.dir = dir;
    this.manifestPath = join(dir, 'manifest.json');
    this.workDir = join(dir, 'work');
    this.runsDir = join(dir, 'runs');
    this.draftsDir = join(dir, 'drafts');
    this.questionsPath = join(dir, 'questions.json');
    this.lockPath = join(dir, '.lock');
  }
  loadManifest() {
    const m = readJSON(this.manifestPath);
    const errs = validateManifest(m);
    if (errs.length) throw new Error(`manifest invalid:\n  ${errs.join('\n  ')}`);
    return m;
  }
  saveManifest(m) {
    const errs = validateManifest(m);
    if (errs.length) throw new Error(`refusing to save an invalid manifest:\n  ${errs.join('\n  ')}`);
    writeJSONAtomic(this.manifestPath, m);
  }
  item(m, id) {
    const it = m.items.find((x) => x.id === id);
    if (!it) throw new Error(`no manifest item ${id}`);
    return it;
  }
  setStatus(m, it, status, extra = {}) {
    if (!STATUSES.includes(status)) throw new Error(`bad status ${status}`);
    it.status = status;
    Object.assign(it, extra);
    this.saveManifest(m);
  }

  // ── per-item work artifacts (resume) ──
  workPath(id, name) {
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(String(id))) throw new Error(`refusing to touch work for "${id}" (not a manifest id)`);
    return join(this.workDir, id, name);
  }
  loadWork(id, name) {
    const p = this.workPath(id, name);
    if (!existsSync(p)) return null;
    return name.endsWith('.json') ? readJSON(p) : readFileSync(p, 'utf8');
  }
  saveWork(id, name, data) {
    const p = this.workPath(id, name);
    if (name.endsWith('.json')) writeJSONAtomic(p, data);
    else writeTextAtomic(p, data);
  }
  clearWork(id) {
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(String(id))) throw new Error(`refusing to clear work for "${id}" (not a manifest id)`);
    const d = join(this.workDir, id);
    if (!existsSync(d)) return;
    for (const f of readdirSync(d)) unlinkSync(join(d, f));
  }

  // ── question registry: no repeated FAQ across articles ──
  questions() {
    return readJSON(this.questionsPath, { questions: [] });
  }
  addQuestions(slug, qs) {
    const reg = this.questions();
    for (const q of qs) reg.questions.push({ q: normalizeQuestion(q), slug });
    writeJSONAtomic(this.questionsPath, reg);
  }

  // ── run records ──
  newRun(args) {
    const started = new Date().toISOString();
    const run = { id: `${started.replace(/[-:.]/g, '').slice(0, 18)}-${Math.random().toString(16).slice(2, 6)}`, started, finished: null, istDate: istDate(), args, attempted: [], approved: [], published: [], blocked: [], refused: null, calls: [], totals: { in: 0, out: 0, costUsd: 0 }, articles: {} };
    this.saveRun(run);
    return run;
  }
  saveRun(run) {
    writeJSONAtomic(join(this.runsDir, `${run.id}.json`), run);
  }
  runs() {
    if (!existsSync(this.runsDir)) return [];
    return readdirSync(this.runsDir).filter((f) => f.endsWith('.json')).sort().map((f) => readJSON(join(this.runsDir, f)));
  }
  /** what earlier runs already paid for one article (their persisted call rows), so a resumed item keeps its budget */
  priorSpend(articleId, exceptRunId = null) {
    const t = { costUsd: 0, tokens: 0, calls: 0 };
    for (const r of this.runs()) {
      if (r.id === exceptRunId) continue;
      for (const c of r.calls || []) {
        if (c.articleId !== articleId) continue;
        t.costUsd += c.cost || 0;
        t.tokens += (c.in || 0) + (c.out || 0);
        t.calls++;
      }
    }
    return t;
  }

  /** attempts already made on the Asia/Kolkata calendar day, across every run (manual + scheduled) */
  attemptsOn(ist) {
    return this.runs().filter((r) => r.istDate === ist).reduce((n, r) => n + r.attempted.length, 0);
  }

  // ── lock (exclusive create; a stale lock older than staleHours is broken — every model call has a timeout,
  //    so a live process cannot outlive it) ──
  lock(staleHours = 8) {
    mkdirSync(this.dir, { recursive: true });
    try {
      const fd = openSync(this.lockPath, 'wx');
      writeFileSync(fd, JSON.stringify({ pid: process.pid, started: new Date().toISOString() }));
      closeSync(fd);
      return true;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      const age = (Date.now() - statSync(this.lockPath).mtimeMs) / 3.6e6;
      if (age > staleHours) {
        unlinkSync(this.lockPath);
        return this.lock(staleHours);
      }
      return false;
    }
  }
  unlock() {
    if (existsSync(this.lockPath)) unlinkSync(this.lockPath);
  }
}

export function normalizeQuestion(q) {
  return q.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Selection: the next items to attempt. `only`/`retry` pick one item; `batch` restricts to a batch; otherwise the
 * manifest order. Only `planned` items are attempted (plus in-flight statuses left by an interrupted run, which
 * resume from their work artifacts); `blocked`, `approved` and `published` are never re-attempted here.
 */
export function selectItems(m, { only, retry, batch, limit }, attemptsToday = 0) {
  const resumable = new Set(['planned', 'researching', 'drafting', 'review', 'repair']);
  let cands;
  if (only) cands = [m.items.find((x) => x.id === only)].filter(Boolean).filter((x) => resumable.has(x.status));
  else if (retry) cands = [m.items.find((x) => x.id === retry)].filter(Boolean).filter((x) => x.status === 'blocked');
  else cands = m.items.filter((x) => resumable.has(x.status) && (batch === null || x.batch === batch));
  const room = Math.max(0, Math.min(limit, BATCH_CAP - attemptsToday));
  return cands.slice(0, room);
}
