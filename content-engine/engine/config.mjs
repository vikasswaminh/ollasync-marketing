// Configuration: CLI flags + environment. Nothing here talks to the network or the filesystem beyond locating the
// engine directory. Model ids, prices and budgets are configuration (policy: "Model IDs must be configurable").
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

export const ENGINE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const SITE_DIR = resolve(ENGINE_DIR, '..');
export const REPO_DIR = resolve(SITE_DIR, '..');
export const POLICY = JSON.parse(readFileSync(resolve(ENGINE_DIR, 'policy.json'), 'utf8'));
export const PILLARS = JSON.parse(readFileSync(resolve(ENGINE_DIR, 'pillars.json'), 'utf8'));

export const BATCH_CAP = POLICY.content_engine.batch_size; // 5 — the hard ceiling for --limit
export const STATUSES = POLICY.editorial_manifest.statuses;

const num = (v, def) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? def : Number(v));
const list = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);

/** CLI: node engine/run.mjs [--dry-run] [--batch N] [--limit N] [--only ID] [--retry ID] [--fresh ID] [--promote ID] [--publish none|pr] [--open-pr] [--report] */
export function parseArgs(argv) {
  const a = { dryRun: false, batch: null, limit: BATCH_CAP, only: null, retry: null, fresh: null, promote: null, rejudge: null, block: null, reason: '', publish: 'none', openPr: false, report: false, help: false };
  const needsValue = new Set(['--batch', '--limit', '--only', '--retry', '--fresh', '--promote', '--rejudge', '--block', '--reason', '--publish']);
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (needsValue.has(k) && (v === undefined || String(v).startsWith('--'))) throw new Error(`${k} needs a value`);
    switch (k) {
      case '--dry-run': a.dryRun = true; break;
      case '--batch': a.batch = Number(v); i++; break;
      case '--limit': a.limit = Number(v); i++; break;
      case '--only': a.only = v; i++; break;
      case '--retry': a.retry = v; i++; break;
      case '--fresh': a.fresh = v; i++; break;
      case '--promote': a.promote = v; i++; break;
      case '--rejudge': a.rejudge = v; i++; break;
      case '--block': a.block = v; i++; break;
      case '--reason': a.reason = v; i++; break;
      case '--publish': a.publish = v; i++; break;
      case '--open-pr': a.openPr = true; break;
      case '--report': a.report = true; break;
      case '--help': case '-h': a.help = true; break;
      default: throw new Error(`unknown argument ${k}`);
    }
  }
  if (!Number.isInteger(a.limit) || a.limit < 1) throw new Error('--limit must be a positive integer');
  if (a.limit > BATCH_CAP) a.limit = BATCH_CAP; // the policy's batch size is a ceiling, never a suggestion
  if (a.batch !== null && (!Number.isInteger(a.batch) || a.batch < 1 || a.batch > POLICY.content_engine.planned_days)) throw new Error('--batch must be 1..10');
  if (!['none', 'pr'].includes(a.publish)) throw new Error('--publish must be none or pr');
  if (a.dryRun) a.publish = 'none';
  return a;
}

/** Environment → engine config. Keys are read here and only here; they are never logged or written anywhere. */
export function loadConfig(env = process.env) {
  const cfg = {
    openrouter: {
      key: env.OPENROUTER_API_KEY || '',
      endpoint: env.OPENROUTER_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions',
      modelsEndpoint: env.OPENROUTER_MODELS_ENDPOINT || 'https://openrouter.ai/api/v1/models',
      writer: list(env.OPENROUTER_MODEL_CONTENT || `${POLICY.model_policy.default_writer},deepseek/deepseek-v4-flash-0731`),
      reviewer: list(env.OPENROUTER_MODEL_CONTENT_REVIEW || 'qwen/qwen3-32b,nvidia/nemotron-3.5-lightning'), // never a model of the writer list: a fallback must not review its own draft
      // The same host allow-list the app pins for AI notes (docs/subprocessors.md): never OpenRouter's own routing.
      providers: list(env.OPENROUTER_PROVIDERS || 'CoreWeave,Parasail,DeepInfra,Google AI Studio,Google,OpenAI'),
      timeoutMs: num(env.OPENROUTER_TIMEOUT_SEC_CONTENT, 180) * 1000,
      referer: env.OPENROUTER_REFERER || 'https://ollasync.com',
    },
    gateway: {
      endpoint: (env.LLM_GATEWAY_ENDPOINT || '').trim(),
      key: env.LLM_GATEWAY_KEY || '',
      writer: list(env.LLM_GATEWAY_MODEL_CONTENT),
      reviewer: list(env.LLM_GATEWAY_MODEL_CONTENT_REVIEW),
      timeoutMs: num(env.LLM_GATEWAY_TIMEOUT_SEC_CONTENT, 300) * 1000,
      nothink: (env.LLM_GATEWAY_NOTHINK || '').trim().toLowerCase() !== 'off',
    },
    budgets: {
      maxCostPerRunUsd: num(env.MAX_COST_PER_RUN_USD, 1.5),
      maxCostPerArticleUsd: num(env.MAX_COST_PER_ARTICLE_USD, 0.25),
      maxTokensPerArticle: num(env.MAX_TOKENS_PER_ARTICLE, 60000),
      maxRunMinutes: num(env.MAX_RUN_MINUTES, 150),
      maxOutputPriceUsdPerM: num(env.MAX_OUTPUT_PRICE_USD_PER_M, POLICY.model_policy.maximum_output_price_usd_per_million_tokens),
    },
    writerTemperature: num(env.WRITER_TEMPERATURE, POLICY.model_policy.generation_settings.writer_temperature),
    maxRepairPasses: POLICY.model_policy.generation_settings.maximum_repair_passes,
    stateDir: env.CONTENT_ENGINE_STATE || ENGINE_DIR,
    distDir: env.MARKETING_DIST || resolve(SITE_DIR, 'dist'),
    siteUrl: 'https://www.ollasync.com',
  };
  cfg.gateway.enabled = !!cfg.gateway.endpoint;
  cfg.openrouter.enabled = !!cfg.openrouter.key && cfg.openrouter.providers.length > 0;
  return cfg;
}

/** Which model lists serve a task on each route, in route order (gateway first, like the app). */
export function routesFor(cfg, task) {
  const out = [];
  const gw = task === 'content_writer' ? cfg.gateway.writer : cfg.gateway.reviewer;
  const or = task === 'content_writer' ? cfg.openrouter.writer : cfg.openrouter.reviewer;
  if (cfg.gateway.enabled && gw.length) out.push({ name: 'gateway', models: gw });
  if (cfg.openrouter.enabled && or.length) out.push({ name: 'openrouter', models: or });
  return out;
}

/** Asia/Kolkata calendar day (the policy's schedule timezone; IST has no DST). */
export function istDate(now = Date.now()) {
  return new Date(now + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}
