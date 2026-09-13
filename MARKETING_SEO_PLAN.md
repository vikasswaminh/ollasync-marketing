# Ollasync marketing — Home-page SEO ranking plan

> Internal doc (NOT in `marketing-site/`, so it isn't served on ollasync.com).
> Target: rank the ollasync.com home + key views for "secure/encrypted video meetings + deal rooms for
> business", with an EU-data-residency privacy angle. Product = E2E-encrypted browser video, webinars,
> recordings, confidential deal rooms.

## 0. The one blocker to fix first (or nothing else ranks)
The live site is an **absolute clone of a `dc`-runtime SPA**: all views (home / pricing / security / usecases /
blog / docs) are **rendered client-side by `support.js`**, share **one URL** (`/`), and most content is gated
behind `data-reveal` (opacity:0 until scroll). Consequences:
- **No per-view URLs** → Google indexes one page; pricing/security/usecases/blog can't rank on their own.
- **Content is JS-rendered + reveal-hidden** → slower, riskier indexing; weaker keyword surface than the raw HTML implies.
- **No SSR/prerender** → LCP/CLS suffer; social/preview bots that don't run JS see a near-empty page.

**Decision required (pick one) — this gates the ceiling of everything below:**
1. **Prerender/SSR the marketing site** (recommended for ranking): keep the visual clone but generate static
   HTML per route at build time (e.g. move to Astro and port the mockup, or run a headless prerender of each
   `nav()` view to real files: `/`, `/pricing`, `/security`, `/use-cases`, `/blog`, `/blog/<slug>`, `/docs`).
   This conflicts with "pure clone" — it's the price of ranking. Reversible: keep `marketing-site/` as-is and
   add a `dist/` prerender step.
2. **Ship the clone as-is** and accept the home page ranks on brand + a few head terms only; treat SEO as a
   phase-2 rebuild. (Honest expectation: minimal organic beyond "ollasync".)

Everything below assumes we do (1) — otherwise items marked **[needs URLs]** don't apply.

## 1. Keyword & intent map (home + views)
Cluster around **secure/private video for business**, not generic "video conferencing" (too competitive).
- **Primary (home):** "end-to-end encrypted video conferencing", "encrypted video meetings for business",
  "private video calls business", "secure video meeting platform".
- **High-intent / comparison:** "encrypted Zoom alternative", "private Teams alternative", "Signal for
  business video", "self-hosted video conferencing", "GDPR video conferencing", "EU data residency video calls".
- **Vertical (usecases view → landing pages) [needs URLs]:** "secure video for M&A / due diligence",
  "encrypted client calls for law firms", "HIPAA-adjacent / clinician-patient video", "OTC / trading desk
  secure comms". Each = its own page with the vertical's language + a schema block.
- **Deal-room cluster:** "virtual data room with video", "confidential deal room software", "NDA-gated
  document room", "secure M&A data room".
- **Informational / blog (top-of-funnel):** "what is server-blind encryption", "E2EE vs encryption in
  transit", "how SFrame works", "is Zoom end-to-end encrypted", "EU data residency explained".
Map: 1 primary intent per URL; don't cannibalize (home = platform overview; verticals = intent pages;
blog = informational). Build a keyword→URL sheet and hold to it.

## 2. On-page (home) — concrete
- **Title (55–60c):** already set — `Ollasync — End-to-end encrypted calls & deal rooms for business`. Good;
  keep the primary term in the first 5 words.
- **Meta description (≤155c):** set; make it benefit + differentiator ("server-blind, EU-hosted, no
  downloads"). It won't rank but drives CTR.
- **One `<h1>`** with the primary term (hero already is an H1 — ensure exactly one H1 site-wide per view).
- **H2/H3** using cluster terms: "End-to-end encrypted video & screen share", "Confidential deal rooms",
  "EU data residency", "Self-host option". The mockup's section labels already map well — keep them as real
  headings, not styled divs.
- **Above-the-fold text** must include the primary keyword in rendered HTML (not reveal-hidden). Remove
  `data-reveal` from the hero copy (or ship prerendered so it's in the source regardless).
- **Internal links** with descriptive anchors between home ↔ usecases ↔ security ↔ pricing ↔ blog (the
  `nav()` links become real `<a href>` once URLs exist).
- **CTA copy** already points to `login.ollasync.com` (good — keep the primary CTA keyword-free but clear).

## 3. Technical SEO
- **Sitemap.xml** listing every real URL (home + views + blog posts). Add `<link rel="sitemap">` + submit in GSC.
- **robots.txt** (present) → add the sitemap line once the sitemap exists.
- **Canonicals** per URL (self-referencing). Currently only home has one.
- **Structured data (JSON-LD):**
  - `Organization` (logo, sameAs socials) + `WebSite` (with `SearchAction` if search exists).
  - `SoftwareApplication` / `Product` on home (name, offers/pricing, aggregateRating if/when real reviews).
  - `FAQPage` on home/security (the "How it works" + crypto Qs) — strong for rich results.
  - `BreadcrumbList` + `Article` on each blog post; `BlogPosting` with author/datePublished.
- **Core Web Vitals:** the `dc` reveal animations + a 66 KB `support.js` risk LCP/CLS. Prerender the LCP hero
  as static HTML/CSS (no JS dependency); lazy-run the reveal JS; set explicit width/height on any image to
  avoid CLS. Target LCP < 2.5s, CLS < 0.1, INP < 200ms. Measure with PageSpeed + CrUX.
- **Images:** every image needs descriptive `alt` + `width`/`height` + modern format (AVIF/WebP) + lazy-load
  below the fold. (Ties into the placeholder-image generation task — name files + alt text with keywords,
  e.g. `encrypted-deal-room-cover.webp`, alt "Confidential deal room with NDA gating".)
- **OG/Twitter:** set (og:image = hero). Generate a proper 1200×630 branded OG image (not a screenshot) for
  better social CTR.
- **HTTPS/HSTS, clean URLs, no trailing-slash dupes, 301s** for any legacy paths.

## 4. Content & authority (the real ranking work)
- **Blog is the engine.** The mockup ships a blog shell — fill it with a topic-cluster strategy:
  pillar pages ("The guide to end-to-end encrypted business video", "Server-blind architecture explained")
  + supporting posts, all interlinked to the money pages (home, verticals, deal rooms).
- **Comparison pages [needs URLs]:** "Ollasync vs Zoom (privacy)", "vs Microsoft Teams", "vs Signal/Wire",
  "vs Wickr" — high commercial intent, honest tables. These convert + earn links.
- **Vertical landing pages** (M&A, legal, healthcare, finance) — mirror the usecases cards, expand each to a
  full page with the vertical's pain, compliance language (GDPR/EU residency/DPA), and a tailored CTA.
- **Backlinks:** submit to privacy-tool directories (PrivacyTools, AlternativeTo, European-cloud lists),
  Product Hunt launch, G2/Capterra/Slashdot listings, guest posts on security/legal-tech/M&A blogs, HARO for
  security commentary. Prioritize EU/DACH sources for the data-residency angle.
- **E-E-A-T:** real author bios on posts, a security/whitepaper page, published architecture + (aspirational)
  audit posture — buyers in this niche vet trust hard.

## 5. Measurement & cadence
- **Google Search Console** (verify domain, submit sitemap, watch coverage/Core-Web-Vitals/queries) +
  **Bing Webmaster**. Privacy-friendly analytics (Plausible/Cloudflare Web Analytics — fits the brand).
- **Rank tracking** for the keyword→URL sheet; monthly review.
- **Cadence:** Month 1 = fix the URL/SSR blocker + technical baseline + schema + sitemap. Month 2 = vertical
  + comparison pages. Month 3+ = blog cadence (1–2 posts/wk) + link building. Re-audit CWV each deploy.

## 6. Immediate low-risk wins (do regardless of the SSR decision)
1. Real `alt`/dimensions on the (soon-to-be-generated) images + keyworded filenames.
2. Add JSON-LD `Organization` + `FAQPage` + `SoftwareApplication` to the home `<head>` (works even in the SPA).
3. Add a `sitemap.xml` (even single-URL now) + GSC verification + submit.
4. Ensure the hero H1 text is in the raw HTML (not reveal-hidden) so bots see the primary keyword.
5. Generate a proper 1200×630 OG image.
6. Register GSC/Bing + privacy analytics now to start collecting data.
```
