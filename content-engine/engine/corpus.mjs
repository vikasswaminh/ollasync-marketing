// The corpus: every page and post of the built site, the planned manifest topics, and the fact files. Feeds the
// cannibalization gate (TF-IDF cosine), link validation (the set of real paths), title uniqueness and the writer's
// related-link candidates. The built dist is the source of truth for pages (it is what search engines see); when
// no build exists the blog source is used for posts and the caller is warned that pages are missing.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SKIP = new Set(['/404/', '/thanks/', '/licenses/']);

export const decodeEntities = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#8217;/g, '’');
export const htmlText = (html) =>
  decodeEntities(html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

function* htmlPages(dir, rel = '') {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) yield* htmlPages(join(dir, e.name), `${rel}/${e.name}`);
    else if (e.name === 'index.html') yield { path: `${rel}/`, file: join(dir, e.name) };
  }
}

/** Frontmatter (flat keys + simple arrays) and body of a markdown/MDX file. */
export function parseFrontmatter(src) {
  const m = src.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: src };
  const data = {};
  const lines = m[1].split('\n');
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z_][\w]*):\s*(.*)$/);
    if (!kv) continue;
    const [, k, raw] = kv;
    let v = raw.trim();
    if (v === '' && lines[i + 1] && /^\s+- /.test(lines[i + 1])) {
      const arr = [];
      while (lines[i + 1] && /^\s+- /.test(lines[i + 1])) arr.push(unquote(lines[++i].replace(/^\s+- /, '')));
      data[k] = arr;
      continue;
    }
    if (v.startsWith('[') && v.endsWith(']')) {
      data[k] = v.slice(1, -1).split(',').map((s) => unquote(s.trim())).filter(Boolean);
      continue;
    }
    if (v === 'true' || v === 'false') data[k] = v === 'true';
    else data[k] = unquote(v);
  }
  return { data, body: m[2] };
}
const unquote = (s) => {
  if (/^".*"$/.test(s)) {
    try {
      return JSON.parse(s); // a double-quoted YAML scalar with JSON-style escapes
    } catch {
      return s.slice(1, -1);
    }
  }
  return /^'.*'$/.test(s) ? s.slice(1, -1) : s;
};

/** Load the corpus. */
export function loadCorpus({ distDir, blogSrcDir, manifest = null, warn = () => {} }) {
  const docs = [];
  const paths = new Set();
  if (distDir && existsSync(distDir)) {
    for (const p of htmlPages(distDir)) {
      if (SKIP.has(p.path)) continue;
      const html = readFileSync(p.file, 'utf8');
      const title = decodeEntities((html.match(/<title>([^<]*)<\/title>/) || ['', ''])[1]).replace(/\s*·\s*Ollasync$/, '');
      const description = decodeEntities((html.match(/<meta name="description" content="([^"]*)"/) || ['', ''])[1]);
      const headings = [...html.matchAll(/<h[123][^>]*>([\s\S]*?)<\/h[123]>/g)].map((m) => htmlText(m[1]));
      const main = (html.match(/<main[\s\S]*?<\/main>/) || html.match(/<article[\s\S]*?<\/article>/) || [html])[0];
      const kind = p.path.startsWith('/blog/') && p.path !== '/blog/' ? 'post' : 'page';
      const full = htmlText(main);
      const text = kind === 'post' ? full : full.split(' ').slice(0, 500).join(' '); // posts in full: the originality gate compares whole articles
      docs.push({ key: p.path, kind, path: p.path, title, description, headings, text });
      paths.add(p.path);
    }
  } else {
    warn('no built site (marketing-site/dist) — the corpus has blog posts only; run `npm run build` in marketing-site for page-level checks');
    if (blogSrcDir && existsSync(blogSrcDir)) {
      for (const f of readdirSync(blogSrcDir)) {
        if (!/\.(md|mdx)$/.test(f)) continue;
        const { data, body } = parseFrontmatter(readFileSync(join(blogSrcDir, f), 'utf8'));
        if (data.draft === true) continue;
        const slug = f.replace(/\.(md|mdx)$/, '').toLowerCase();
        const headings = [...body.matchAll(/^#{1,3}\s+(.+)$/gm)].map((m) => m[1]);
        docs.push({ key: `/blog/${slug}/`, kind: 'post', path: `/blog/${slug}/`, title: data.title || '', description: data.description || '', headings, text: body.replace(/[#*_>`\[\]()]/g, ' ').replace(/\s+/g, ' ').trim() });
        paths.add(`/blog/${slug}/`);
      }
    }
  }
  if (manifest) {
    for (const it of manifest.items) {
      docs.push({ key: `planned:${it.id}`, kind: 'planned', id: it.id, path: `/blog/${it.slug}/`, title: it.title, description: it.uniqueAngle || '', headings: [], text: [it.primaryQuery, ...(it.secondaryQueries || []), it.searchIntent, it.uniqueAngle].join('. '), status: it.status });
    }
  }
  return { docs, paths };
}

// ── TF-IDF over unigrams + bigrams ────────────────────────────────────────────────────────────────────────────
const STOP = new Set('a an the and or but if then else of to in on at by for with from as is are was were be been being it its this that these those there here which who whom whose what when where why how all any both each few more most other some such no nor not only own same so than too very can will just do does did doing have has had having you your yours we our ours they their theirs he she his her him them i me my mine about above after again against also am among around because before below between during into out over through under until up down while your youre dont doesnt isnt arent wont cant one two three way make makes made get gets got use used using like via per vs versus'.split(' '));

export function tokenize(text) {
  const words = String(text).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w.length >= 3 && !STOP.has(w));
  const out = [...words];
  for (let i = 0; i + 1 < words.length; i++) out.push(`${words[i]}_${words[i + 1]}`);
  return out;
}

export class TfIdf {
  constructor(docs, textOf = (d) => [d.title, d.title, d.description, ...(d.headings || []), d.text].join(' ')) {
    this.docs = docs;
    this.textOf = textOf;
    this.df = new Map();
    this.vectors = docs.map((d) => this.#tf(textOf(d)));
    for (const v of this.vectors) for (const t of v.keys()) this.df.set(t, (this.df.get(t) || 0) + 1);
    this.n = docs.length;
  }
  #tf(text) {
    const m = new Map();
    for (const t of tokenize(text)) m.set(t, (m.get(t) || 0) + 1);
    return m;
  }
  #idf(t) {
    return Math.log((1 + this.n) / (1 + (this.df.get(t) || 0))) + 1;
  }
  vector(text) {
    const tf = this.#tf(text);
    const v = new Map();
    let norm = 0;
    for (const [t, c] of tf) {
      const w = (1 + Math.log(c)) * this.#idf(t);
      v.set(t, w);
      norm += w * w;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [t, w] of v) v.set(t, w / norm);
    return v;
  }
  static cosine(a, b) {
    let s = 0;
    for (const [t, w] of a) if (b.has(t)) s += w * b.get(t);
    return s;
  }
  /** top-k most similar corpus docs to a text; `exclude(doc)` drops e.g. the item's own planned entry */
  similar(text, k = 3, exclude = () => false) {
    const q = this.vector(text);
    const out = [];
    this.docs.forEach((d, i) => {
      if (exclude(d)) return;
      out.push({ doc: d, score: TfIdf.cosine(q, this.vector(this.textOf(d))) });
    });
    return out.sort((a, b) => b.score - a.score).slice(0, k);
  }
}

// ── the site's own no-leak guard, parsed from the script so there is ONE list of banned names ──
export function noLeakPatterns(scriptPath) {
  const src = readFileSync(scriptPath, 'utf8');
  const pick = (name) => {
    const m = src.match(new RegExp(`^${name}='([^']+)'`, 'm'));
    return m ? m[1] : null;
  };
  const out = [];
  const pattern = pick('PATTERN');
  if (pattern) out.push({ name: 'vendor/infra name', re: new RegExp(pattern, 'i') });
  out.push({ name: 'messaging-bus name', re: /\bNATS\b|nats:\/\// });
  const eu = src.match(/'(eu-hosted\|[^']+)'/);
  if (eu) out.push({ name: 'EU-hosting claim', re: new RegExp(eu[1], 'i') });
  if (!pattern || !eu) throw new Error(`could not parse ${scriptPath}`);
  return out;
}

export function loadFacts(engineDir) {
  const product = JSON.parse(readFileSync(join(engineDir, 'product-facts.json'), 'utf8'));
  const competitors = existsSync(join(engineDir, 'competitor-facts.json')) ? JSON.parse(readFileSync(join(engineDir, 'competitor-facts.json'), 'utf8')) : { claims: [] };
  return { product, competitors };
}
