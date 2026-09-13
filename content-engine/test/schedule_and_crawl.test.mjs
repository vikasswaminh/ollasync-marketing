// Schedule: the policy asks for 10:00 Asia/Kolkata daily. The operator chose on-demand runs from a workstation
// (no unattended scheduler), so what is tested is the documented schedule line in README.md: it must be the
// 10:00 IST slot expressed in UTC, ready to paste into a cron or a task scheduler.
// Crawl: opt-in with CRAWL=1 (network) — OAI-SearchBot and Googlebot must fetch a post with its article text.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ENGINE_DIR, POLICY } from '../engine/config.mjs';

test('the documented daily schedule is 10:00 Asia/Kolkata', () => {
  const readme = readFileSync(join(ENGINE_DIR, 'README.md'), 'utf8');
  const m = readme.match(/^(\d+) (\d+) \* \* \* .*run\.mjs/m);
  assert.ok(m, 'README documents a cron line for run.mjs');
  const minute = Number(m[1]);
  const hourUtc = Number(m[2]);
  const ist = (hourUtc * 60 + minute + 330) % 1440; // IST = UTC + 5:30, no DST
  assert.equal(`${String(Math.floor(ist / 60)).padStart(2, '0')}:${String(ist % 60).padStart(2, '0')}`, POLICY.content_engine.daily_execution_time);
  assert.equal(POLICY.content_engine.timezone, 'Asia/Kolkata');
});

test('OAI-SearchBot and Googlebot can fetch a published post (network, CRAWL=1)', { skip: !process.env.CRAWL }, async () => {
  const robots = await (await fetch('https://www.ollasync.com/robots.txt')).text();
  const blocks = robots.split(/\n\s*\n/);
  for (const ua of ['OAI-SearchBot', 'Googlebot', 'GPTBot']) {
    const own = blocks.find((b) => new RegExp(`user-agent:\\s*${ua}`, 'i').test(b));
    if (own) assert.ok(!/disallow:\s*\/\s*$/im.test(own), `${ua} is not blocked`);
  }
  for (const ua of ['OAI-SearchBot/1.0; +https://openai.com/searchbot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)']) {
    const r = await fetch('https://www.ollasync.com/blog/how-live-voice-translation-works-in-class/', { headers: { 'User-Agent': ua } });
    assert.equal(r.status, 200, ua);
    const html = await r.text();
    assert.ok(html.includes('<article') && /BlogPosting/.test(html), `${ua} sees the article`);
  }
});
