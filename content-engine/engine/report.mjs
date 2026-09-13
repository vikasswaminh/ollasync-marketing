// Cost + status reporting (policy cost_reporting): per article — writer/reviewer models, tokens, stage costs; per
// run — attempted/approved/published/blocked, tokens, cost; plus the projection for the articles still planned.
// `--report` also probes the live URL of approved items and flips them to `published` when the page answers 200.
/** totals from the persisted call rows (written after every call), so an interrupted run still reports what it paid */
export function runTotals(r) {
  if (Array.isArray(r.calls) && r.calls.length) {
    return r.calls.reduce((t, c) => ({ in: t.in + (c.in || 0), out: t.out + (c.out || 0), costUsd: Number((t.costUsd + (c.cost || 0)).toFixed(4)) }), { in: 0, out: 0, costUsd: 0 });
  }
  return { in: r.totals?.in ?? 0, out: r.totals?.out ?? 0, costUsd: r.totals?.costUsd ?? 0 };
}

export async function report(store, cfg, { fetchImpl = fetch, live = true } = {}) {
  const m = store.loadManifest();
  const runs = store.runs();
  const lines = [];
  let flipped = 0;
  if (live) {
    for (const it of m.items.filter((x) => x.status === 'approved' && x.sitePath)) {
      const url = `${cfg.siteUrl}/blog/${it.slug}/`;
      try {
        const r = await fetchImpl(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });
        if (r.ok) {
          it.status = 'published';
          it.publishedUrl = url;
          it.publishedAt = new Date().toISOString();
          flipped++;
        }
      } catch { /* not live yet */ }
    }
    if (flipped) store.saveManifest(m);
  }
  const counts = {};
  for (const it of m.items) counts[it.status] = (counts[it.status] || 0) + 1;
  lines.push(`# Content engine report — ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');
  lines.push(`Manifest: ${m.items.length} items — ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')}${flipped ? ` (${flipped} flipped to published just now)` : ''}`);
  lines.push('');
  lines.push('## Runs');
  lines.push('| run | IST day | attempted | approved | blocked | tokens in/out | cost USD | stopped |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const r of runs) {
    const t = runTotals(r);
    lines.push(`| ${r.id} | ${r.istDate} | ${r.attempted.length} | ${r.approved.length} | ${r.blocked.length} | ${t.in}/${t.out} | ${t.costUsd.toFixed(4)} | ${r.refused ? `refused: ${r.refused.reason}` : r.finished ? r.stopped || '' : 'interrupted'} |`);
  }
  lines.push('');
  lines.push('## Articles');
  lines.push('| id | run outcome → now | score | writer | reviewer | tokens in/out | write | edit | review | repair | total USD | note |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
  const perArticle = [];
  for (const r of runs) {
    for (const [id, a] of Object.entries(r.articles || {})) {
      const st = a.stages || {};
      const c = (k) => (st[k] ? st[k].costUsd.toFixed(4) : '-');
      const it = m.items.find((x) => x.id === id) || {};
      if (Object.keys(a.stages || {}).length) perArticle.push(a.costUsd || 0); // every article a model was called for, gateway-served ($0) ones included
      lines.push(`| ${id} | ${a.status}${it.status && it.status !== a.status ? ` → ${it.status}` : ''} | ${a.score ?? '-'} | ${it.writerModel || st.write?.model || '-'} | ${it.reviewerModel || st.review?.model || '-'} | ${a.tokens?.in ?? 0}/${a.tokens?.out ?? 0} | ${c('write')} | ${c('edit')} | ${c('review')}${st.review2 ? `+${c('review2')}` : ''} | ${c('repair')} | ${(a.costUsd || 0).toFixed(4)} | ${(a.reason || '').slice(0, 80)} |`);
    }
  }
  const avg = perArticle.length ? perArticle.reduce((a, b) => a + b, 0) / perArticle.length : 0;
  const remaining = m.items.filter((x) => x.status === 'planned').length;
  lines.push('');
  lines.push(`Average cost per attempted article: $${avg.toFixed(4)} over ${perArticle.length} article(s); planned items remaining: ${remaining}; projected cost for the remaining items at that average: $${(avg * remaining).toFixed(2)}; projected for all 50 at that average: $${(avg * 50).toFixed(2)}.`);
  lines.push('Gateway-served calls carry no OpenRouter cost and appear as $0 in the ledger.');
  return lines.join('\n');
}
