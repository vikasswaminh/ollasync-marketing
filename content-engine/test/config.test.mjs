import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, loadConfig, routesFor, istDate, BATCH_CAP, POLICY } from '../engine/config.mjs';

test('batch size cannot exceed the policy cap of five', () => {
  assert.equal(BATCH_CAP, 5);
  assert.equal(parseArgs(['--limit', '9']).limit, 5);
  assert.equal(parseArgs(['--limit', '3']).limit, 3);
  assert.equal(parseArgs([]).limit, 5);
  assert.throws(() => parseArgs(['--limit', '0']));
  assert.throws(() => parseArgs(['--batch', '11']));
  assert.throws(() => parseArgs(['--bogus']));
  assert.throws(() => parseArgs(['--only']), /needs a value/, 'a bare --only must not fall through to a full batch');
  assert.throws(() => parseArgs(['--block', '--reason', 'x']), /needs a value/);
});

test('--block records a human editorial block with its reason', () => {
  const a = parseArgs(['--block', 'b1-04', '--reason', 'invented mechanism']);
  assert.equal(a.block, 'b1-04');
  assert.equal(a.reason, 'invented mechanism');
});

test('--dry-run never publishes, whatever --publish says', () => {
  const a = parseArgs(['--dry-run', '--publish', 'pr', '--batch', '1']);
  assert.equal(a.publish, 'none');
  assert.equal(a.batch, 1);
  assert.throws(() => parseArgs(['--publish', 'auto']));
});

test('configuration comes from the environment with the policy defaults', () => {
  const cfg = loadConfig({});
  assert.equal(cfg.openrouter.writer[0], POLICY.model_policy.default_writer);
  assert.deepEqual(cfg.openrouter.reviewer, ['qwen/qwen3-32b', 'nvidia/nemotron-3.5-lightning']);
  assert.ok(!cfg.openrouter.writer.some((m) => cfg.openrouter.reviewer.includes(m)), 'writer and reviewer defaults are disjoint');
  assert.equal(cfg.budgets.maxOutputPriceUsdPerM, 1);
  assert.equal(cfg.writerTemperature, 0.45);
  assert.equal(cfg.maxRepairPasses, 1);
  assert.equal(cfg.openrouter.enabled, false, 'no key → OpenRouter off');
  const c2 = loadConfig({ OPENROUTER_API_KEY: 'k', OPENROUTER_MODEL_CONTENT: 'a/x, b/y', OPENROUTER_PROVIDERS: 'P1,P2', LLM_GATEWAY_ENDPOINT: 'http://gw/v1/chat/completions', LLM_GATEWAY_MODEL_CONTENT: 'local/m', MAX_COST_PER_RUN_USD: '0.5' });
  assert.deepEqual(c2.openrouter.writer, ['a/x', 'b/y']);
  assert.deepEqual(c2.openrouter.providers, ['P1', 'P2']);
  assert.equal(c2.budgets.maxCostPerRunUsd, 0.5);
  assert.deepEqual(routesFor(c2, 'content_writer').map((r) => r.name), ['gateway', 'openrouter'], 'gateway first, like the app');
  assert.deepEqual(routesFor(c2, 'content_reviewer').map((r) => r.name), ['openrouter'], 'no gateway reviewer model → OpenRouter only');
  const c3 = loadConfig({ OPENROUTER_API_KEY: 'k', OPENROUTER_PROVIDERS: ' , ' });
  assert.equal(c3.openrouter.enabled, false, 'an empty host allow-list is not a route (never OpenRouter\'s own routing)');
});

test('the schedule day is the Asia/Kolkata calendar day', () => {
  assert.equal(istDate(Date.UTC(2026, 8, 12, 20, 0)), '2026-09-13'); // 20:00 UTC = 01:30 IST next day
  assert.equal(istDate(Date.UTC(2026, 8, 12, 18, 0)), '2026-09-12');
});
