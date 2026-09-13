import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import { Store, validateManifest, selectItems } from '../engine/state.mjs';
import { ENGINE_DIR, POLICY } from '../engine/config.mjs';
import { tempState, manifestItem } from './fixtures.mjs';

test('the committed manifest is valid: 50 items, every required field, the policy statuses, 5 per batch', () => {
  const m = JSON.parse(readFileSync(join(ENGINE_DIR, 'manifest.json'), 'utf8'));
  assert.equal(m.items.length, 50);
  assert.deepEqual(validateManifest(m), []);
  const titles = Object.values(POLICY['50_article_plan']).flat();
  assert.deepEqual(m.items.map((i) => i.title), titles, 'titles and order follow the policy plan');
  for (const it of m.items) for (const k of POLICY.editorial_manifest.required_fields_per_article) assert.ok(k in it, `${it.id} has ${k}`);
  assert.ok(m.items.some((i) => i.status === 'blocked' && i.collision?.decision === 'consolidate'), 'the known collision is pre-marked');
});

test('validateManifest rejects bad statuses, duplicate slugs and oversized batches', () => {
  const bad = { items: [manifestItem(1, { status: 'draft' }), manifestItem(2, { slug: 'test-article-1' })] };
  const errs = validateManifest(bad);
  assert.ok(errs.some((e) => e.includes('status draft')));
  assert.ok(errs.some((e) => e.includes('duplicate slug')));
  const six = { items: Array.from({ length: 6 }, (_, i) => manifestItem(i + 1)) };
  assert.ok(validateManifest(six).some((e) => e.includes('cap 5')));
});

test('selection: planned only, batch filter, limit, per-day cap, retry for blocked, nothing beyond the manifest', () => {
  const m = { items: [manifestItem(1), manifestItem(2, { status: 'blocked' }), manifestItem(3, { status: 'approved' }), manifestItem(4, { batch: 2 }), manifestItem(5, { status: 'drafting' })] };
  assert.deepEqual(selectItems(m, { only: null, retry: null, batch: null, limit: 5 }).map((i) => i.id), ['b1-01', 'b1-04', 'b1-05'], 'blocked and approved are never re-attempted; an in-flight item resumes');
  assert.deepEqual(selectItems(m, { only: null, retry: null, batch: 1, limit: 5 }).map((i) => i.id), ['b1-01', 'b1-05']);
  assert.deepEqual(selectItems(m, { only: null, retry: null, batch: null, limit: 1 }).map((i) => i.id), ['b1-01']);
  assert.deepEqual(selectItems(m, { only: null, retry: null, batch: null, limit: 5 }, 5), [], 'five attempts already today → nothing more today');
  assert.deepEqual(selectItems(m, { only: null, retry: null, batch: null, limit: 5 }, 4).map((i) => i.id), ['b1-01'], 'four attempts today → one left');
  assert.deepEqual(selectItems(m, { only: null, retry: 'b1-02', batch: null, limit: 5 }).map((i) => i.id), ['b1-02'], '--retry re-opens a blocked item');
  assert.deepEqual(selectItems(m, { only: 'b1-02', retry: null, batch: null, limit: 5 }), [], '--only never runs a blocked item');
  const done = { items: [manifestItem(1, { status: 'published' }), manifestItem(2, { status: 'blocked' })] };
  assert.deepEqual(selectItems(done, { only: null, retry: null, batch: null, limit: 5 }), [], 'a finished manifest generates nothing');
});

test('the lock refuses a second run and breaks a stale one', () => {
  const dir = tempState([manifestItem(1)]);
  const s = new Store(dir);
  assert.equal(s.lock(), true);
  assert.equal(s.lock(), false, 'second holder refused');
  const old = new Date(Date.now() - 9 * 3600 * 1000);
  utimesSync(s.lockPath, old, old);
  assert.equal(s.lock(), true, 'a 9-hour-old lock is stale');
  s.unlock();
  assert.equal(existsSync(s.lockPath), false);
});

test('manifest saves are atomic and validated; work artifacts round-trip; the per-day count spans runs', () => {
  const dir = tempState([manifestItem(1)]);
  const s = new Store(dir);
  const m = s.loadManifest();
  s.setStatus(m, m.items[0], 'drafting');
  assert.equal(s.loadManifest().items[0].status, 'drafting');
  assert.throws(() => s.setStatus(m, m.items[0], 'nope'));
  assert.equal(existsSync(join(dir, 'manifest.json.tmp')), false);
  s.saveWork('b1-01', 'draft.json', { title: 't' });
  assert.deepEqual(s.loadWork('b1-01', 'draft.json'), { title: 't' });
  s.saveWork('b1-01', 'final.md', '# x');
  assert.equal(s.loadWork('b1-01', 'final.md'), '# x');
  s.clearWork('b1-01');
  assert.equal(s.loadWork('b1-01', 'draft.json'), null);
  const r1 = s.newRun({});
  r1.attempted.push('b1-01', 'b1-02');
  s.saveRun(r1);
  const r2 = s.newRun({});
  r2.attempted.push('b1-03');
  s.saveRun(r2);
  assert.equal(s.attemptsOn(r1.istDate), 3);
});
