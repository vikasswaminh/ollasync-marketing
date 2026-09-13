// The engine's only model client. It mirrors the request shape of the app's AI-notes route
// (backend/dealroom/assistant.go `callRoute`): the operator's gateway first (plain OpenAI-compatible request, the
// thinking-off fields), OpenRouter second (fallback `models` array, the pinned host allow-list with
// allow_fallbacks:false + data_collection:"deny", reasoning off). Keep the two in step when one changes.
// Every call lands in a ledger with route/model/provider/tokens/cost/latency/status (policy telemetry_required).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { routesFor } from './config.mjs';

export class CeilingError extends Error {}

const PRICING_TTL_MS = 24 * 3600 * 1000;

/** OpenRouter's public model metadata → { id: { prompt, completion } } in USD per million tokens, cached 24 h. */
export async function fetchPricing(cfg, { cacheDir, fetchImpl = fetch, now = Date.now() } = {}) {
  const cachePath = cacheDir ? join(cacheDir, '.cache', 'pricing.json') : null;
  if (cachePath && existsSync(cachePath)) {
    const c = JSON.parse(readFileSync(cachePath, 'utf8'));
    if (now - Date.parse(c.fetched) < PRICING_TTL_MS) return c.models;
  }
  const r = await fetchImpl(cfg.openrouter.modelsEndpoint, { headers: { 'User-Agent': 'ollasync-content-engine' }, signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`pricing: HTTP ${r.status} from ${cfg.openrouter.modelsEndpoint}`);
  const d = await r.json();
  const models = {};
  for (const m of d.data || []) {
    const p = m.pricing || {};
    models[m.id] = { prompt: Number((Number(p.prompt || 0) * 1e6).toFixed(6)), completion: Number((Number(p.completion || 0) * 1e6).toFixed(6)) }; // USD per million tokens
  }
  if (cachePath) {
    mkdirSync(join(cacheDir, '.cache'), { recursive: true });
    writeFileSync(cachePath, JSON.stringify({ fetched: new Date(now).toISOString(), models }));
  }
  return models;
}

/**
 * Preflight before the first token is spent: every configured OpenRouter id must exist in the pricing table and
 * cost at most the output-price ceiling; the writer and the reviewer must be different models; each task needs a
 * route. Returns { ok, problems, models } — the caller refuses to run on any problem.
 */
export function preflight(cfg, pricing) {
  const problems = [];
  const ceiling = cfg.budgets.maxOutputPriceUsdPerM;
  const models = { content_writer: [], content_reviewer: [] };
  for (const task of ['content_writer', 'content_reviewer']) {
    const routes = routesFor(cfg, task);
    if (!routes.length) problems.push(`${task}: no route configured (set OPENROUTER_API_KEY + OPENROUTER_PROVIDERS, or LLM_GATEWAY_ENDPOINT + a gateway model)`);
    for (const rt of routes) {
      for (const id of rt.models) {
        if (rt.name === 'gateway') {
          models[task].push({ route: 'gateway', id, in: null, out: null });
          continue;
        }
        const p = pricing[id];
        if (!p) {
          problems.push(`${task}: ${id} is not in OpenRouter's model list`);
          continue;
        }
        if (p.completion > ceiling) problems.push(`${task}: ${id} costs $${p.completion.toFixed(2)}/M output — over the $${ceiling}/M ceiling`);
        models[task].push({ route: 'openrouter', id, in: p.prompt, out: p.completion });
      }
    }
  }
  const writers = new Set(models.content_writer.map((m) => m.id));
  const overlap = models.content_reviewer.map((m) => m.id).filter((id) => writers.has(id));
  if (overlap.length) problems.push(`writer and reviewer lists share ${overlap.join(', ')}; with fallback routing a draft could be reviewed by its own model — the policy wants an independent review`);
  return { ok: problems.length === 0, problems, models };
}

const transient = (e) => e.transient === true;

export class LLM {
  constructor(cfg, { pricing = {}, fetchImpl = fetch, log = (m) => console.error(m) } = {}) {
    this.cfg = cfg;
    this.pricing = pricing;
    this.fetchImpl = fetchImpl;
    this.log = log;
    this.ledger = [];
  }

  /** One completion: walks the routes for the task; the ledger gets a row per attempt (success or failure). */
  async chat({ task, stage, articleId = null, system, user, maxTokens = 2500, temperature = 0.2 }) {
    const routes = routesFor(this.cfg, task);
    if (!routes.length) throw new Error(`llm: no route configured for ${task}`);
    let last = null;
    for (const rt of routes) {
      const attempts = rt.name === 'openrouter' ? [rt.models[0]] : rt.models; // OpenRouter falls back server-side across `models`
      for (const model of attempts) {
        for (let n = 0; n < 2; n++) {
          const t0 = Date.now();
          try {
            const res = await this.#call(rt, model, system, user, maxTokens, temperature);
            this.record({ articleId, stage, task, route: rt.name, model: res.model, provider: res.provider, in: res.in, out: res.out, cost: res.cost, latencyMs: res.latencyMs, finish: res.finish, status: 'ok' });
            return res;
          } catch (e) {
            last = e;
            const b = e.billed || { in: 0, out: 0, cost: 0, model, provider: null }; // a truncated or empty reply is still billed
            this.record({ articleId, stage, task, route: rt.name, model: b.model, provider: b.provider, in: b.in, out: b.out, cost: b.cost || 0, latencyMs: Date.now() - t0, status: 'error', error: String(e.message || e).slice(0, 300) });
            this.log(`[llm] route=${rt.name} model=${model} ${stage || task} failed: ${e.message}`);
            if (e instanceof CeilingError) throw e; // never keep spending on a model over the ceiling
            if (!transient(e)) break; // a model-level failure: next model/route, no retry
          }
        }
      }
    }
    throw last || new Error('llm: every route failed');
  }

  async #call(rt, model, system, user, maxTokens, temperature) {
    const cfg = this.cfg;
    const openrouter = rt.name === 'openrouter';
    const body = { model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: maxTokens, temperature };
    const headers = { 'content-type': 'application/json' };
    let url;
    let timeoutMs;
    if (openrouter) {
      url = cfg.openrouter.endpoint;
      timeoutMs = cfg.openrouter.timeoutMs;
      if (rt.models.length > 1) body.models = rt.models;
      body.provider = { order: cfg.openrouter.providers, allow_fallbacks: false, data_collection: 'deny' };
      body.reasoning = { enabled: false };
      headers.Authorization = `Bearer ${cfg.openrouter.key}`;
      headers['HTTP-Referer'] = cfg.openrouter.referer;
      headers['X-Title'] = 'Ollasync';
    } else {
      url = cfg.gateway.endpoint;
      timeoutMs = cfg.gateway.timeoutMs;
      if (cfg.gateway.nothink) {
        body.think = false;
        body.reasoning_effort = 'none';
      }
      if (cfg.gateway.key) headers.Authorization = `Bearer ${cfg.gateway.key}`;
    }
    const t0 = Date.now();
    let r;
    try {
      r = await this.fetchImpl(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
    } catch (e) {
      const err = new Error(`${rt.name}: ${e.name === 'TimeoutError' || e.name === 'AbortError' ? `timeout after ${timeoutMs / 1000}s` : e.message}`);
      err.transient = true;
      throw err;
    }
    let out;
    try {
      out = await r.json();
    } catch {
      const err = new Error(`${rt.name}: http ${r.status}, unreadable body`);
      err.transient = r.status >= 500;
      throw err;
    }
    if (out.error) {
      const err = new Error(`${rt.name}: ${out.error.message || JSON.stringify(out.error).slice(0, 200)}`);
      err.transient = r.status >= 500 || r.status === 429;
      throw err;
    }
    if (!r.ok) {
      const err = new Error(`${rt.name}: http ${r.status}`);
      err.transient = r.status >= 500 || r.status === 429;
      throw err;
    }
    const served = out.model || model;
    const usage = out.usage || {};
    const tokIn = usage.prompt_tokens || 0;
    const tokOut = usage.completion_tokens || 0;
    let cost = null;
    let over = null;
    if (openrouter) {
      const p = this.pricing[served] || this.pricing[model];
      if (p) {
        cost = (tokIn * p.prompt + tokOut * p.completion) / 1e6;
        if (p.completion > cfg.budgets.maxOutputPriceUsdPerM) over = p.completion;
      }
    }
    const billed = { in: tokIn, out: tokOut, cost, model: served, provider: out.provider || (openrouter ? '' : 'gateway') };
    if (over !== null) throw Object.assign(new CeilingError(`openrouter served ${served} at $${over.toFixed(2)}/M output — over the ceiling; stopping`), { billed }); // the response was billed all the same
    const content = out.choices?.[0]?.message?.content;
    if (!content || !String(content).trim()) throw Object.assign(new Error(`${rt.name}: empty content (model=${served} provider=${out.provider || ''})`), { billed });
    const finish = out.choices?.[0]?.finish_reason || '';
    if (finish === 'length') throw Object.assign(new Error(`${rt.name}: reply truncated at max_tokens=${maxTokens} (model=${served}) — not usable`), { billed }); // dry run 2026-09-13: a local model spent the whole cap and the envelope was cut mid-article; the tokens are still billed
    return { content: String(content), route: rt.name, model: served, provider: billed.provider, in: tokIn, out: tokOut, latencyMs: Date.now() - t0, cost, finish };
  }

  /** append a ledger row and hand it to the persistence hook (the run record is written after every call) */
  record(row) {
    this.ledger.push(row);
    if (typeof this.onRecord === 'function') this.onRecord(row);
  }

  /** ledger totals, optionally for one article — failed calls count too (their tokens were billed); `calls` counts successes */
  totals(articleId = null) {
    const rows = this.ledger.filter((l) => articleId === null || l.articleId === articleId);
    return rows.reduce((t, l) => ({ in: t.in + (l.in || 0), out: t.out + (l.out || 0), costUsd: t.costUsd + (l.cost || 0), calls: t.calls + (l.status === 'ok' ? 1 : 0) }), { in: 0, out: 0, costUsd: 0, calls: 0 });
  }
}
