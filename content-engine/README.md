# Ollasync content engine

Writes blog articles for the marketing site from a 50-item editorial manifest, under the persistent policy in
[`policy.json`](policy.json) (`ollasync_seo_content_engine_master_policy` v1.0). Everything lives in `marketing-site/`:
the engine never touches the app, the VM or anything outside the static site. Nothing publishes on its own — an
approved article becomes a draft file (dry run) or a file in `src/content/blog/` on a branch you merge.

## How it works

```
select → cannibalization (TF-IDF + intent check) → product facts → competitor claims (live-checked) → brief
       → writer (temperature 0.45) → editor pass (writer route, the policy's human-editor rules) → deterministic gates
       → independent review (a different model that never edits the text it scores)
       → at most ONE repair pass → originality check → draft | site file → run record (tokens, cost, scores)
```

- **Facts:** [`product-facts.json`](product-facts.json) is the only source of Ollasync statements the writer may make
  (each fact points at where the public site says it; `test/facts_drift.test.mjs` re-derives the countable ones).
  [`competitor-facts.json`](competitor-facts.json) holds quoted claims from official pages; before every use the
  engine re-fetches the page and drops any claim whose quote is gone. Fetched pages never reach a model.
- **Gates** ([`engine/gates.mjs`](engine/gates.mjs)): one H1 (from the title), heading hierarchy, 900–2600 words,
  intro that answers within ~150 words, 1–3 question headings with 40–100-word answers (no repeats across articles),
  the pillar link, 2–4 related articles, ≤ 8 internal links, canonical link form, descriptive anchors, no external
  images/embeds, the policy's forbidden phrases, the site's own no-leak patterns (read from `scripts/mkt_no_leak.sh`),
  invented-fact patterns (certifications, EU hosting, self-hosting, customers, latency, statistics, language counts),
  keyword stuffing, two original-insight sections citing fact ids, comparison fairness, cadence checks.
- **Review** ([`engine/stages.mjs`](engine/stages.mjs)): the reviewer model scores the policy's nine dimensions
  (≥ 85 approve, 75–84 one repair, < 75 block), maps every claim to a fact or a source, and lists repair
  instructions. After a failed repair the article is blocked and kept as `drafts/blocked-<slug>.md`.
- **Originality:** TF-IDF cosine against every built page and post plus the other drafts of the run; ≥ 0.82 blocks.
  Lexical neighbours get a model intent check before any draft is paid for; same intent → blocked with the page to
  expand instead.
- **Models** ([`engine/llm.mjs`](engine/llm.mjs)): your gateway first when configured, OpenRouter second, with the
  same request shape the app uses for AI notes (fallback `models`, pinned hosts, `allow_fallbacks:false`,
  `data_collection:"deny"`, reasoning off). Preflight refuses any OpenRouter model over the $1/M output-price
  ceiling (prices from OpenRouter's public model list, cached a day) and a reviewer that equals the writer.
- **Budgets:** per article and per run (cost, tokens, minutes); five articles per Asia/Kolkata day across all runs.
- **State:** [`manifest.json`](manifest.json) is the state machine (`planned → researching → drafting → review →
  repair → approved → published | blocked`); `work/<id>/` keeps each stage so an interrupted run resumes without
  paying twice; `runs/*.json` is the ledger; `questions.json` prevents repeated FAQ questions; `.lock` stops overlap.

## Running it (from this workstation)

```bash
cd marketing-site && npm run build && cd ..            # the corpus and link checks read the built site
export OPENROUTER_API_KEY=...                            # from cf.txt — never committed, never printed
export OPENROUTER_PROVIDERS="CoreWeave,Parasail,DeepInfra,Google AI Studio,Google,OpenAI"
export LLM_GATEWAY_ENDPOINT=http://<gateway>/v1/chat/completions LLM_GATEWAY_KEY=... LLM_GATEWAY_MODEL_CONTENT=<local model>   # optional: your gateway first
node marketing-site/content-engine/engine/run.mjs --dry-run --batch 1          # five drafts into drafts/, nothing published
node marketing-site/content-engine/engine/run.mjs --report                     # costs per article + run, flips live URLs to published
node marketing-site/content-engine/engine/run.mjs --promote b1-01              # move an approved draft into src/content/blog/
node marketing-site/content-engine/engine/run.mjs --publish pr --limit 5       # approved articles straight into the site + back-links
node marketing-site/content-engine/engine/run.mjs --open-pr                    # branch content/<date>, commit, push, PR (gh)
node marketing-site/content-engine/engine/analytics.mjs                        # Search Console CSVs in analytics/ → summary.json (git-ignored)
```

Flags: `--limit N` (never above 5), `--only <id>`, `--retry <id>` (a blocked item, regenerated from scratch), `--fresh <id>` (discard its
stage artifacts), `--batch N`. Environment: `OPENROUTER_MODEL_CONTENT` (default
`google/gemini-2.5-flash-lite,deepseek/deepseek-v4-flash-0731`), `OPENROUTER_MODEL_CONTENT_REVIEW`
(default `qwen/qwen3-32b,nvidia/nemotron-3.5-lightning` — the writer and reviewer lists must not share a model, so a
fallback can never review its own draft), `LLM_GATEWAY_MODEL_CONTENT_REVIEW`,
`MAX_COST_PER_RUN_USD` (1.5), `MAX_COST_PER_ARTICLE_USD` (0.25), `MAX_TOKENS_PER_ARTICLE` (60000),
`MAX_RUN_MINUTES` (150), `MAX_OUTPUT_PRICE_USD_PER_M` (1.0), `WRITER_TEMPERATURE` (0.45).

Publishing an approved article: merge the content PR, then deploy the site as usual (`npm run build` +
`scripts/mkt_deploy.sh main` + `node scripts/indexnow_ping.mjs`). `--report` marks an item `published` once its URL
answers 200.

## Schedule

The policy's slot is 10:00 Asia/Kolkata daily. The operator runs the engine on demand from this workstation (no
unattended scheduler was installed). When a scheduler is wanted, the slot in UTC is:

```
30 4 * * * cd /path/to/quick && node marketing-site/content-engine/engine/run.mjs --limit 5 >> content-engine.log 2>&1
```

(10:00 IST = 04:30 UTC; India has no daylight-saving time.) Windows Task Scheduler: daily 10:00, action
`node marketing-site/content-engine/engine/run.mjs --limit 5`, start in the repo root, with the environment above.

## Tests

`node --test marketing-site/content-engine/test/*.test.mjs` (offline; runs in the CI marketing job). `CRAWL=1` adds the live
OAI-SearchBot / Googlebot fetch. The built-site checks (`scripts/mkt_seo_audit.mjs`) run in the same suite when
`marketing-site/dist` exists and as deploy gate 4.

## Limits stated plainly

Similarity is lexical plus a model judgement, not embeddings. Competitor claims are only as current as their verified
quotes. The reviewer and writer share blind spots; the deterministic gates, the editor pass and your read of the
drafts are the backstops. Search Console is not verified yet, so the analytics loop has no data; conversions and
AI-referral traffic cannot be attributed with the edge page-view analytics the site has.
