// Deterministic gates — pure functions over a draft. Every finding is an issue { code, severity, msg }:
//   block  — cannot be repaired by rewriting (a duplicate title, a topic the manifest already forbids)
//   repair — must be fixed by the one repair pass; still present afterwards → the article is blocked
//   warn   — reported, never blocks
// The policy's forbidden phrases and the site's no-leak patterns are loaded by the caller (policy.json, the guard
// script) so there is a single source for each list.
export const GENERIC_OPENERS = [/^in this (article|post|guide)/i, /^this (article|post|guide) (will|covers|explains)/i, /^whether you('|’)re/i, /^in the world of/i, /^when it comes to/i, /^welcome to/i, /^are you (looking|struggling|tired)/i, /^imagine (a|this)/i, /^picture this/i];
const PLACEHOLDER = /\b(TODO|TBD|lorem ipsum|\[insert|\[citation needed\]|as an ai( language model)?|i cannot (help|provide|write)|i('|’)m sorry|as a language model)\b|\{\{|\}\}|<<|XXX/i;
const GENERIC_ANCHOR = /^(here|click here|read more|this|link|this article|learn more|this page|more)$/i;
const FAIRNESS_SHAPE = /\bwhen\b.*\b(better|right)\b|\bwhere\b.*\b(stronger|wins|ahead)\b|(is|remains) (still )?the better\b/i;
const VERDICT = /\b(better|right|stronger|wins|ahead)\b/i;
/** a heading that says when the COMPETITOR is the better choice: the first product it names before the verdict word
 *  is a competitor, not Ollasync ("When Zoom is the better choice" yes; "When Ollasync is better than Zoom" no) */
export function fairnessHeading(headings, competitors) {
  const names = [...new Set((competitors || []).flatMap((c) => String(c).split(/[^A-Za-z0-9]+/)).filter((w) => w.length >= 3))];
  return headings.some(({ text }) => {
    if (!FAIRNESS_SHAPE.test(text)) return false;
    const at = (re) => { const i = text.search(re); return i < 0 ? Infinity : i; };
    const competitor = Math.min(...names.map((n) => at(new RegExp(`\\b${n}\\b`, 'i'))));
    return competitor < at(VERDICT) && competitor < at(/\bollasync\b/i);
  });
}

// Claims the policy says never to invent — the writer sees the NEVER list, and the gate catches what slips through.
export const NEVER_PATTERNS = [
  { code: 'CERTIFICATION_CLAIM', re: /\b(SOC ?2|ISO ?27001|ISO ?27017|HIPAA[- ]certified|GDPR[- ]certified|FedRAMP|HITRUST|compliant with (HIPAA|GDPR|SOC))\b/i, msg: 'a certification/compliance claim (Ollasync holds none — say "controls and a DPA")' },
  { code: 'SELF_HOST_CLAIM', re: /\bollasync\b[^.]{0,80}\bself[- ]host(ed|ing|able)?\b|\bself[- ]host(ed|ing|able)?\b[^.]{0,80}\bollasync\b/i, msg: 'a self-hosting claim about Ollasync (it is a cloud service)' },
  { code: 'EU_HOSTING_CLAIM', re: /\b(eu[- ]hosted|hosted in (the eu|europe)|data stays in the eu|servers in the eu)\b/i, msg: 'an EU-hosting claim' },
  { code: 'FABRICATED_CUSTOMER', re: /\b([Cc]ustomers? (like|such as|including) [A-Z]|[Cc]ase stud(y|ies)|[Tt]estimonials?|"[^"]{20,}"\s*[—-]\s*[A-Z][a-z]+ [A-Z][a-z]+,)/, msg: 'a named customer, case study, testimonial or quote' },
  { code: 'INVENTED_LATENCY', re: /\b\d+(\.\d+)?\s?(ms|milliseconds|-second delay|second latency)\b/i, msg: 'a latency number (none is published; say "a beat behind, like an interpreter")' },
  { code: 'INVENTED_STATISTIC', re: /\b\d{1,3}(\.\d+)?\s?%\s+of\s+(trainers|teachers|learners|students|companies|organi[sz]ations|businesses|users|people)\b/i, msg: 'a market statistic with no stored source' },
  { code: 'LANGUAGE_COUNT_CLAIM', re: /\b(50\+|100\+|dozens of|over (20|25|30|40|50)) languages\b/i, msg: 'a language count that is not the shipped number' },
];

export function parseArticle(body) {
  const text = String(body).replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const headings = [];
  const links = [];
  const images = [];
  lines.forEach((ln, i) => {
    const h = ln.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (h) headings.push({ level: h[1].length, text: h[2].trim(), line: i });
    for (const m of ln.matchAll(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)) images.push({ alt: m[1], src: m[2], line: i });
    for (const m of ln.replace(/!\[([^\]]*)\]\([^)]*\)/g, '').matchAll(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g)) links.push({ text: m[1], href: m[2], line: i });
    for (const m of ln.matchAll(/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) links.push({ text: m[2].replace(/<[^>]+>/g, '').trim(), href: m[1], line: i, html: true }); // a raw anchor is still a link for every link gate
  });
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const paragraphs = blocks.filter((b) => !/^#{1,6}\s/.test(b) && !/^\s*([-*+]|\d+\.)\s/.test(b) && !/^(\||```|<)/.test(b));
  const bulletLines = lines.filter((l) => /^\s*[-*+]\s+/.test(l)).length;
  const lists = blocks.filter((b) => /^\s*[-*+]\s/.test(b)).map((b) => b.split('\n').filter((l) => /^\s*[-*+]\s/.test(l)).length);
  const prose = text.replace(/```[\s\S]*?```/g, ' ').replace(/^#{1,6}\s.+$/gm, ' ').replace(/[*_`>#]/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  const words = prose.split(/\s+/).filter(Boolean);
  const sentences = prose.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/).map((s) => s.trim()).filter((s) => s.split(' ').length >= 3);
  return { lines, headings, links, images, blocks, paragraphs, bulletLines, lists, words, sentences, text };
}

const stdev = (xs) => {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
};
const firstParagraphAfter = (art, headingIndex) => {
  const start = art.headings[headingIndex].line + 1;
  const end = headingIndex + 1 < art.headings.length ? art.headings[headingIndex + 1].line : art.lines.length;
  const chunk = art.lines.slice(start, end).join('\n');
  const para = chunk.split(/\n\s*\n/).map((b) => b.trim()).find((b) => b && !/^\s*[-*+]\s/.test(b));
  return para || '';
};
const wc = (s) => String(s).replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').split(/\s+/).filter(Boolean).length;
const NEGATION = /\b(not|no|never|cannot|can't|can’t|isn't|isn’t|doesn't|doesn’t|does not|is not|are not|aren't|aren’t|won't|won’t|without|instead of|rather than|neither|nor|unlike|holds no|none)\b/i;
/** the sentence around a match; a negated sentence ("Ollasync cannot be self-hosted", "we hold no certification") is not a claim */
export function sentenceAround(text, index) {
  const start = Math.max(text.lastIndexOf('. ', index), text.lastIndexOf('\n', index), text.lastIndexOf('? ', index), text.lastIndexOf('! ', index)) + 1;
  const endCands = [text.indexOf('. ', index), text.indexOf('\n', index), text.indexOf('? ', index), text.indexOf('! ', index)].filter((i) => i >= 0);
  const end = endCands.length ? Math.min(...endCands) + 1 : text.length;
  return text.slice(start, end).trim();
}
/** absolute clause ranges of the sentence around `index`: split at punctuation and at contrastive conjunctions */
function clauseRanges(text, index) {
  const s = sentenceAround(text, index);
  const start = text.indexOf(s, Math.max(0, index - s.length)); // the sentence begins at or before the index
  const re = /[,;:]|\b(but|and|while|although|though|whereas|however|yet|except)\b/gi;
  const ranges = [];
  let last = 0;
  for (const m of s.matchAll(re)) {
    ranges.push([start + last, start + m.index]);
    last = m.index + m[0].length;
  }
  ranges.push([start + last, start + s.length]);
  return ranges;
}
/** the clause of the sentence that contains the index */
export function clauseAround(text, index) {
  const ranges = clauseRanges(text, index);
  const r = ranges.find(([a, b]) => index >= a && index < b) || ranges[ranges.length - 1];
  return text.slice(r[0], r[1]).trim();
}
/** every clause a whole match span touches (a claim pattern may run from one clause into the next) */
function clausesSpanned(text, from, to) {
  return clauseRanges(text, from).filter(([a, b]) => a < to && b > from).map(([a, b]) => text.slice(a, b).trim());
}
const negated = (text, m) => clausesSpanned(text, m.index, m.index + m[0].length).some((c) => NEGATION.test(c));
export const normalizeQ = (q) => q.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** does `want` name one of the body headings? exact, containment, or ≥ 60 % shared words (a paraphrase after editing) */
export function matchHeading(headings, want) {
  const w = normalizeQ(String(want));
  if (!w) return null;
  for (const h of headings) {
    const t = normalizeQ(h.text);
    if (t === w || t.includes(w) || w.includes(t)) return h;
    const a = new Set(w.split(' ').filter((x) => x.length > 2));
    const b = new Set(t.split(' ').filter((x) => x.length > 2));
    const common = [...a].filter((x) => b.has(x)).length;
    if (a.size > 0 && common / Math.max(a.size, b.size) >= 0.6) return h;
  }
  return null;
}

/**
 * @param article { title, description, body, takeaways, insights:[{heading, factIds}], sourcesUsed:[ids] }
 * @param ctx { item, pillarUrl, existingPaths:Set, allowedSlugs:Set, existingTitles:Map(lower→path), forbidden:[phrases],
 *              leakPatterns:[{name,re}], factIds:Set, sourceUrls:Set, registry:[normalized questions], relatedCandidates:number }
 */
export function deterministicGates(article, ctx) {
  const issues = [];
  const add = (code, severity, msg) => issues.push({ code, severity, msg });
  const art = parseArticle(article.body || '');
  const title = (article.title || '').trim();
  const desc = (article.description || '').trim();
  const primary = (ctx.item?.primaryQuery || '').toLowerCase();

  // metadata
  if (!title) add('TITLE_MISSING', 'repair', 'no title');
  if (!desc) add('DESC_MISSING', 'repair', 'no meta description');
  if (title.length > 70) add('TITLE_LONG', 'warn', `title is ${title.length} characters`);
  if (desc.length > 165) add('DESC_LONG', 'repair', `meta description is ${desc.length} characters (keep it under 160)`);
  if (desc.length && desc.length < 70) add('DESC_SHORT', 'repair', `meta description is only ${desc.length} characters`);
  if (title && ctx.existingTitles?.has(title.toLowerCase())) add('TITLE_DUP', 'block', `the title already exists at ${ctx.existingTitles.get(title.toLowerCase())}`);
  if (title && ctx.sameRunTitles?.has(title.toLowerCase())) add('TITLE_DUP', 'block', 'the title duplicates another article of this run');

  // structure
  if (art.headings.some((h) => h.level === 1)) add('H1_IN_BODY', 'repair', 'the body contains a # heading — the layout renders the H1 from the title; use ## and ###');
  const h2s = art.headings.filter((h) => h.level === 2);
  if (h2s.length < 3) add('TOO_FEW_SECTIONS', 'repair', `only ${h2s.length} ## sections`);
  if (art.headings.some((h) => h.level > 3)) add('HEADING_DEPTH', 'repair', 'headings deeper than ### are used');
  const firstH2 = art.headings.find((h) => h.level >= 2);
  if (firstH2 && art.headings.find((h) => h.level === 3 && h.line < firstH2.line)) add('H3_BEFORE_H2', 'repair', 'a ### appears before the first ##');
  if (h2s.length && h2s[0].line < 1) add('INTRO_MISSING', 'repair', 'the article starts with a heading; open with the answer in prose');
  if (firstH2) {
    const intro = art.lines.slice(0, firstH2.line).join('\n');
    const introWords = wc(intro.replace(/^#.*$/gm, ''));
    if (introWords > 180) add('INTRO_LONG', 'repair', `the introduction is ${introWords} words before the first section; answer the reader's need within ~150 words`);
    if (introWords < 40) add('INTRO_SHORT', 'repair', `the introduction is only ${introWords} words`);
  }
  const words = art.words.length;
  if (words < 900) add('TOO_SHORT', 'repair', `${words} words — below 900`);
  else if (words > 2600) add('TOO_LONG', 'repair', `${words} words — above 2600; cut what does not add information`);
  else if (words < 1200 || words > 2400) add('LENGTH_OUTSIDE_TYPICAL', 'warn', `${words} words (typical 1200–2400; length follows the subject)`);

  // banned language
  const everything = `${title}\n${desc}\n${(article.takeaways || []).join('\n')}\n${art.text}`;
  for (const p of ctx.forbidden || []) {
    if (everything.toLowerCase().includes(p.toLowerCase())) add('FORBIDDEN_PHRASE', 'repair', `forbidden phrase "${p}"`);
  }
  for (const lp of ctx.leakPatterns || []) {
    const m = everything.match(lp.re);
    if (m) add('LEAK', 'repair', `${lp.name} "${m[0]}" must not appear in public copy`);
  }
  for (const np of NEVER_PATTERNS) {
    const re = new RegExp(np.re.source, np.re.flags.includes('g') ? np.re.flags : `${np.re.flags}g`);
    for (const m of everything.matchAll(re)) {
      if (negated(everything, m)) continue; // "Ollasync cannot be self-hosted", "we hold no SOC 2 certification": honest, not invented
      add(np.code, 'repair', `${np.msg}: "${m[0]}"`);
      break;
    }
  }
  const ph = everything.match(PLACEHOLDER);
  if (ph) add('PLACEHOLDER', 'repair', `placeholder or model text "${ph[0]}"`);
  const fid = `${title}\n${desc}\n${(article.takeaways || []).join('\n')}\n${art.text}`.match(/\(?\b[FC]\d{2}\b\)?/);
  if (fid) add('FACT_ID_IN_BODY', 'repair', `fact/source id "${fid[0]}" appears in the text — ids belong only in META.insights, never in the article`);
  const lastLine = art.lines.map((l) => l.trim()).filter(Boolean).pop() || '';
  if (lastLine && !/[.!?)"”’*_`]$/.test(lastLine) && !/^#{1,6}\s/.test(lastLine) && !/^\s*[-*+]\s/.test(lastLine)) add('TRUNCATED', 'repair', `the body ends mid-sentence ("…${lastLine.slice(-40)}")`);
  if (/<(iframe|script|embed|object|video|audio)\b/i.test(art.text)) add('EMBED', 'repair', 'embeds/scripts are not allowed (the site CSP blocks them)');
  for (const im of art.images) {
    if (/^https?:\/\//i.test(im.src)) add('EXTERNAL_IMAGE', 'repair', `external image ${im.src} (the CSP allows only site images)`);
    if (!im.alt.trim()) add('IMAGE_ALT', 'repair', `image ${im.src} has no alt text`);
  }
  if (/<img\b/i.test(art.text)) add('HTML_IMAGE', 'repair', 'use markdown images with alt text, not <img>');
  if (art.links.some((l) => l.html)) add('HTML_ANCHOR', 'repair', 'raw <a> tags are not allowed — use markdown links');

  // links
  const internal = art.links.filter((l) => l.href.startsWith('/'));
  const external = art.links.filter((l) => /^https?:\/\//i.test(l.href));
  const other = art.links.filter((l) => !l.href.startsWith('/') && !/^https?:\/\//i.test(l.href) && !l.href.startsWith('#'));
  for (const l of other) add('LINK_FORMAT', 'repair', `link "${l.href}" must be root-relative (/path/) or https`);
  for (const l of internal) {
    const path = l.href.split('#')[0].split('?')[0];
    if (!path.endsWith('/')) add('LINK_FORMAT', 'repair', `internal link ${l.href} must end with a slash (the canonical form)`);
    const ok = ctx.existingPaths?.has(path) || ctx.existingPaths?.has(`${path}/`) || [...(ctx.allowedSlugs || [])].some((s) => path === `/blog/${s}/`);
    if (!ok) add('LINK_BROKEN', 'repair', `internal link ${l.href} does not resolve to an existing page`);
    if (GENERIC_ANCHOR.test(l.text.trim())) add('ANCHOR_GENERIC', 'repair', `anchor "${l.text}" is not descriptive`);
  }
  if (internal.length > 8) add('LINK_COUNT', 'repair', `${internal.length} internal links (maximum 8)`);
  if (ctx.pillarUrl && !internal.some((l) => l.href.split('#')[0].replace(/\/?$/, '/') === ctx.pillarUrl)) add('PILLAR_LINK_MISSING', 'repair', `no link to the pillar page ${ctx.pillarUrl}`);
  const planned = (ctx.plannedLinks || []).filter((p) => p !== ctx.pillarUrl);
  if (planned.length) {
    const hit = planned.filter((p) => internal.some((l) => l.href.split('#')[0].replace(/\/?$/, '/') === p));
    if (hit.length < Math.ceil(planned.length / 2)) add('PLANNED_LINKS', 'warn', `only ${hit.length} of the ${planned.length} planned link targets are linked (${planned.join(', ')})`);
  }
  const blogLinks = internal.filter((l) => /^\/blog\/[^/]+\/?$/.test(l.href.split('#')[0]));
  if (blogLinks.length < 2 && (ctx.relatedCandidates || 0) >= 1) add('RELATED_LINKS', 'warn', `${blogLinks.length} link(s) to related articles (2–4 when the brief offers genuinely related ones; never pad)`);
  else if (blogLinks.length > 4) add('RELATED_LINKS', 'warn', `${blogLinks.length} links to other articles`);
  for (const l of external) if (!(ctx.sourceUrls || new Set()).has(l.href)) add('EXTERNAL_UNSOURCED', 'repair', `external link ${l.href} is not one of the article's stored sources`);

  // questions (Q&A passages): natural user questions as headings with a 40–100-word standalone answer
  const qHeads = art.headings.map((h, i) => ({ h, i })).filter(({ h }) => /\?$/.test(h.text.trim()));
  if (!qHeads.length) add('NO_QUESTION', 'repair', 'no question heading — put 1–3 natural user questions as ## or ### with a direct 40–100-word answer');
  if (qHeads.length > 3) add('TOO_MANY_QUESTIONS', 'repair', `${qHeads.length} question headings: at most 3 (this is not a FAQ page)`);
  for (const { h, i } of qHeads) {
    const n = wc(firstParagraphAfter(art, i));
    if (n < 30) add('ANSWER_LENGTH', 'repair', `the paragraph directly under "${h.text}" is only ${n} words — make it a standalone answer of about 40–100 words`);
    else if (n > 125) add('ANSWER_LENGTH', 'repair', `the paragraph directly under "${h.text}" is ${n} words — split it: keep a standalone 40–100-word answer as the first paragraph and move the rest into a second paragraph`);
    if ((ctx.registry || []).includes(normalizeQ(h.text))) add('QUESTION_REPEAT', 'repair', `the question "${h.text}" is already answered in another article`);
  }

  // keyword stuffing
  if (primary) {
    const n = art.text.toLowerCase().split(primary).length - 1;
    if (n > 8 || (n / Math.max(words, 1)) * 100 > 1.5) add('KEYWORD_STUFFING', 'repair', `the primary query appears ${n} times`);
    const inHeads = art.headings.filter((h) => h.text.toLowerCase().includes(primary)).length;
    if (inHeads > 2) add('KEYWORD_HEADINGS', 'repair', `${inHeads} headings repeat the primary query`);
  }

  // original insight sections
  const ins = article.insights || [];
  if (ins.length < 2) add('INSIGHTS', 'repair', `${ins.length} original-insight section(s) declared (at least 2, each citing product facts)`);
  for (const s of ins) {
    if (!matchHeading(art.headings, s.heading)) add('INSIGHT_HEADING', 'repair', `insight section "${s.heading}" is not a heading in the body`);
    for (const f of s.factIds || []) if (!ctx.factIds?.has(f)) add('INSIGHT_FACT', 'repair', `insight section "${s.heading}" cites unknown fact ${f}`);
    if (!(s.factIds || []).length) add('INSIGHT_FACT', 'repair', `insight section "${s.heading}" cites no product fact`);
  }
  if (ctx.item?.comparison && !fairnessHeading(art.headings, ctx.item.comparison.competitors)) add('COMPARISON_FAIRNESS', 'repair', `a comparison needs a section whose heading says when ${(ctx.item.comparison.competitors || []).join(' or ')} is the better choice, not when Ollasync is`);

  // cadence — the mechanical patterns the policy names
  const openers = h2s.map((h, i) => firstParagraphAfter(art, art.headings.indexOf(h)).toLowerCase().split(/\s+/).slice(0, 3).join(' ')).filter(Boolean);
  const dupOpen = [...new Set(openers)].filter((o) => openers.filter((x) => x === o).length >= 3);
  if (dupOpen.length) add('SECTION_OPENERS', 'repair', `three or more sections open with "${dupOpen[0]}"`);
  const genericHits = art.paragraphs.filter((p) => GENERIC_OPENERS.some((re) => re.test(p))).length;
  if (genericHits >= 2) add('GENERIC_OPENERS', 'repair', `${genericHits} paragraphs open with generic filler (\"In this article…\", \"When it comes to…\")`);
  if (art.bulletLines > 0 && art.bulletLines / (art.paragraphs.length + art.bulletLines) > 0.5) add('BULLET_RATIO', 'repair', 'more than half of the body is bullet points');
  if (art.lists.filter((n) => n === 3).length >= 3) add('THREE_ITEM_LISTS', 'repair', 'three-item lists are used mechanically');
  const dashes = (art.text.match(/—/g) || []).length;
  const dashCap = Math.floor((words / 1000) * 8);
  if (words && dashes > dashCap) add('EM_DASHES', 'repair', `${dashes} em dashes in ${words} words — at most ${dashCap} allowed (one per 125 words): rewrite ${dashes - dashCap} of them as commas, full stops or parentheses`);
  const bold = (art.text.match(/\*\*[^*]+\*\*/g) || []).length;
  if (bold > 12) add('BOLD', 'repair', `${bold} bold spans`);
  if (art.sentences.length >= 20 && stdev(art.sentences.map((s) => s.split(' ').length)) < 4.5) add('SENTENCE_RHYTHM', 'repair', 'sentence lengths barely vary');
  return issues;
}

export const hasBlockers = (issues) => issues.some((i) => i.severity === 'block');
export const needsRepair = (issues) => issues.some((i) => i.severity === 'repair');
