import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deterministicGates, parseArticle, hasBlockers, needsRepair } from '../engine/gates.mjs';
import { goodArticle, gateCtx, PILLAR } from './fixtures.mjs';

const codes = (issues, sev) => issues.filter((i) => !sev || i.severity === sev).map((i) => i.code);

test('a well-formed article passes every deterministic gate', () => {
  const issues = deterministicGates(goodArticle(), gateCtx());
  assert.deepEqual(codes(issues, 'repair'), [], JSON.stringify(issues));
  assert.deepEqual(codes(issues, 'block'), []);
  const art = parseArticle(goodArticle().body);
  assert.ok(art.words.length >= 900);
});

test('forbidden phrases, filler openers and mechanical cadence are rejected', () => {
  const a = goodArticle();
  a.body = `In today's fast-paced digital world, ${a.body}`;
  assert.ok(codes(deterministicGates(a, gateCtx())).includes('FORBIDDEN_PHRASE'));
  const b = goodArticle();
  b.body = b.body.replace('## Why a classroom is not a meeting\n', '## Why a classroom is not a meeting\n\nIn this article we look at classrooms.\n\nWhen it comes to teaching, tools matter.\n\n');
  assert.ok(codes(deterministicGates(b, gateCtx())).includes('GENERIC_OPENERS'));
  const c = goodArticle();
  c.body += '\n\n## Lists\n\n- one\n- two\n- three\n\n- a\n- b\n- c\n\n- x\n- y\n- z\n';
  assert.ok(codes(deterministicGates(c, gateCtx())).includes('THREE_ITEM_LISTS'));
  const d = goodArticle();
  d.body = d.body.replace(/\. /g, ' — ');
  assert.ok(codes(deterministicGates(d, gateCtx())).includes('EM_DASHES'));
});

test('structure: no H1 in the body, question answers 40–100 words, intro within ~150 words', () => {
  const a = goodArticle();
  a.body = `# A heading\n${a.body}`;
  assert.ok(codes(deterministicGates(a, gateCtx())).includes('H1_IN_BODY'));
  const b = goodArticle();
  b.body = b.body.replace('Learners open the class link in a modern browser on a laptop or a phone; there is nothing to install and no account to create for an invited guest. The host can add a short message to the invitation, so a first-time learner knows what to expect before the session starts.', 'They just join from a link in the browser, on a laptop or a phone, with nothing to install.');
  assert.ok(codes(deterministicGates(b, gateCtx())).includes('ANSWER_LENGTH'));
  const long = goodArticle();
  long.body = long.body.replace('so a first-time learner knows what to expect before the session starts.', `so a first-time learner knows what to expect before the session starts. ${'More detail follows here about the same point. '.repeat(14)}`);
  assert.ok(codes(deterministicGates(long, gateCtx())).includes('ANSWER_LENGTH'), 'a 130+ word answer must be split');
  const c = goodArticle();
  c.body = c.body.replace(/^## Why a classroom is not a meeting$/m, '## Why a classroom is not a meeting?').replace('## How do learners join', '## More on how learners join');
  const noQ = goodArticle();
  noQ.body = noQ.body.replace('## How do learners join a class without installing anything?', '## Joining a class');
  assert.ok(codes(deterministicGates(noQ, gateCtx())).includes('NO_QUESTION'));
});

test('links: pillar required, must resolve, canonical form, at most eight, descriptive anchors, sourced externals', () => {
  const a = goodArticle();
  a.body = a.body.replace(`[virtual classroom software](${PILLAR})`, 'virtual classroom software');
  assert.ok(codes(deterministicGates(a, gateCtx())).includes('PILLAR_LINK_MISSING'));
  const b = goodArticle();
  b.body += '\n\nSee [the missing page](/nope/) and [pricing](/pricing).';
  const ib = codes(deterministicGates(b, gateCtx()));
  assert.ok(ib.includes('LINK_BROKEN') && ib.includes('LINK_FORMAT'));
  const c = goodArticle();
  c.body += `\n\n${Array.from({ length: 6 }, (_, i) => `[pricing page ${i}](/pricing/)`).join(' ')}`;
  assert.ok(codes(deterministicGates(c, gateCtx())).includes('LINK_COUNT'));
  const d = goodArticle();
  d.body += '\n\nRead more [here](/pricing/).';
  assert.ok(codes(deterministicGates(d, gateCtx())).includes('ANCHOR_GENERIC'));
  const e = goodArticle();
  e.body += '\n\nSee [Zoom](https://zoom.com/x).';
  assert.ok(codes(deterministicGates(e, gateCtx())).includes('EXTERNAL_UNSOURCED'));
  assert.ok(!codes(deterministicGates(e, gateCtx({ sourceUrls: new Set(['https://zoom.com/x']) }))).includes('EXTERNAL_UNSOURCED'));
});

test('invented facts are caught: certifications, EU hosting, self-hosting, customers, latency numbers, statistics, language counts', () => {
  const cases = [
    ['Ollasync is SOC 2 certified.', 'CERTIFICATION_CLAIM'],
    ['Your data stays in the EU.', 'EU_HOSTING_CLAIM'],
    ['Ollasync can be self-hosted on your servers.', 'SELF_HOST_CLAIM'],
    ['Customers like Acme Corp rely on it.', 'FABRICATED_CUSTOMER'],
    ['Translation arrives in 400 ms.', 'INVENTED_LATENCY'],
    ['73% of trainers prefer it.', 'INVENTED_STATISTIC'],
    ['It supports 50+ languages.', 'LANGUAGE_COUNT_CLAIM'],
  ];
  for (const [sentence, code] of cases) {
    const a = goodArticle();
    a.body += `\n\n${sentence}`;
    assert.ok(codes(deterministicGates(a, gateCtx())).includes(code), `${sentence} → ${code}`);
  }
});

test('fact ids in the prose and a body that stops mid-sentence are caught', () => {
  const a = goodArticle();
  a.body = a.body.replace('Nothing installs.', 'Nothing installs (F08).');
  assert.ok(codes(deterministicGates(a, gateCtx())).includes('FACT_ID_IN_BODY'));
  const b = goodArticle();
  b.body += '\n\nAll these features are optional switches (F25';
  const ib = codes(deterministicGates(b, gateCtx()));
  assert.ok(ib.includes('TRUNCATED') && ib.includes('FACT_ID_IN_BODY'));
  assert.ok(!codes(deterministicGates(goodArticle(), gateCtx())).includes('TRUNCATED'));
});

test('a negated statement is honesty, not an invented claim', () => {
  const cases = [
    'If you need to self-host on your own servers, Ollasync is not the right choice.',
    'Ollasync holds no SOC 2 certification and says so.',
    'Your data does not stay in the EU: the application runs in the US.',
  ];
  for (const sentence of cases) {
    const a = goodArticle();
    a.body += `\n\n${sentence}`;
    const found = codes(deterministicGates(a, gateCtx())).filter((c) => ['SELF_HOST_CLAIM', 'CERTIFICATION_CLAIM', 'EU_HOSTING_CLAIM'].includes(c));
    assert.deepEqual(found, [], `${sentence} → ${found}`);
  }
  const a = goodArticle();
  a.body += '\n\nOllasync can be self-hosted on your servers.';
  assert.ok(codes(deterministicGates(a, gateCtx())).includes('SELF_HOST_CLAIM'), 'the positive claim is still caught');
  const mixed = goodArticle();
  mixed.body += '\n\nOllasync is not self-hosted, but Ollasync is SOC 2 certified.';
  const im = codes(deterministicGates(mixed, gateCtx()));
  assert.ok(im.includes('CERTIFICATION_CLAIM') && !im.includes('SELF_HOST_CLAIM'), 'negation applies to its own clause only');
});

test('leaks, placeholders, external images and embeds are rejected', () => {
  const a = goodArticle();
  a.body += '\n\nWe build on LiveKit.';
  assert.ok(codes(deterministicGates(a, gateCtx())).includes('LEAK'));
  const b = goodArticle();
  b.body += '\n\nTODO add a section.';
  assert.ok(codes(deterministicGates(b, gateCtx())).includes('PLACEHOLDER'));
  const c = goodArticle();
  c.body += '\n\n![](https://example.com/x.png)';
  const ic = codes(deterministicGates(c, gateCtx()));
  assert.ok(ic.includes('EXTERNAL_IMAGE') && ic.includes('IMAGE_ALT'));
  const d = goodArticle();
  d.body += '\n\n<iframe src="https://youtube.com/embed/x"></iframe>';
  assert.ok(codes(deterministicGates(d, gateCtx())).includes('EMBED'));
  const e = goodArticle();
  e.body += '\n\nRead <a href="https://example.com/x">the source</a> and <a href="/nope/">this</a>.';
  const ie = codes(deterministicGates(e, gateCtx()));
  assert.ok(ie.includes('HTML_ANCHOR') && ie.includes('EXTERNAL_UNSOURCED') && ie.includes('LINK_BROKEN') && ie.includes('ANCHOR_GENERIC'), 'raw anchors go through every link gate');
});

test('original insight sections must exist, be headings, and cite known facts; comparisons need the fairness section', () => {
  const a = goodArticle({ insights: [{ heading: 'The hour after class', factIds: ['F11'] }] });
  assert.ok(codes(deterministicGates(a, gateCtx())).includes('INSIGHTS'));
  const ok = goodArticle({ insights: [{ heading: 'The hour after class ends', factIds: ['F11'] }, { heading: 'Five languages in one session', factIds: ['F02'] }] });
  assert.ok(!codes(deterministicGates(ok, gateCtx())).includes('INSIGHT_HEADING'), 'a lightly paraphrased insight heading still matches');
  const b = goodArticle({ insights: [{ heading: 'Not a heading', factIds: ['F11'] }, { heading: 'The hour after class', factIds: ['F99'] }] });
  const ib = codes(deterministicGates(b, gateCtx()));
  assert.ok(ib.includes('INSIGHT_HEADING') && ib.includes('INSIGHT_FACT'));
  const c = goodArticle();
  const ctx = gateCtx({ item: { id: 'b4-01', primaryQuery: 'zoom alternatives', comparison: { competitors: ['Zoom'] } } });
  assert.ok(codes(deterministicGates(c, ctx)).includes('COMPARISON_FAIRNESS'));
  const oneSided = goodArticle();
  oneSided.body += '\n\n## When Ollasync is the better choice than Zoom\n\nFor paid training with a mixed-language cohort.';
  assert.ok(codes(deterministicGates(oneSided, ctx)).includes('COMPARISON_FAIRNESS'), 'a heading that favours Ollasync is not the fairness section');
  const contrast = goodArticle();
  contrast.body += '\n\n## When Zoom, not Ollasync, is the right choice\n\nFor internal status meetings inside a suite the team already pays for.';
  assert.ok(!codes(deterministicGates(contrast, ctx)).includes('COMPARISON_FAIRNESS'));
  c.body += '\n\n## When Zoom is the better choice\n\nIf the sessions are internal status meetings inside a suite, stay with the suite.';
  assert.ok(!codes(deterministicGates(c, ctx)).includes('COMPARISON_FAIRNESS'));
});

test('more than three question headings is a repair issue (the checklist says 1–3)', () => {
  const a = goodArticle();
  const answer = 'Learners open the class link in a modern browser on a laptop or a phone; there is nothing to install and no account to create for an invited guest, and the host can add a short note to the invitation so a first-time learner knows what to expect.';
  a.body += `\n\n## Is a second question fine?\n\n${answer}\n\n## And a third?\n\n${answer}`;
  assert.ok(!codes(deterministicGates(a, gateCtx())).includes('TOO_MANY_QUESTIONS'), 'three questions pass');
  a.body += `\n\n## But a fourth?\n\n${answer}`;
  assert.ok(codes(deterministicGates(a, gateCtx())).includes('TOO_MANY_QUESTIONS'));
});

test('planned link targets from the manifest are checked (a warning, never a block)', () => {
  const ctx = gateCtx({ plannedLinks: ['/virtual-classroom-software/', '/pricing/', '/features/ai/'] });
  const issues = deterministicGates(goodArticle(), ctx);
  const pl = issues.find((i) => i.code === 'PLANNED_LINKS');
  assert.ok(pl && pl.severity === 'warn' && pl.msg.includes('/pricing/'), 'unlinked planned targets are reported');
  const a = goodArticle();
  a.body += '\n\nSee the [pricing page](/pricing/) and [AI notes](/features/ai/).';
  assert.ok(!deterministicGates(a, ctx).some((i) => i.code === 'PLANNED_LINKS'));
});

test('duplicate titles block; repeated questions and keyword stuffing need repair', () => {
  const a = goodArticle({ title: 'Existing Title' });
  const ia = deterministicGates(a, gateCtx());
  assert.ok(hasBlockers(ia) && codes(ia, 'block').includes('TITLE_DUP'));
  const b = goodArticle();
  assert.ok(codes(deterministicGates(b, gateCtx({ registry: ['how do learners join a class without installing anything'] }))).includes('QUESTION_REPEAT'));
  const c = goodArticle();
  c.body += `\n\n${Array.from({ length: 10 }, () => 'what is a virtual classroom').join(' and ')}.`;
  const ic = deterministicGates(c, gateCtx());
  assert.ok(needsRepair(ic) && codes(ic).includes('KEYWORD_STUFFING'));
});
