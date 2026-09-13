// Prompts for the model stages (brief → writer → editor → reviewer → repair, plus the intent check) and the
// parsers for their outputs. Long article text travels in a ===META=== / ===BODY=== envelope rather than JSON so a
// 2,000-word body never has to be JSON-escaped by a model; short structured answers are JSON.
import { POLICY } from './config.mjs';

const P = POLICY;

/** The shared product context: positioning + voice + the facts + the NEVER list. Byte-identical on every call so
 *  providers that cache identical prompt prefixes can; kept under ~8 KB. */
export function productContext(facts) {
  const b = P.brand_positioning;
  const lines = [];
  lines.push(`You write for Ollasync. Ollasync is ${b.primary_identity.toLowerCase()} (category: ${b.primary_category}). Audiences: ${b.primary_audiences.join(', ')}. Primary differentiator: ${b.primary_differentiator.toLowerCase()}. Secondary: ${b.secondary_differentiators.join(', ')}. ${b.competitive_message} ${b.rule}`);
  lines.push('');
  lines.push(`VOICE: ${P.editorial_voice_policy.objective} Tone: ${P.editorial_voice_policy.tone.join(', ')}. Avoid: ${P.editorial_voice_policy.avoid.join('; ')}.`);
  lines.push(`STYLE RULES: ${P.editorial_voice_policy.style_rules.join(' ')}`);
  lines.push(`FORBIDDEN PHRASES (never use, in any form): ${P.editorial_voice_policy.forbidden_phrases_and_patterns.map((s) => `"${s}"`).join(', ')}.`);
  lines.push('');
  lines.push('PRODUCT FACTS — the ONLY statements you may make about Ollasync. Cite them by id where the brief asks for it. Anything about Ollasync that is not here must not be written, even if it sounds likely.');
  for (const f of facts.product.facts) lines.push(`[${f.id}] ${f.text}`);
  lines.push('');
  lines.push(`NEVER (hard rule — a violation blocks publication): ${P.factual_integrity.hard_rule} Never invent ${P.factual_integrity.never_invent.join(', ')}. ${facts.product.never.join(' ')}`);
  return lines.join('\n');
}

const fmtList = (xs, prefix = '- ') => (xs || []).map((x) => `${prefix}${x}`).join('\n');

/** The content brief for one manifest item (deterministic: no model call). */
export function buildBrief(item, { pillarUrl, pillarName, spokes = [], related = [], competitorClaims = [], sourceCandidates = [] }) {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    primaryQuery: item.primaryQuery,
    secondaryQueries: item.secondaryQueries || [],
    searchIntent: item.searchIntent,
    audience: item.audience,
    funnelStage: item.funnelStage,
    uniqueAngle: item.uniqueAngle,
    requiredOriginalInsights: item.requiredOriginalInsights || [],
    pillar: { name: pillarName, url: pillarUrl },
    spokes,
    plannedLinks: item.internalLinkTargets || [], // the editorial plan's targets for this article
    related, // [{ path, title, description }]
    comparison: item.comparison || null, // { competitors: ['Zoom'], requireWhenBetter: true }
    languageSpecifics: item.languageSpecifics || null,
    competitorClaims, // verified, live-checked [{ id, competitor, claim, url, publisher, accessDate }]
    optionalElements: P.article_structure.optional_elements,
    typicalLength: P.article_structure.typical_length,
  };
}

export function briefText(b) {
  const parts = [];
  parts.push(`TITLE (keep the intent; you may tighten the wording): ${b.title}`);
  parts.push(`PRIMARY QUERY: ${b.primaryQuery}\nSECONDARY QUERIES: ${b.secondaryQueries.join('; ') || '—'}\nSEARCH INTENT: ${b.searchIntent}\nAUDIENCE: ${b.audience}\nFUNNEL STAGE: ${b.funnelStage}`);
  parts.push(`UNIQUE ANGLE (what this article does that no existing page does): ${b.uniqueAngle}`);
  parts.push(`REQUIRED ORIGINAL INSIGHT SECTIONS (at least two sections must be built on these, each citing product fact ids):\n${fmtList(b.requiredOriginalInsights)}`);
  parts.push(`PILLAR PAGE (must be linked naturally in the body): ${b.pillar.url} — "${b.pillar.name}"\nPLANNED LINK TARGETS (the editorial plan for this article; link each where it fits naturally): ${(b.plannedLinks || []).join(', ') || '—'}\nAUDIENCE / SPOKE PAGES (link one when useful): ${b.spokes.join(', ') || '—'}`);
  parts.push(`RELATED ARTICLES (link 2–4 of these where genuinely relevant, with descriptive anchors):\n${b.related.length ? b.related.map((r) => `- ${r.path} — ${r.title}${r.description ? `: ${r.description}` : ''}`).join('\n') : '- (none yet — link the pillar and one spoke)'}`);
  if (b.comparison) parts.push(`COMPARISON RULES: state where ${b.comparison.competitors.join(' / ')} is stronger and where Ollasync is stronger; explain use cases; no scoring systems; no blanket claims; include a section whose heading says when ${b.comparison.competitors[0]} is the better choice.`);
  if (b.languageSpecifics) parts.push(`LANGUAGE-SPECIFIC CONTENT (the article must contain genuine ${b.languageSpecifics.language}-specific usefulness — terminology examples, number and acronym handling, script, classroom phrases, translation challenges; link /languages/${b.languageSpecifics.code}/):\n${fmtList(b.languageSpecifics.notes)}`);
  if (b.competitorClaims.length) parts.push(`VERIFIED COMPETITOR CLAIMS (the only competitor specifics you may state; cite the id; link the url as the source if you use one):\n${b.competitorClaims.map((c) => `[${c.id}] ${c.competitor}: ${c.claim} (source: ${c.publisher}, ${c.url})`).join('\n')}`);
  else parts.push('VERIFIED COMPETITOR CLAIMS: none — say nothing specific about any competitor\'s current features, limits or prices; general, non-specific statements only.');
  parts.push(`OPTIONAL ELEMENTS (use what the subject needs): ${b.optionalElements.join(', ')}. Typical length ${b.typicalLength}; length follows the subject, never a word target.`);
  return parts.join('\n\n');
}

const OUTPUT_FORMAT = `OUTPUT FORMAT — exactly this envelope, nothing before or after:
===META===
{"title": "...", "description": "one useful sentence for the search snippet, 90–155 characters", "takeaways": ["3 to 5 one-sentence takeaways"], "insights": [{"heading": "the exact text of a ## or ### heading in the body", "factIds": ["F01"]}], "questions": ["each question heading, verbatim"], "sourcesUsed": ["C01"]}
===BODY===
(the article body in markdown: no # heading, ## and ### only, markdown links, no images, no HTML)`;

export function writerPrompt(brief, ctx) {
  const s = P.article_structure;
  const q = P.question_answer_strategy_for_google_and_ai_search;
  const system = [
    ctx.productContext,
    '',
    `STRUCTURE: ${s.rule} Required: ${s.required.join(', ')}. The layout renders the H1 from the title, so the body must contain NO # heading — use ## sections (at least three) and ### where useful. ${s.introduction_rule} Do not title a section "Conclusion"; end with something the reader can use.`,
    `QUESTION PASSAGES: ${q.format.join(' ')} ${q.rule} Use 1–3 question headings (ending with ?), never more than five; ${q.do_not.join('; ')}.`,
    `ORIGINAL INSIGHT: at least ${P.first_hand_experience_policy.minimum_original_insight_sections_per_article} sections must carry first-hand, product-grounded insight (${P.first_hand_experience_policy.preferred_material.slice(0, 8).join(', ')}), each citing product fact ids in META. State when Ollasync is not the best choice. Explain tradeoffs and limitations.`,
    `LINKS: markdown links with root-relative paths that end in a slash (e.g. /features/live-translation/). Link the pillar page naturally. Link 2–4 related articles and at most 8 internal links in total; descriptive anchors only (never "here", "click here", "read more"). External links only to the verified competitor-claim urls. No images.`,
    `COMPARISONS: ${P.comparison_content_policy.requirements.join('; ')}.`,
    '',
    OUTPUT_FORMAT,
  ].join('\n');
  return { system, user: `Write the article for this brief.\n\n${briefText(brief)}\n\n${CHECKLIST(brief)}` };
}

/** the hard requirements every deterministic gate enforces, restated as a checklist in the user message */
export function CHECKLIST(brief) {
  return [
    'HARD REQUIREMENTS (each one is checked by a program before review):',
    '- Body 1200–2400 words; no # heading; at least three ## sections; ### only under a ##.',
    '- The first 1–3 paragraphs (≤ 150 words, before the first ##) answer the reader\'s core need.',
    `- A markdown link to the pillar page ${brief.pillar.url} in the body, with a descriptive anchor.`,
    '- 2–4 links to the RELATED articles listed above (only those paths), at most 8 internal links in total, every internal link ending with a slash.',
    '- 1–3 headings that are natural user questions ending with "?", each followed immediately by a 40–100-word paragraph that answers it and stands alone.',
    '- At least two sections built on the REQUIRED ORIGINAL INSIGHTS; list them in META.insights with their fact ids.',
    '- Never write fact or claim ids (F01, C03…) in the article text, title, description or takeaways; they belong only in META.',
    '- META.description 90–155 characters. No images, no HTML, no external links except verified claim urls, none of the forbidden phrases.',
    '- Punctuation: at most one em dash (—) per 125 words in the whole body; prefer commas, full stops and parentheses. Bold sparingly.',
  ].join('\n');
}

export function editorPrompt(article, brief, ctx) {
  const e = P.human_editor_pass;
  const system = [
    ctx.productContext,
    '',
    `You are the human editor. ${e.rule} You may: ${e.editor_may.join('; ')}. ${e.target} Cut anything that exists only to hold a keyword or to add length — but never below 1,200 words, and never add material the draft did not have; if the draft is too thin to edit, return it with the META field "editorNote" explaining why. Keep every product statement inside the PRODUCT FACTS; keep the pillar link (${brief.pillar.url}), the related-article links and the question headings with their 40–100-word answers (you may improve them). Keep the insight sections and update their headings in META if you rename them. Keep the body free of # headings and images. Return the whole edited article.`,
    '',
    OUTPUT_FORMAT,
  ].join('\n');
  const user = `BRIEF (for context):\n${briefText(brief)}\n\n${CHECKLIST(brief)}\n\nDRAFT TO EDIT:\n===META===\n${JSON.stringify(metaOf(article))}\n===BODY===\n${article.body}`;
  return { system, user };
}

export function reviewerPrompt(article, brief, ctx) {
  const r = P.editorial_review;
  const dims = Object.entries(r.dimensions).map(([k, w]) => `"${k}": 0-${w}`).join(', ');
  const system = [
    ctx.productContext,
    '',
    'You are an independent editorial reviewer for Ollasync\'s blog. You did not write this article. Be strict and specific; a plausible-sounding statement that is not in the PRODUCT FACTS is unsupported.',
    `Score each dimension from 0 up to its weight (${dims}); "total" is their sum out of ${r.score_out_of}.`,
    `Answer these questions in one sentence each: ${r.review_questions.map((q, i) => `Q${i + 1}: ${q}`).join(' ')}`,
    'CLAIMS: list every statement about what Ollasync does, supports, costs or guarantees (kind "ollasync"), every statement about HOW Ollasync works internally — where translation, recording or notes are processed, what runs in the browser or on a server, how streams are routed, what happens in an encrypted class (also kind "ollasync"), every statement about a named competitor\'s current features, limits or prices (kind "competitor"), and every number or statistic (kind "number"). For each: supported=true only if it matches a PRODUCT FACT id (ollasync) or a VERIFIED COMPETITOR CLAIM id from the brief (competitor) — a mechanism or situation no fact describes is unsupported even when it sounds technically plausible; numbers are supported only when they come from a fact or claim. Give the id in "ref".',
    'INSIGHT SECTIONS: list the sections that carry genuine first-hand, product-grounded insight a generic SaaS blog could not write, with the fact ids they rest on.',
    'REPAIR INSTRUCTIONS: concrete, numbered edits that would raise the score — or an empty list.',
    'Return ONLY a JSON object: {"scores": {...}, "total": n, "answers": {"Q1": "...", ...}, "claims": [{"text": "...", "kind": "ollasync|competitor|number|general", "supported": true|false, "ref": "F01|C01|null"}], "insightSections": [{"heading": "...", "factIds": ["F01"]}], "repairInstructions": ["..."], "summary": "two sentences"}',
  ].join('\n');
  const user = `BRIEF:\n${briefText(brief)}\n\nARTICLE:\nTITLE: ${article.title}\nDESCRIPTION: ${article.description}\nTAKEAWAYS: ${(article.takeaways || []).join(' | ')}\n\n${article.body}`;
  return { system, user };
}

export function repairPrompt(article, brief, issues, review, ctx) {
  const system = [
    ctx.productContext,
    '',
    'You are repairing an article that failed review. Fix EVERY listed issue and change nothing that is not listed. Unsupported claims must be removed or rewritten so they no longer assert the unsupported fact. Keep the format rules: no # heading, ## and ### only, markdown links ending in a slash, the pillar link, related-article links only where genuinely relevant, at most 8 internal links, question headings with 40–100-word standalone answers, at least two insight sections citing fact ids, no images, no forbidden phrases. Return the whole repaired article. In META add "repairs": one string per listed issue, starting with its label as shown in brackets, saying what you changed (e.g. "ANSWER_LENGTH: split the paragraph under \'Is a meeting tool enough?\' at sentence 4", "REVIEWER 2: rewrote the introduction to answer within the first 80 words").',
    '',
    OUTPUT_FORMAT.replace('"sourcesUsed": ["C01"]}', '"sourcesUsed": ["C01"], "repairs": ["ISSUE_CODE: what changed"]}'),
  ].join('\n');
  const list = [
    ...issues.map((i) => `- [${i.code}] ${i.msg}`),
    ...(review?.repairInstructions || []).map((s, i) => `- [REVIEWER ${i + 1}] ${s}`),
    ...(review?.claims || []).filter((c) => c.supported === false).map((c, i) => `- [UNSUPPORTED ${i + 1} ${c.kind}] "${c.text}"`),
  ];
  const user = `ISSUES TO FIX:\n${list.join('\n')}\n\n${CHECKLIST(brief)}\n\nBRIEF:\n${briefText(brief)}\n\nARTICLE:\n===META===\n${JSON.stringify(metaOf(article))}\n===BODY===\n${article.body}`;
  return { system, user };
}

export function intentPrompt(brief, candidates) {
  const system = 'You judge search-intent overlap for a website\'s content plan. For each existing page, decide whether a searcher with the planned article\'s primary intent would be FULLY served by that existing page (same primary intent AND the same expected answer). A related but different intent (different audience, different question, different stage of the buying journey) is NOT the same. Return ONLY JSON: {"results": [{"path": "...", "sameIntent": true|false, "reason": "one sentence"}]}';
  const user = `PLANNED ARTICLE:\nTitle: ${brief.title}\nPrimary query: ${brief.primaryQuery}\nSearch intent: ${brief.searchIntent}\nAudience: ${brief.audience}\nUnique angle: ${brief.uniqueAngle}\n\nEXISTING PAGES:\n${candidates.map((c) => `- ${c.path}\n  title: ${c.title}\n  description: ${c.description}\n  headings: ${(c.headings || []).slice(0, 12).join(' | ')}`).join('\n')}`;
  return { system, user };
}

// ── parsers ──────────────────────────────────────────────────────────────────────────────────────────────────
export function metaOf(article) {
  return { title: article.title, description: article.description, takeaways: article.takeaways || [], insights: article.insights || [], questions: article.questions || [], sourcesUsed: article.sourcesUsed || [] };
}

/** Models cite fact ids inside the prose ("(F08)", "[F02, F07]", "per F13"); ids belong only in META. */
export function stripFactIds(s) {
  return String(s)
    .replace(/\s*[\[(]\s*(?:see\s+|per\s+|cf\.\s+)?[FC]\d{2}(?:\s*[,;/]\s*[FC]\d{2})*\s*[\])]/g, '')
    .replace(/\s*(?:\(|\b)(?:see|per|cf\.)\s+[FC]\d{2}(?:\s*[,;/]\s*[FC]\d{2})*\)?/gi, '')
    .replace(/\b[FC]\d{2}\b(?=[^\w/-])/g, '')
    .replace(/[ \t]+([.,;:!?])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/^[ \t]+/, '');
}

export function parseJSON(text) {
  const s = String(text).replace(/```json|```/g, '');
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('no JSON object in the reply');
  return JSON.parse(s.slice(a, b + 1));
}

export function parseMetaBody(text) {
  const s = String(text).replace(/\r\n/g, '\n');
  const m = s.indexOf('===META===');
  const b = s.indexOf('===BODY===');
  if (m < 0 || b < 0 || b < m) throw new Error('reply is missing the ===META=== / ===BODY=== envelope');
  const meta = parseJSON(s.slice(m + 10, b));
  let body = s.slice(b + 10).trim();
  body = body.replace(/^```(markdown|md)?\n([\s\S]*?)\n```\s*$/, '$2'); // a fenced body is still a body
  for (const k of ['title', 'description']) if (typeof meta[k] !== 'string' || !meta[k].trim()) throw new Error(`META.${k} missing`);
  if (!body) throw new Error('empty body');
  body = stripFactIds(body);
  return {
    title: stripFactIds(meta.title.trim()),
    description: stripFactIds(meta.description.trim()),
    takeaways: Array.isArray(meta.takeaways) ? meta.takeaways.map((t) => stripFactIds(String(t))) : [],
    insights: Array.isArray(meta.insights) ? meta.insights.map((i) => ({ heading: String(i.heading || ''), factIds: Array.isArray(i.factIds) ? i.factIds.map(String) : [] })) : [],
    questions: Array.isArray(meta.questions) ? meta.questions.map(String) : [],
    sourcesUsed: Array.isArray(meta.sourcesUsed) ? meta.sourcesUsed.map(String) : [],
    repairs: Array.isArray(meta.repairs) ? meta.repairs.map(String) : [], // what a repair reply says it changed, kept for the record
    body,
  };
}

/** Apply the policy's repair thresholds to a total score. */
export function verdictFor(total) {
  if (total >= P.editorial_review.minimum_score) return 'APPROVE';
  if (total >= 75) return 'ONE_REPAIR_PASS';
  return 'BLOCK';
}
