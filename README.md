# Ollasync marketing site

The public marketing website for **Ollasync** — <https://ollasync.com> — a multi-page
[Astro](https://astro.build) app (SEO landing pages + a pillar/cluster blog).

Extracted from the Ollasync monorepo with its history preserved.

## Develop

```bash
npm ci
npm run dev        # local dev server
npm run build      # → dist/
npm run preview    # preview the production build locally
```

## Deploy

Hosted on **Cloudflare Pages** (project `ollasync-marketing`); the `main` branch is production →
<https://ollasync.com>.

```bash
npm ci && npm run build
CF_ACCOUNT_ID=<your-cf-account-id> ./deploy.sh main      # PRODUCTION (updates ollasync.com)
CF_ACCOUNT_ID=<your-cf-account-id> ./deploy.sh preview   # preview (<hash>.ollasync-marketing.pages.dev)
```

`deploy.sh` mints a short-lived Cloudflare **Pages: Write** token from `cf.txt` (the master mint-token),
deploys `dist/`, then revokes the token. `cf.txt` and any `.env` are **gitignored — never commit them**; place
`cf.txt` in the repo root at deploy time.

## Stack

- [Astro](https://astro.build) 4 (`@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`, `sharp`)
- Cloudflare Pages (`wrangler pages deploy`)
