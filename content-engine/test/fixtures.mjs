// Shared fixtures: a passing article, a two-item manifest, fake model replies.
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const POOL = [
  'A trainer who has taught the same programme for years notices the small things first.',
  'Nothing installs.',
  'Learners open a link, see the class, and the first minute is spent on the subject instead of on software.',
  'That is the difference a classroom makes before anyone has said a word about translation, notes or replays, and it shows up in how a cohort settles.',
  'Numbers stay numbers.',
  'Attendance is kept with the session.',
  'A wrap-up mail lands when the class ends, so the host knows who was there without a spreadsheet.',
  'The replay opens only for the people the host allows, which matters when a client paid for a cohort.',
  'Some limits are real: five languages in one session, machine translation rather than an interpreter, and no notes on an encrypted class.',
  'Say so to clients.',
  'The hour after class used to be admin; now it is a few switches and a check that the notes read well.',
  'Pace matters more than volume when a sentence completes a beat later in another language.',
];

/** ~n words of varied prose, starting at a different sentence for each section so openers differ */
export function para(section, n = 120) {
  const out = [];
  let i = section * 3;
  let words = 0;
  while (words < n) {
    const s = POOL[i++ % POOL.length];
    out.push(s);
    words += s.split(' ').length;
  }
  return out.join(' ');
}

export const PILLAR = '/virtual-classroom-software/';
export const EXISTING = new Set([PILLAR, '/use-cases/trainers/', '/features/ai/', '/pricing/', '/blog/existing-a/', '/blog/existing-b/', '/blog/', '/']);

export function goodArticle(overrides = {}) {
  const body = [
    para(0, 90),
    '',
    '## Why a classroom is not a meeting',
    para(1, 140),
    '',
    '### What changes for the learner',
    para(2, 110),
    '',
    '## How do learners join a class without installing anything?',
    'Learners open the class link in a modern browser on a laptop or a phone; there is nothing to install and no account to create for an invited guest. The host can add a short message to the invitation, so a first-time learner knows what to expect before the session starts.',
    '',
    para(3, 100),
    '',
    '## The hour after class',
    `${para(4, 120)} The [virtual classroom software](${PILLAR}) page describes the whole workflow, and [attendance for every session](/use-cases/trainers/) explains the trainer side. See also [what a server can see](/blog/existing-a/).`,
    '',
    '## Five languages in one session',
    `${para(5, 130)} A related piece, [notes that write themselves](/blog/existing-b/), covers the notes side.`,
    '',
    '## What to do next',
    para(6, 110),
  ].join('\n');
  return {
    title: 'What a virtual classroom changes for a trainer',
    description: 'How a virtual classroom differs from a meeting tool for paid training: joining, languages, attendance, notes and replays, with the limits stated plainly.',
    takeaways: ['Learners join from a browser link.', 'Attendance and notes come out of the session.', 'Five languages per session is a real limit.'],
    insights: [{ heading: 'The hour after class', factIds: ['F11', 'F12'] }, { heading: 'Five languages in one session', factIds: ['F02'] }],
    questions: ['How do learners join a class without installing anything?'],
    sourcesUsed: [],
    body,
    ...overrides,
  };
}

export function gateCtx(overrides = {}) {
  return {
    item: { id: 'b1-01', primaryQuery: 'what is a virtual classroom' },
    pillarUrl: PILLAR,
    existingPaths: EXISTING,
    allowedSlugs: new Set(),
    existingTitles: new Map([['existing title', '/blog/existing-a/']]),
    sameRunTitles: new Set(),
    forbidden: ['In today\'s fast-paced digital world', 'Let\'s dive in', 'game-changer', 'seamlessly', 'In conclusion'],
    leakPatterns: [{ name: 'vendor/infra name', re: /livekit|openrouter/i }, { name: 'EU-hosting claim', re: /hosted in the eu\b/i }],
    factIds: new Set(['F01', 'F02', 'F11', 'F12']),
    sourceUrls: new Set(),
    registry: [],
    relatedCandidates: 2,
    ...overrides,
  };
}

export function envelope(article) {
  return `===META===\n${JSON.stringify({ title: article.title, description: article.description, takeaways: article.takeaways, insights: article.insights, questions: article.questions, sourcesUsed: article.sourcesUsed, ...(article.repairs ? { repairs: article.repairs } : {}) })}\n===BODY===\n${article.body}`;
}

export function reviewJSON({ total = 90, unsupported = [], insights = 2, claims = [] } = {}) {
  const dims = { search_intent_satisfaction: 15, factual_accuracy: 20, original_first_hand_value: 20, natural_human_editorial_quality: 15, specificity: 10, clarity: 5, non_duplicate_topic_value: 5, internal_linking: 5, technical_seo: 5 };
  const scores = {};
  let left = total;
  for (const [k, w] of Object.entries(dims)) {
    const v = Math.min(w, left);
    scores[k] = v;
    left -= v;
  }
  return JSON.stringify({ scores, total, answers: { Q1: 'No.' }, claims: [...unsupported.map((t) => ({ text: t, kind: 'ollasync', supported: false, ref: null })), { text: 'learners join from a browser', kind: 'ollasync', supported: true, ref: 'F08' }, ...claims], insightSections: Array.from({ length: insights }, (_, i) => ({ heading: `Section ${i}`, factIds: ['F11'] })), repairInstructions: total < 85 ? ['Tighten the introduction.'] : [], summary: 'ok' });
}

/** a temp state dir with a two-item manifest (copies of the real batch-1 shape) */
export function tempState(items) {
  const dir = mkdtempSync(join(tmpdir(), 'ce-'));
  mkdirSync(join(dir, 'drafts'), { recursive: true });
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ version: 1, items }, null, 2));
  return dir;
}

export function manifestItem(n, extra = {}) {
  return {
    id: `b1-0${n}`, status: 'planned', batch: 1, scheduledDay: 1, slug: `test-article-${n}`, title: `Test article ${n}`, primaryPillar: 'pillar_1', primaryQuery: `test query ${n}`, secondaryQueries: ['q'], searchIntent: 'informational', audience: 'trainers', funnelStage: 'awareness', uniqueAngle: `angle ${n}`, requiredOriginalInsights: ['one', 'two'], internalLinkTargets: [PILLAR], researchRequired: false, publishedUrl: null, qualityScore: null, writerModel: null, reviewerModel: null, cost: 0, attempts: [], ...extra,
  };
}

/** a fake LLM whose replies are chosen per stage; records calls */
export function fakeLLM(replies) {
  const calls = [];
  const ledger = [];
  return {
    calls,
    ledger,
    async chat(req) {
      calls.push(req);
      const r = replies[req.stage];
      const content = typeof r === 'function' ? r(req, calls.filter((c) => c.stage === req.stage).length) : r;
      const model = req.task === 'content_writer' ? 'writer/model' : 'reviewer/model';
      if (content instanceof Error) {
        const row = { articleId: req.articleId, stage: req.stage, task: req.task, route: 'openrouter', model, provider: 'X', in: 1000, out: 0, cost: 0.0004, latencyMs: 5, status: 'error', error: content.message };
        ledger.push(row);
        if (typeof this.onRecord === 'function') this.onRecord(row);
        throw content;
      }
      const row = { articleId: req.articleId, stage: req.stage, task: req.task, route: 'openrouter', model, provider: 'X', in: 1000, out: 500, cost: 0.001, latencyMs: 5, status: 'ok' };
      ledger.push(row);
      if (typeof this.onRecord === 'function') this.onRecord(row);
      return { content, route: 'openrouter', model: req.task === 'content_writer' ? 'writer/model' : 'reviewer/model', provider: 'X', in: 1000, out: 500, latencyMs: 5, cost: 0.001 };
    },
    totals(articleId = null) {
      const rows = ledger.filter((l) => articleId === null || l.articleId === articleId);
      return rows.reduce((t, l) => ({ in: t.in + l.in, out: t.out + l.out, costUsd: t.costUsd + l.cost, calls: t.calls + (l.status === 'ok' ? 1 : 0) }), { in: 0, out: 0, costUsd: 0, calls: 0 });
    },
  };
}
