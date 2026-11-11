# Ollasync SEO strategy — built around "AI Classroom with Live Voice Translation" (2026-08-31, v2)

Internal doc — not built into `dist/`. Every piece of public copy MUST pass `scripts/mkt_no_leak.sh`
(no internal vendor/stack names; open standards only) and the honesty rules: only the shipped translate
languages in `src/data/languages.ts` (`LANG_COUNT`, 19 since 2026-09-06 — never a bigger number, never a
language not listed there), no certification claims, captions exist but are not the pitch. Ollasync is cloud SaaS with a self-hosted option for regulated industries (operator, 2026-11-06); state it, without install or infrastructure specifics. Prices only from `/pricing` (per seat: Free, Pro $5, Business $19); never "cheapest" — link `/vs/#translation-pricing`. Meetings cap at 100 people; webinars are parked.

## SEO publishing checks (2026-11-10)

- The blog layout renders the article title as the page's only H1. Start body sections at H2; do not repeat the frontmatter title in the body.
- Category breadcrumb labels without a published landing page remain plain text. Only the final breadcrumb is marked as the current page; non-linked intermediate labels are omitted from breadcrumb JSON-LD.
- After a build, run `npm run test:seo` to check page H1 counts, breadcrumb destinations, current-page semantics, and breadcrumb schema. This checks generated HTML, not production index coverage or Core Web Vitals.
- Article merges, redirects, and substantive claim corrections require separate editorial approval. The blog now has four topic hubs (`/blog/topics/*/`), 18-post static listing pages (`/blog/page/2/`, etc.), and responsive WebP listing/article covers. Articles with no clear fit in these four hubs remain accessible through the general blog and related links; no article URLs or claims are rewritten. Topic assignments live in `src/data/blogTopics.ts` and should be reviewed editorially as the library evolves.
- Run `npm run build` followed by `npm run test:seo` after editing routes or topic assignments. The check covers paginated article coverage, four hubs, topic listing coverage, breadcrumbs and canonical URLs. Search Console and field Core Web Vitals remain a later stage.

## Homepage brand search (2026-11-10)

The homepage title starts with "Ollasync" and describes multilingual video meetings with live translation; its description names the brand. The selected brand theme and homepage H1 are "Meet beyond language." The supporting hero line explains the product in plain language, while the language ribbon uses `LANG_COUNT` from `src/data/languages.ts` rather than an unsupported 99-language claim. After deployment, use Google Search Console URL Inspection for `https://www.ollasync.com/` to check index status, selected canonical, crawlability, and last crawl; submit the sitemap or request a recrawl if appropriate. Metadata changes alone cannot guarantee branded rankings or indexing.

## Discovery and update process (2026-11-11)

On deployment, `npm run build` regenerates the sitemap and RSS feed; `npm run generate:llms` replaces `dist/llms.txt` with current canonical product and topic links plus the thirty most recent published posts. `npm run test:seo` checks that sitemap, robots, llms, and security contact files agree and that `security.txt` is not expired. `robots.txt` and `security.txt` are static: update them only when policy/contact details change. The security mailbox must be checked operationally, and `Expires` renewed before expiry; build validation cannot verify that messages are delivered. Non-blog sitemap dates now use the last committed change to the page or shared layout instead of every build timestamp; blog article dates use published/updated frontmatter. Uncommitted preview builds may show the last commit date until changes are committed.

Production does not update until a successful main-branch deployment. After deploy, smoke-test these endpoints and use Search Console for actual indexing evidence. `llms.txt` is an optional discovery aid, not a guarantee of AI citation or ranking.

## 0. The flagship

Everything hangs off one phrase, approved as the site's identity:

> **AI Classroom & Zoom Alternative for Trainers | Ollasync** (2026-09-12: the home title took the "Zoom
> alternative" angle on the operator's decision; the site description names it too. The pillar phrase "AI classroom
> with live voice translation" stays the semantic center of the cluster and the hero's brand line is unchanged.)

It is the homepage `<title>`, the leading phrase of `SITE.description` (which feeds the org/site
JSON-LD and every default OG description), and the semantic center every other page links back to.
The brand voice stays separate and untouched: heroes keep "Teach anyone. In any language."
Rule: **titles sell the category, heroes sell the feeling.**

## 1. Pillar-and-cluster architecture

```
                    /  (PILLAR: ai classroom with live voice translation)
                    │
   ┌────────────┬───┴─────────┬──────────────┬───────────────┐
 /features    /pricing     use-case NEW    /vs/*           blog
 (5 spokes)   (per-seat)   classroom set   (4 live-        (23 posts — the
 classroom-   classroom    (to create)     translation-    secure-meetings
 led titles   keywords     tutors/trainers led titles)     EQUITY cluster)
                           /academies
```

**Primary cluster (classroom + translation)** — every query family maps to one owning page:

| Query family | Owning page | Title (live) |
|---|---|---|
| ai classroom / ai classroom software / zoom alternative for trainers | `/` | AI Classroom & Zoom Alternative for Trainers \| Ollasync |
| virtual classroom software / virtual classroom for trainers, tutors / ai virtual classroom (content-engine pillar 1) | `/virtual-classroom-software` | Virtual Classroom Software for Trainers \| Ollasync |
| live voice translation for classes / teach in any language | `/` (+ blog piece #5) | — |
| virtual classroom features / online class software | `/features` | AI Classroom Features — Live Translation, Webinars & Class Notes |
| live classes in the browser | `/features/video-meetings` | Live Classes in the Browser — HD Video, No Download |
| ai class notes / lecture transcripts & summaries | `/features/ai` | AI Class Notes — Transcripts, Summaries & Action Items |
| webinar platform for training | `/features/webinars` | Webinar Platform for Training — Q&A, Polls & OBS Streaming |
| class recording with access control | `/features/recordings` | Class & Meeting Recordings — Access-Controlled, With Notes |
| ai classroom pricing / per-seat | `/pricing` | AI Classroom Pricing — Live Translation, Per Seat |
| zoom / meet / teams / webex / bigbluebutton alternative for online classes, tutors, training | `/vs/*` | "Zoom Alternative for Online Classes — Ollasync vs Zoom", "Google Meet Alternative for Tutors — Ollasync vs Meet", "Microsoft Teams Alternative for Training — Ollasync vs Teams", "Cisco Webex Alternative for Training — Ollasync vs Webex", "BigBlueButton Alternative with Live Translation — Ollasync" |

**Secondary cluster (secure-meetings equity — keep, do not rewrite):** `/security`
(E2EE meetings title), `/use-cases/*` (healthcare/legal/finance/government — HIPAA/GDPR/secure
conferencing keywords), `/features/deal-rooms`, `/compliance`, and all 23 blog posts (self-hosted,
E2EE, GDPR/HIPAA, MLS). These rank and hold the existing backlinks
(e.g. the self-hosted-Zoom-alternative pieces Google still surfaces). They funnel via internal links
to the pillar; they are never deleted or redirected under this strategy.

## 2. Competitor title formula (fetched verbatim 2026-08-31)

Zoom `One platform to connect | Zoom` · KUDO `KUDO | The #1 Platform for Live Speech Translation &
Captions` · Class `Class: The Next Generation Virtual Classroom | Class` · BigBlueButton `Virtual
Classroom Software | BigBlueButton` · Livestorm `All-in-one Webinar Software for Marketing Teams |
Livestorm` · Digital Samba `Free Video Conferencing from Europe | Digital Samba` · Jitsi `Free Video
Conferencing Software for Web & Mobile | Jitsi` · Zoho Meeting `Online Meeting Software & Platform -
Zoho Meeting` · Whereby `Secure, customizable & reliable WebRTC Video Calls | Whereby`.

Formula: **[category keyword phrase] | [brand]**, ≤ 60 chars where possible. The layout appends
"· Ollasync". Positioning white space the flagship owns: nobody combines *classroom* + *live voice
translation* — KUDO owns translation-for-meetings, Class/BBB own classroom-without-translation.
That intersection is the moat; every new page reinforces it.

## 3. Content roadmap (create in this order; all honesty-guarded)

1. **Use-case: Tutors & coaches** — "Online tutoring with live voice translation" (new classroom
   use-case collection alongside the regulated-industries one; do NOT dilute the existing 4).
2. **Use-case: Training companies & academies** — "Multilingual training platform for academies".
3. **Use-case: Corporate onboarding** — "Train global teams in their own language".
4. **/vs/ classroom comparison** — virtual-classroom platforms, capability table, shipped features only.
5. **Blog: "How live voice translation works in a class"** — open-standards explanation, links to
   `/features/video-meetings` + `/pricing`; targets "real-time voice translation online class".
6. **Blog: "Class notes that write themselves"** — targets "ai class notes"; links `/features/ai`.
7. **Blog: "10 languages, one classroom"** — honest tour of the shipped language set.
8. **Pillar `/virtual-classroom-software` + use case `/use-cases/trainers`** (2026-09-13) — the category authority
   page and the third audience spoke; every article of the content engine's pillar-1 cluster links the pillar
   (`marketing-site/content-engine/`, policy in `policy.json`).

Internal-linking rules: every new piece links the pillar (`/`), one `/features/*` spoke and
`/pricing`; the homepage links the two newest pieces; secondary-cluster posts gain one contextual
link to the pillar ("run it as an AI classroom") without changing their own targeting.

## 4. Technical state & reindexing

DONE 2026-08-31: hosted favicon set (SVG + PNG-ICO + apple-touch — the old inline `data:` icon was
invisible to Google's SERP fetcher and /favicon.ico 404'd, which is why the retired mark kept
showing); keyword-led titles on the money pages; sitemap `lastmod` per deploy; IndexNow pinged
(52 URLs accepted by api.indexnow.org + bing).

OPEN — **Google Search Console (user's one-time step):** Domain property for `ollasync.com` →
copy the `google-site-verification=` TXT → hand it over (DNS TXT gets placed via the existing
Cloudflare tooling) → Verify → submit `sitemap-index.xml` → Request indexing for `/`, `/pricing`,
`/features`, `/security`. Until then Google keeps showing the pre-pivot titles it has cached.

Cadence: run `node scripts/indexnow_ping.mjs` after every content deploy.
Out of scope for now: hreflang/localized pages (revisit when localized content exists), paid search,
outreach link-building, changing hero/H1 brand voice.

## 5. Measurement

- GSC (once verified): monthly queries/impressions/CTR split by the two clusters; track 10 phrases
  (5 primary: "ai classroom", "live voice translation class", "virtual classroom software",
  "ai class notes", "webinar platform for training"; 5 secondary: "e2ee video meetings",
  "self-hosted zoom alternative", "gdpr video conferencing", "secure deal room", "hipaa video calls").
- Per title change: page CTR 28 days before/after.
- SERP branding: `site:ollasync.com` favicon + titles check ~2 weeks after GSC verification.
- Content: each new piece gets 90 days to register impressions before iterating its title.
