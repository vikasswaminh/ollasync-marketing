import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.argv[2] || 'dist');
const sitemap = readFileSync(join(root, 'sitemap-0.xml'), 'utf8');
const urls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
const site = 'https://www.ollasync.com';
const link = (label, path) => {
  const url = new URL(path, site).href;
  if (!urls.has(url)) throw new Error(`llms.txt references a page absent from the sitemap: ${url}`);
  return `- [${label}](${url})`;
};
const rss = readFileSync(join(root, 'rss.xml'), 'utf8');
const entries = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
  const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  const url = item.match(/<link>([^<]+)<\/link>/)?.[1];
  const date = item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1];
  return { title, url, date: Date.parse(date || '') };
}).filter((entry) => entry.title && entry.url && urls.has(entry.url)).sort((a, b) => b.date - a.date || a.url.localeCompare(b.url));
const text = [
  '# OllaSync',
  '',
  '> OllaSync makes video meetings and live training available across languages with participant-selected translated voice or captions.',
  '',
  'OllaSync offers cloud SaaS for learning and meetings, plus dedicated hosted deployments for regulated organizations. The published meeting plans support up to 100 participants. Check current terms and availability with the team before making procurement or compliance decisions.',
  '',
  'Live translation supports 19 languages, with up to five different selected languages in one meeting. A participant can save a personal local recording on their device; eligible hosts can separately use cloud recording and AI notes from recorded meetings. Local recording does not imply that translation, metadata, or AI transcription is processed entirely on-device. End-to-end-encrypted meetings do not offer live translation, cloud recording, or AI notes.',
  '',
  '## Product and trust',
  link('Homepage — Meet beyond language', '/'),
  link('Features', '/features/'),
  link('Live translation', '/features/live-translation/'),
  link('Local recording', '/features/local-recording/'),
  link('AI meeting notes', '/features/ai/'),
  link('Pricing and plan limits', '/pricing/'),
  link('Security and encryption', '/security/'),
  link('Compliance', '/compliance/'),
  link('Contact', '/contact/'),
  '',
  '## Explore',
  link('Blog', '/blog/'),
  link('Multilingual meetings', '/blog/topics/multilingual-meetings/'),
  link('Global training', '/blog/topics/global-training/'),
  link('Secure collaboration', '/blog/topics/secure-collaboration/'),
  link('Software comparisons', '/blog/topics/software-comparisons/'),
  link('Compare platforms', '/vs/'),
  link('Supported languages', '/languages/'),
  '',
  '## Recent articles',
  ...entries.slice(0, 30).map(({ title, url }) => `- [${title.replace(/&amp;/g, '&').replace(/[\[\]]/g, '')}](${url})`),
  '',
  `For the complete canonical URL inventory, see ${site}/sitemap-index.xml.`,
  '',
].join('\n');
writeFileSync(join(root, 'llms.txt'), text, 'utf8');
console.log(`Generated llms.txt with ${Math.min(entries.length, 30)} recent articles.`);
