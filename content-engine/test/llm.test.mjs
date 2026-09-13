import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LLM, preflight, fetchPricing, CeilingError } from '../engine/llm.mjs';
import { loadConfig, REPO_DIR } from '../engine/config.mjs';

const PRICING = { 'google/gemini-2.5-flash-lite': { prompt: 0.1, completion: 0.4 }, 'deepseek/deepseek-v4-flash-0731': { prompt: 0.04, completion: 0.08 }, 'qwen/qwen3-32b': { prompt: 0.08, completion: 0.28 }, 'nvidia/nemotron-3.5-lightning': { prompt: 0.08, completion: 0.2 }, 'google/gemini-3.1-flash-lite': { prompt: 0.25, completion: 1.5 } };
const env = { OPENROUTER_API_KEY: 'k', OPENROUTER_PROVIDERS: 'CoreWeave,Google AI Studio', OPENROUTER_ENDPOINT: 'https://or.test/chat', OPENROUTER_TIMEOUT_SEC_CONTENT: '5' };

const reply = (model, content, extra = {}) => new Response(JSON.stringify({ model, provider: 'CoreWeave', usage: { prompt_tokens: 1000, completion_tokens: 2000 }, choices: [{ message: { role: 'assistant', content } }], ...extra }), { status: 200 });

test('preflight refuses a model over the $1/M output ceiling, an unknown model, and writer = reviewer', () => {
  assert.equal(preflight(loadConfig(env), PRICING).ok, true, 'the defaults pass');
  const over = preflight(loadConfig({ ...env, OPENROUTER_MODEL_CONTENT: 'google/gemini-3.1-flash-lite' }), PRICING);
  assert.equal(over.ok, false);
  assert.ok(over.problems[0].includes('$1.50/M'));
  const unknown = preflight(loadConfig({ ...env, OPENROUTER_MODEL_CONTENT: 'nobody/model' }), PRICING);
  assert.ok(unknown.problems[0].includes('not in OpenRouter'));
  const same = preflight(loadConfig({ ...env, OPENROUTER_MODEL_CONTENT: 'qwen/qwen3-32b', OPENROUTER_MODEL_CONTENT_REVIEW: 'qwen/qwen3-32b' }), PRICING);
  assert.ok(same.problems.some((p) => p.includes('share qwen/qwen3-32b')));
  const overlap = preflight(loadConfig({ ...env, OPENROUTER_MODEL_CONTENT: 'google/gemini-2.5-flash-lite,deepseek/deepseek-v4-flash-0731', OPENROUTER_MODEL_CONTENT_REVIEW: 'qwen/qwen3-32b,deepseek/deepseek-v4-flash-0731' }), PRICING);
  assert.ok(overlap.problems.some((p) => p.includes('share deepseek/deepseek-v4-flash-0731')), 'a fallback of the writer list must not be a reviewer');
  const none = preflight(loadConfig({}), {});
  assert.ok(none.problems.some((p) => p.includes('no route')));
});

test('the OpenRouter request mirrors the app: fallback models, pinned hosts, no fallbacks, data collection denied, reasoning off', async () => {
  const cfg = loadConfig(env);
  const seen = [];
  const llm = new LLM(cfg, { pricing: PRICING, fetchImpl: async (url, init) => { seen.push({ url, init }); return reply('google/gemini-2.5-flash-lite', 'draft'); } });
  const r = await llm.chat({ task: 'content_writer', stage: 'write', articleId: 'x', system: 's', user: 'u', maxTokens: 3000, temperature: 0.45 });
  const body = JSON.parse(seen[0].init.body);
  assert.equal(seen[0].url, 'https://or.test/chat');
  assert.equal(body.model, 'google/gemini-2.5-flash-lite');
  assert.deepEqual(body.models, ['google/gemini-2.5-flash-lite', 'deepseek/deepseek-v4-flash-0731']);
  assert.deepEqual(body.provider, { order: ['CoreWeave', 'Google AI Studio'], allow_fallbacks: false, data_collection: 'deny' });
  assert.deepEqual(body.reasoning, { enabled: false });
  assert.equal(body.temperature, 0.45);
  assert.equal(body.max_tokens, 3000);
  assert.equal(seen[0].init.headers.Authorization, 'Bearer k');
  assert.equal(r.content, 'draft');
  assert.equal(r.route, 'openrouter');
  assert.ok(Math.abs(r.cost - (1000 * 0.1 + 2000 * 0.4) / 1e6) < 1e-9, 'cost from the pricing table');
  assert.equal(llm.ledger[0].status, 'ok');
  assert.equal(llm.totals('x').out, 2000);
  // the app's own OpenRouter call sends the same three protective fields — keep the two in step
  const goSrc = readFileSync(join(REPO_DIR, 'backend', 'dealroom', 'assistant.go'), 'utf8');
  for (const field of ['allow_fallbacks', 'data_collection', 'reasoning']) assert.ok(goSrc.includes(field), `assistant.go sends ${field}`);
});

test('gateway first (thinking-off fields, no provider pin); a gateway failure or empty reply falls through to OpenRouter', async () => {
  const cfg = loadConfig({ ...env, LLM_GATEWAY_ENDPOINT: 'http://gw.test/v1/chat/completions', LLM_GATEWAY_KEY: 'g', LLM_GATEWAY_MODEL_CONTENT: 'local/a, local/b' });
  const seen = [];
  let gwMode = 'ok';
  const llm = new LLM(cfg, { pricing: PRICING, fetchImpl: async (url, init) => {
    seen.push({ url, body: JSON.parse(init.body), auth: init.headers.Authorization });
    if (url.startsWith('http://gw.test')) {
      if (gwMode === 'fail') return new Response('{"error":{"message":"down"}}', { status: 500 });
      if (gwMode === 'empty') return reply('local/a', '');
      return reply(JSON.parse(init.body).model, 'from gateway', { provider: '' });
    }
    return reply('google/gemini-2.5-flash-lite', 'from openrouter');
  } });
  const a = await llm.chat({ task: 'content_writer', stage: 'write', system: 's', user: 'u' });
  assert.equal(a.content, 'from gateway');
  assert.equal(a.route, 'gateway');
  assert.equal(a.cost, null, 'gateway calls carry no OpenRouter cost');
  assert.equal(seen[0].body.think, false);
  assert.equal(seen[0].body.reasoning_effort, 'none');
  assert.equal(seen[0].body.provider, undefined);
  assert.equal(seen[0].auth, 'Bearer g');
  seen.length = 0;
  gwMode = 'fail';
  const b = await llm.chat({ task: 'content_writer', stage: 'write', system: 's', user: 'u' });
  assert.equal(b.content, 'from openrouter');
  assert.deepEqual(seen.map((s) => s.url), ['http://gw.test/v1/chat/completions', 'http://gw.test/v1/chat/completions', 'http://gw.test/v1/chat/completions', 'http://gw.test/v1/chat/completions', 'https://or.test/chat'], 'each gateway model tried twice (500 is transient), then OpenRouter');
  seen.length = 0;
  gwMode = 'empty';
  const c = await llm.chat({ task: 'content_writer', stage: 'write', system: 's', user: 'u' });
  assert.equal(c.content, 'from openrouter');
  assert.equal(seen.filter((s) => s.url.startsWith('http://gw')).length, 2, 'empty content is a model failure: next model, no retry');
});

test('a reply truncated at max_tokens is a model failure: the next model or route serves instead', async () => {
  const cfg = loadConfig({ ...env, LLM_GATEWAY_ENDPOINT: 'http://gw.test/v1/chat/completions', LLM_GATEWAY_MODEL_CONTENT: 'local/a' });
  const seen = [];
  const llm = new LLM(cfg, { pricing: PRICING, fetchImpl: async (url) => {
    seen.push(url);
    if (url.startsWith('http://gw.test')) return reply('local/a', 'half an art', { choices: [{ message: { role: 'assistant', content: 'half an art' }, finish_reason: 'length' }] });
    return reply('google/gemini-2.5-flash-lite', 'whole article', { choices: [{ message: { role: 'assistant', content: 'whole article' }, finish_reason: 'stop' }] });
  } });
  const r = await llm.chat({ task: 'content_writer', stage: 'write', system: 's', user: 'u', maxTokens: 50 });
  assert.equal(r.content, 'whole article');
  assert.equal(r.finish, 'stop');
  assert.deepEqual(seen, ['http://gw.test/v1/chat/completions', 'https://or.test/chat'], 'one gateway attempt (not transient), then OpenRouter');
  assert.match(llm.ledger[0].error, /truncated at max_tokens/);
  assert.equal(llm.ledger[0].out, 2000, 'the truncated reply is still billed and recorded');
  assert.equal(llm.totals().out, 4000, 'failed calls count in the totals');
  assert.equal(llm.totals().calls, 1, 'only successes count as calls');
  const orOnly = loadConfig(env);
  const seen2 = [];
  const l2 = new LLM(orOnly, { pricing: PRICING, fetchImpl: async () => reply('google/gemini-2.5-flash-lite', 'cut', { choices: [{ message: { role: 'assistant', content: 'cut' }, finish_reason: 'length' }] }) });
  l2.onRecord = (row) => seen2.push(row);
  await assert.rejects(l2.chat({ task: 'content_writer', stage: 'write', system: 's', user: 'u', maxTokens: 50 }), /truncated/);
  assert.equal(seen2.length, 1, 'the persistence hook sees failed calls too');
  assert.ok(seen2[0].cost > 0, 'and their cost');
});

test('a served model over the ceiling stops the run; every route failing throws the last error', async () => {
  const cfg = loadConfig(env);
  const llm = new LLM(cfg, { pricing: PRICING, fetchImpl: async () => reply('google/gemini-3.1-flash-lite', 'x') });
  await assert.rejects(llm.chat({ task: 'content_writer', stage: 'write', system: 's', user: 'u' }), CeilingError);
  assert.equal(llm.ledger[0].out, 2000, 'the over-ceiling reply was billed and recorded');
  assert.ok(llm.ledger[0].cost > 0);
  const dead = new LLM(cfg, { pricing: PRICING, fetchImpl: async () => new Response('{"error":{"message":"nope"}}', { status: 400 }) });
  await assert.rejects(dead.chat({ task: 'content_writer', stage: 'write', system: 's', user: 'u' }), /nope/);
  assert.ok(dead.ledger.every((l) => l.status === 'error'));
});

test('pricing is read from OpenRouter\'s public model list and cached', async () => {
  const cfg = loadConfig(env);
  let calls = 0;
  const fetchImpl = async () => { calls++; return new Response(JSON.stringify({ data: [{ id: 'a/b', pricing: { prompt: '0.0000001', completion: '0.0000004' } }] })); };
  const dir = mkdtempSync(join(tmpdir(), 'ce-pricing-'));
  const p = await fetchPricing(cfg, { cacheDir: dir, fetchImpl });
  assert.deepEqual(p['a/b'], { prompt: 0.1, completion: 0.4 });
  await fetchPricing(cfg, { cacheDir: dir, fetchImpl });
  assert.equal(calls, 1, 'second call served from the cache');
  await fetchPricing(cfg, { cacheDir: dir, fetchImpl, now: Date.now() + 25 * 3600 * 1000 });
  assert.equal(calls, 2, 'a day later the table is refreshed');
});
