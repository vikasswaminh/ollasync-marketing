import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { TfIdf, tokenize, noLeakPatterns, parseFrontmatter, loadCorpus } from '../engine/corpus.mjs';
import { REPO_DIR, SITE_DIR, POLICY } from '../engine/config.mjs';

const docs = [
  { key: '/a/', title: 'How live voice translation works in an online class', description: 'The recognition, translation and delivery pipeline for a live class.', headings: ['Recognition', 'Translation', 'Delivery'], text: 'A trainer speaks English and a learner hears Hindi. The pipeline is speech recognition, then machine translation, then delivery as captions or spoken audio, running continuously while the trainer teaches. Latency feels like listening through an interpreter.' },
  { key: '/b/', title: 'Recording economics for long training sessions', description: 'What a two-hour class costs to record and keep.', headings: ['Storage', 'Retention', 'Local recording'], text: 'A two hour session produces a large recording. Retention policies, access control and local recording on the learner device change the storage bill. Cloud replays are convenient but they accumulate.' },
  { key: '/c/', title: 'HIPAA compliant video conferencing checklist', description: 'BAAs, encryption, access controls and audit logs for telehealth.', headings: ['BAA', 'Encryption', 'Audit'], text: 'Healthcare providers need a business associate agreement, encryption in transit and at rest, access controls, audit logs and retention policies for telehealth video.' },
];

test('near-duplicates score at or above the 0.82 block threshold; distinct topics score low', () => {
  const idx = new TfIdf(docs);
  const dup = 'How live voice translation works in an online class. The recognition, translation and delivery pipeline for a live class. A trainer speaks English and a learner hears Hindi: speech recognition, then machine translation, then delivery as captions or spoken audio while the trainer teaches. It feels like listening through an interpreter. Recognition. Translation. Delivery.';
  const top = idx.similar(dup, 1)[0];
  assert.equal(top.doc.key, '/a/');
  assert.ok(top.score >= POLICY.cannibalization_and_duplicate_protection.semantic_similarity_block_threshold, `duplicate scored ${top.score.toFixed(2)}`);
  const distinct = 'What to ask a vendor about per-seat pricing for a training academy: seats versus learners, replay libraries and invoices.';
  const best = idx.similar(distinct, 1)[0];
  assert.ok(best.score < 0.5, `distinct topic scored ${best.score.toFixed(2)}`);
  const related = 'Why recording a long class on the learner device keeps storage bills down: local recording, retention and access control for replays.';
  assert.equal(idx.similar(related, 1)[0].doc.key, '/b/', 'a related topic finds its neighbour');
});

test('tokenizer drops stopwords and adds bigrams', () => {
  const t = tokenize('The trainer speaks English and the learner hears Hindi');
  assert.ok(t.includes('trainer') && t.includes('trainer_speaks') && !t.includes('the'));
});

test('the no-leak patterns come from the site guard script and catch vendor names, the bus name and EU claims', () => {
  const pats = noLeakPatterns(join(REPO_DIR, 'scripts', 'mkt_no_leak.sh'));
  assert.equal(pats.length, 3);
  const hit = (s) => pats.filter((p) => p.re.test(s)).map((p) => p.name);
  assert.deepEqual(hit('we run on LiveKit'), ['vendor/infra name']);
  assert.deepEqual(hit('the NATS bus'), ['messaging-bus name']);
  assert.deepEqual(hit('nats and firewalls are networking terms'), []);
  assert.deepEqual(hit('Hosted in the EU for you'), ['EU-hosting claim']);
  assert.deepEqual(hit('supports 50+ languages'), ['vendor/infra name']);
  assert.deepEqual(hit('Zoom, Teams and Meet are meeting tools; WebRTC and TLS are standards'), []);
});

test('frontmatter parsing handles quoted scalars, inline and block arrays', () => {
  const { data, body } = parseFrontmatter('---\ntitle: "A title: with colon"\npubDate: 2026-09-01\nkeywords: ["one", "two"]\ntakeaways:\n  - "first"\n  - second\ndraft: false\n---\n# Body\n');
  assert.equal(data.title, 'A title: with colon');
  assert.deepEqual(data.keywords, ['one', 'two']);
  assert.deepEqual(data.takeaways, ['first', 'second']);
  assert.equal(data.draft, false);
  assert.equal(body.trim(), '# Body');
});

test('loadCorpus reads the real blog source when no build exists and every planned item', () => {
  const warned = [];
  const manifest = { items: [{ id: 'x', slug: 'x', title: 'X', primaryQuery: 'q', secondaryQueries: [], searchIntent: 'i', uniqueAngle: 'a', status: 'planned' }] };
  const c = loadCorpus({ distDir: join(SITE_DIR, 'does-not-exist'), blogSrcDir: join(SITE_DIR, 'src', 'content', 'blog'), manifest, warn: (m) => warned.push(m) });
  assert.ok(c.docs.filter((d) => d.kind === 'post').length >= 26);
  assert.ok(c.paths.has('/blog/how-live-voice-translation-works-in-class/'));
  assert.equal(c.docs.filter((d) => d.kind === 'planned').length, 1);
  assert.equal(warned.length, 1);
});
