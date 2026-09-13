# Ollasync SEO strategy — built around "AI Classroom with Live Voice Translation" (2026-08-31, v2)

Internal doc — not built into `dist/`. Every piece of public copy MUST pass `scripts/mkt_no_leak.sh`
(no internal vendor/stack names; open standards only) and the honesty rules: only the shipped translate
languages in `src/data/languages.ts` (`LANG_COUNT`, 19 since 2026-09-06 — never a bigger number, never a
language not listed there), no certification claims, no self-host overclaim, captions exist but are not the pitch.

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
