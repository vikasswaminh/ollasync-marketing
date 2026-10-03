#!/usr/bin/env node
// Marketing-site CSP (Round 10 SEC-002 www, 2026-09-10): the site is static, so its Content-Security-Policy is
// ENFORCED from day one and generated at build time — every inline <script> in the built pages (Astro `is:inline`
// blocks) is allowed by its SHA-256 hash, nothing else runs. Runs as gate 3 of scripts/mkt_deploy.sh (and in the
// marketing CI job) against the BUILT dist and rewrites the `__MKT_CSP__` placeholder in dist/_headers
// (public/_headers keeps the placeholder).
//
//   node scripts/mkt_csp_headers.mjs [dist]        (default: marketing-site/dist)
//
// What the policy allows and why (verified on the live site on 2026-09-10):
//   script-src   'self' + the inline scripts by hash + https://static.cloudflareinsights.com — Cloudflare Web
//                Analytics injects beacon.min.js at the edge on every page; Email Address Obfuscation injects a
//                SAME-ORIGIN /cdn-cgi/scripts/…/email-decode.min.js on pages with mail links ('self' covers it).
//                No Rocket Loader (the edge serves inline bodies byte-identical to the build — checked home + contact).
//   connect-src  'self' + https://cloudflareinsights.com — the beacon's POST target.
//   style-src    'self' 'unsafe-inline' — Astro inlines small stylesheets and the pages carry style attributes;
//                inline styles are not a script vector.
//   img-src      'self' data: · font-src 'self' (Lato self-hosted) · frame-ancestors 'none' · base-uri 'self' ·
//   form-action  'self' (the contact form is JS → location.href = mailto:, a navigation) · object-src 'none'.
//
// The gate FAILS (the deploy / CI check aborts) on anything the policy would block at runtime (Codex, PR #75):
//   a script from an unlisted origin or a non-http scheme (absolute or scheme-relative); an external stylesheet /
//   preload / icon / manifest / frame / image (src, srcset, <input type=image>, SVG <image>) / media / poster / form
//   action or submitter formaction / <base> / <a ping>; any <object> or <embed>; an inline event handler or javascript:
//   URL (quoted or not); an external url() or @import in emitted CSS, <style> blocks or style attributes (quoted or
//   not); a header line over Cloudflare Pages' 2,000-character limit. Script bodies are hashed from the RAW bytes
//   (opening tags tokenized with quoted-attribute awareness), then masked out before the element scan; HTML comments
//   are removed outside raw-text elements only; CSS comments are removed before the resource check; only a real
//   `src=` / `type=` attribute counts (not data-src= / data-type=), and every JavaScript MIME type is executable.
//   Not covered on purpose: destinations inside the hashed scripts' own code (fetch/XHR) — the headed proof runs the
//   pages under the generated policy and fails on any securitypolicyviolation, which is the runtime backstop.
// Idempotent: a dist that already carries a generated policy (a retried deploy, a preview build promoted to
// production) gets the Content-Security-Policy line of its `/*` block replaced; a placeholder left anywhere fails.
import { createHash } from "node:crypto"
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const DIST = process.argv[2] || "marketing-site/dist"
const ALLOWED_SCRIPT_HOSTS = new Set(["https://static.cloudflareinsights.com"])
// <link> relations the browser does NOT fetch (CSP never sees them); everything else with an external href — stylesheet,
// preload, prefetch, icon, manifest, modulepreload — would be blocked by the policy and fails the gate
const NON_FETCHING_LINK_RELS = new Set(["canonical", "alternate", "author", "license", "prev", "next", "help", "bookmark", "me", "nofollow", "noopener", "noreferrer", "tag", "search"])
// the HTML standard's JavaScript MIME type essence set (all executable) + module
const JS_TYPES = new Set(["module", "application/ecmascript", "application/javascript", "application/x-ecmascript", "application/x-javascript", "text/ecmascript", "text/javascript", "text/javascript1.0", "text/javascript1.1", "text/javascript1.2", "text/javascript1.3", "text/javascript1.4", "text/javascript1.5", "text/jscript", "text/livescript", "text/x-ecmascript", "text/x-javascript"])
const MAX_LINE = 2000

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(html|css)$/i.test(name)) out.push(p)
  }
  return out
}
const relOf = (p) => p.slice(DIST.length + 1).replace(/\\/g, "/")
const ATTRS = `(?:[^>"']|"[^"]*"|'[^']*')*` // an opening tag's attributes, quoted values may contain >
const isExternal = (u) => /^(?:https?:)?\/\//i.test(String(u || "").trim()) // absolute OR scheme-relative
const schemeOf = (u) => (/^([a-z][a-z0-9+.-]*):/i.exec(String(u || "").trim()) || [])[1]?.toLowerCase() || ""
const originOf = (u) => { const s = String(u).trim(); try { return new URL(s.startsWith("//") ? "https:" + s : s).origin } catch { return s } }
// a REAL attribute (preceded by start or whitespace — never the tail of data-src / data-type); quoted or unquoted value
const decodeEntities = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (whole, e) => { const l = e.toLowerCase(); if (l[0] === "#") return String.fromCodePoint(parseInt(l[1] === "x" ? l.slice(2) : l.slice(1), l[1] === "x" ? 16 : 10)); return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }[l] }) // what the HTML parser sees (Codex, PR #75)
const attr = (attrs, name) => { const m = new RegExp(`(?:^|\\s)${name.replace(":", "\\:")}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(attrs); return m ? decodeEntities(m[1] ?? m[2] ?? m[3] ?? "") : null }
const blank = (s) => s.replace(/[^\n]/g, " ") // keep line structure, drop content

const problems = []
const externals = new Set()
const hashes = new Map() // sha256 base64 → { bytes, pages, head }
const cssExternal = (cssRaw, where) => {
  const css = cssRaw.replace(/\/\*[\s\S]*?\*\//g, "") // CSS comments are not fetched
  for (const m of css.matchAll(/url\(\s*["']?([^"')]+?)["']?\s*\)/gi)) {
    const sch = schemeOf(m[1])
    if (isExternal(m[1])) problems.push(`${where}: external url(${originOf(m[1])}) in CSS`)
    else if (sch && sch !== "http" && sch !== "https" && sch !== "data") problems.push(`${where}: url(${sch}:…) in CSS — no directive allows that scheme`) // data: stays (img-src allows it; a data: font/style would fail the headed proof)
  }
  for (const m of css.matchAll(/@import\s+(?:url\(\s*)?["']?([^"')\s;]+)/gi)) {
    const sch = schemeOf(m[1])
    if (isExternal(m[1])) problems.push(`${where}: external @import ${originOf(m[1])} in CSS`)
    else if (sch && sch !== "http" && sch !== "https") problems.push(`${where}: @import ${sch}:… in CSS — style-src allows no such scheme`)
  }
}

const files = walk(DIST)
const pages = files.filter((f) => /\.html$/i.test(f))
if (!pages.length) { console.error(`mkt_csp_headers: no HTML under ${DIST} — build first`); process.exit(2) }
const SCRIPT = new RegExp(`<script\\b(${ATTRS})>([\\s\\S]*?)<\\/script\\s*>`, "gi") // `</script >` closes too (Codex, PR #75)
const STYLE = new RegExp(`<style\\b(${ATTRS})>([\\s\\S]*?)<\\/style\\s*>`, "gi")
for (const p of pages) {
  const rel = relOf(p)
  const raw = readFileSync(p, "utf8")
  // 1. scripts: hashed from the RAW bytes (what the browser executes), then masked out of the document
  let masked = raw.replace(SCRIPT, (whole, attrs, body) => {
    const src = attr(attrs, "src")
    if (src !== null) {
      const sch = schemeOf(src)
      if (isExternal(src)) { const o = originOf(src); externals.add(o); if (!ALLOWED_SCRIPT_HOSTS.has(o)) problems.push(`${rel}: external script from ${o}`) }
      else if (sch && sch !== "http" && sch !== "https") problems.push(`${rel}: script with a ${sch}: URL (script-src has no such scheme)`)
      return blank(whole)
    }
    const type = (attr(attrs, "type") || "").trim().toLowerCase()
    if (type && !JS_TYPES.has(type)) return blank(whole) // a data block (application/ld+json, text/template, …) is never executed
    const h = createHash("sha256").update(body, "utf8").digest("base64")
    const e = hashes.get(h) || { bytes: Buffer.byteLength(body, "utf8"), pages: [], head: body.trim().slice(0, 60).replace(/\s+/g, " ") }
    e.pages.push(rel)
    hashes.set(h, e)
    return blank(whole)
  })
  // 2. style blocks: checked for external fetches, then masked out
  masked = masked.replace(STYLE, (whole, attrs, body) => { cssExternal(body, rel + " <style>"); return blank(whole) })
  // 3. HTML comments — outside raw-text elements only (scripts/styles are already gone)
  const html = masked.replace(/<!--[\s\S]*?-->/g, (c) => blank(c))
  // 4. elements the policy governs
  for (const m of html.matchAll(new RegExp(`<(link|iframe|frame|img|image|video|audio|source|track|base|form|button|input|a|area|object|embed)\\b(${ATTRS})>`, "gi"))) {
    const tag = m[1].toLowerCase(), attrs = m[2] || ""
    if (tag === "object" || tag === "embed") { problems.push(`${rel}: <${tag}> is blocked by object-src 'none'`); continue }
    const urls = []
    const names = tag === "a" || tag === "area" ? ["ping"] : tag === "button" ? ["formaction"] : tag === "input" ? ["formaction", "src"] : tag === "image" ? ["href", "xlink:href"] : ["href", "src", "action", "data", "poster"]
    // [url, may-be-data:] — data: is allowed ONLY where img-src governs: <img src/srcset>, <picture><source srcset>, SVG <image>, <input type=image src>
    const inPicture = tag === "source" && /\ssrcset\s*=/i.test(attrs) && !/\ssrc\s*=/i.test(attrs)
    const isImageSrc = (a) => (tag === "img" && (a === "src" || a === "srcset")) || (tag === "image") || (tag === "input" && a === "src") || (inPicture && a === "srcset")
    for (const a of names) { const v = attr(attrs, a); if (v) for (const u of (a === "ping" ? v.split(/\s+/) : [v])) if (u) urls.push([u, isImageSrc(a)]) }
    const srcset = attr(attrs, "srcset")
    if (srcset) for (const c of srcset.split(",")) { const u = c.trim().split(/\s+/)[0]; if (u) urls.push([u, isImageSrc("srcset")]) }
    if (tag === "link") {
      const rels = (attr(attrs, "rel") || "").toLowerCase().split(/\s+/).filter(Boolean)
      if (rels.length && rels.every((r) => NON_FETCHING_LINK_RELS.has(r))) continue // hreflang alternates, canonical, … — never fetched
    }
    for (const [u, mayBeData] of urls) {
      const sch = schemeOf(u)
      if (isExternal(u)) problems.push(`${rel}: external <${tag}> ${tag === "form" || tag === "button" || tag === "input" ? "form action" : tag === "base" ? "href (base-uri 'self')" : tag === "a" || tag === "area" ? "ping (connect-src)" : "resource"} from ${originOf(u)}`)
      else if (sch && sch !== "http" && sch !== "https" && !(mayBeData && sch === "data")) problems.push(`${rel}: <${tag}> uses a ${sch}: URL the policy does not allow here`)
    }
  }
  // 5. inline handlers, javascript: URLs, style attributes (quoted or unquoted)
  for (const m of html.matchAll(new RegExp(`<[a-z][a-z0-9-]*(?:${ATTRS})?\\s(on[a-z]+)\\s*=`, "gi"))) problems.push(`${rel}: inline event handler ${m[1]}=`)
  if (/\s(?:href|src|action|formaction)\s*=\s*["']?\s*javascript:/i.test(html)) problems.push(`${rel}: javascript: URL`)
  for (const m of html.matchAll(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) cssExternal(m[1] ?? m[2] ?? m[3] ?? "", rel + " style=")
}
for (const p of files.filter((f) => /\.css$/i.test(f))) cssExternal(readFileSync(p, "utf8"), relOf(p))
if (problems.length) { console.error("mkt_csp_headers: the policy would block:\n  " + problems.join("\n  ")); process.exit(3) }

const hashList = [...hashes.keys()].sort().map((h) => `'sha256-${h}'`).join(" ")
const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...ALLOWED_SCRIPT_HOSTS].join(" ")}${hashList ? " " + hashList : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://cloudflareinsights.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ")

const headersPath = join(DIST, "_headers")
let headers
try { headers = readFileSync(headersPath, "utf8") } catch (e) { console.error(`mkt_csp_headers: ${headersPath} missing (public/_headers is copied by the build)`); process.exit(2) }
const line = `  Content-Security-Policy: ${csp}`
if (line.length > MAX_LINE) { console.error(`mkt_csp_headers: header line ${line.length} chars exceeds the Pages _headers limit (${MAX_LINE})`); process.exit(3) }
let already = false
if (headers.includes("__MKT_CSP__")) headers = headers.split("__MKT_CSP__").join(csp) // a fresh build: every placeholder
else {
  // an already-gated dist: replace the policy line that belongs to the `/*` block (a route-specific CSP elsewhere is left alone)
  const lines = headers.split("\n")
  const start = lines.findIndex((l) => l.trim() === "/*")
  let found = -1
  for (let j = start + 1; start >= 0 && j < lines.length && /^\s+\S/.test(lines[j]); j++) if (/^\s*Content-Security-Policy:/i.test(lines[j])) found = j
  if (found < 0) { console.error("mkt_csp_headers: dist/_headers has neither a __MKT_CSP__ placeholder nor a Content-Security-Policy line in its /* block — public/_headers must carry `Content-Security-Policy: __MKT_CSP__`"); process.exit(2) }
  lines[found] = lines[found].replace(/^(\s*Content-Security-Policy:\s*).*$/i, (_, k) => k + csp)
  headers = lines.join("\n")
  already = true
}
if (headers.includes("__MKT_CSP__")) { console.error("mkt_csp_headers: a __MKT_CSP__ placeholder is still present after the rewrite"); process.exit(2) }
writeFileSync(headersPath, headers)

console.log(`mkt_csp_headers: ${pages.length} pages, ${hashes.size} distinct inline script(s), ${externals.size} external script origin(s) (${[...externals].join(", ") || "none"})`)
for (const [h, e] of hashes) console.log(`  sha256-${h}  ${e.bytes} B  on ${e.pages.length} page(s)  "${e.head}"`)
console.log(`  policy: ${csp.length} chars → written to ${headersPath}${already ? " (replaced the policy a previous run wrote — idempotent rerun)" : ""}`)
