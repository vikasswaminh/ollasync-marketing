import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as stagesModule from '../engine/stages.mjs';
import { parseMetaBody, parseJSON, verdictFor, productContext, writerPrompt, reviewerPrompt, buildBrief, briefText, editorPrompt, repairPrompt, intentPrompt } from '../engine/stages.mjs';
import { loadFacts } from '../engine/corpus.mjs';
import { ENGINE_DIR, POLICY } from '../engine/config.mjs';
import { goodArticle, envelope } from './fixtures.mjs';

test('the META/BODY envelope parses, tolerates a fenced body, and rejects a missing envelope', () => {
  const a = goodArticle();
  const p = parseMetaBody(envelope(a));
  assert.equal(p.title, a.title);
  assert.equal(p.body, a.body);
  assert.deepEqual(p.insights, a.insights);
  const fenced = `Sure!\n===META===\n\`\`\`json\n${JSON.stringify({ title: 't', description: 'd' })}\n\`\`\`\n===BODY===\n\`\`\`markdown\n## Hi\n\ntext\n\`\`\``;
  assert.equal(parseMetaBody(fenced).body, '## Hi\n\ntext');
  assert.throws(() => parseMetaBody('just prose'), /envelope/);
  assert.throws(() => parseMetaBody('===META===\n{"title":""}\n===BODY===\nx'), /title/);
  assert.deepEqual(parseMetaBody('===META===\n{"title":"t","description":"d","repairs":["ANSWER_LENGTH: split it"]}\n===BODY===\nbody').repairs, ['ANSWER_LENGTH: split it'], 'a repair reply\'s confirmations are kept for the record');
  assert.deepEqual(parseJSON('```json\n{"a":1}\n```'), { a: 1 });
});

test('fact ids cited in the prose are stripped on parse; META keeps them', () => {
  const { stripFactIds } = stagesModule;
  assert.equal(stripFactIds('Learners join from a link (F08). Notes are opt-in (F13, F16) and sent to everyone (see F14).'), 'Learners join from a link. Notes are opt-in and sent to everyone.');
  assert.equal(stripFactIds('Per F02 a class runs five languages; the cap [F02] matters, C07 says 40 minutes.'), 'a class runs five languages; the cap matters, says 40 minutes.'.replace(/^a/, 'a'));
  assert.equal(stripFactIds('Version F0 and port 8080 stay'), 'Version F0 and port 8080 stay');
  const a = goodArticle();
  a.body += '\n\nAll switches are the host\'s (F25).';
  const p = parseMetaBody(envelope(a));
  assert.ok(!/F25/.test(p.body) && p.body.endsWith("All switches are the host's."));
  assert.deepEqual(p.insights, a.insights);
});

test('the repair thresholds follow the policy exactly', () => {
  assert.equal(verdictFor(85), 'APPROVE');
  assert.equal(verdictFor(84), 'ONE_REPAIR_PASS');
  assert.equal(verdictFor(75), 'ONE_REPAIR_PASS');
  assert.equal(verdictFor(74), 'BLOCK');
  assert.equal(verdictFor(0), 'BLOCK');
});

test('the shared product context is compact, byte-identical, and carries every fact id, the forbidden phrases and the NEVER list', () => {
  const facts = loadFacts(ENGINE_DIR);
  const ctx = productContext(facts);
  assert.equal(ctx, productContext(facts));
  assert.ok(Buffer.byteLength(ctx) < 8192, `context is ${Buffer.byteLength(ctx)} bytes`);
  for (const f of facts.product.facts) assert.ok(ctx.includes(`[${f.id}]`));
  for (const p of POLICY.editorial_voice_policy.forbidden_phrases_and_patterns) assert.ok(ctx.includes(p));
  assert.ok(ctx.includes('NEVER'));
});

test('prompts carry the pillar, the related links, the claim ids and the rubric', () => {
  const item = { id: 'b4-01', title: 'Zoom alternatives', slug: 'z', primaryQuery: 'zoom alternatives', secondaryQueries: ['x'], searchIntent: 'commercial', audience: 'trainers', funnelStage: 'consideration', uniqueAngle: 'a framework', requiredOriginalInsights: ['one (F11)', 'two (F02)'], comparison: { competitors: ['Zoom'] } };
  const brief = buildBrief(item, { pillarUrl: '/vs/zoom/', pillarName: 'Zoom', spokes: ['/pricing/'], related: [{ path: '/blog/a/', title: 'A', description: 'd' }], competitorClaims: [{ id: 'C07', competitor: 'Zoom', claim: '40 min cap', url: 'https://zoom.com/x', publisher: 'Zoom', accessDate: '2026-09-13' }] });
  const t = briefText(brief);
  assert.ok(t.includes('/vs/zoom/') && t.includes('/blog/a/') && t.includes('[C07]') && t.includes('when Zoom is the better choice'));
  const ctx = { productContext: 'CTX' };
  const w = writerPrompt(brief, ctx);
  assert.ok(w.system.startsWith('CTX') && w.system.includes('===META===') && w.user.includes('/vs/zoom/'));
  const r = reviewerPrompt(goodArticle(), brief, ctx);
  for (const k of Object.keys(POLICY.editorial_review.dimensions)) assert.ok(r.system.includes(`"${k}"`));
  assert.ok(r.system.includes('Q11'));
  const e = editorPrompt(goodArticle(), brief, ctx);
  assert.ok(e.system.includes('20-30 percent') || e.system.includes('shorter'));
  const rp = repairPrompt(goodArticle(), brief, [{ code: 'X', msg: 'fix x' }], { repairInstructions: ['do y'], claims: [{ text: 'bad', kind: 'ollasync', supported: false }] }, ctx);
  assert.ok(rp.user.includes('[X] fix x') && rp.user.includes('[REVIEWER 1] do y') && rp.user.includes('[UNSUPPORTED 1 ollasync] "bad"'));
  assert.ok(!rp.system.includes('counts as not fixed'), 'the prompt promises no check the engine does not perform');
  const ip = intentPrompt(brief, [{ path: '/vs/zoom/', title: 'Zoom', description: 'd', headings: ['h'] }]);
  assert.ok(ip.user.includes('/vs/zoom/') && ip.system.includes('sameIntent'));
  const noClaims = briefText(buildBrief(item, { pillarUrl: '/vs/zoom/', pillarName: 'Zoom' }));
  assert.ok(noClaims.includes('say nothing specific about any competitor'));
});
