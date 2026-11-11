import type { CollectionEntry } from 'astro:content';

export const TOPIC_PAGE_SIZE = 18;

export const topics = {
  'multilingual-meetings': {
    title: 'Multilingual meetings',
    description: 'Practical guides to live translation, accessible participation and clearer conversations across language barriers.',
    intro: 'A meeting works only when everyone can take part. Explore real-time voice translation, multilingual town halls and the operational choices behind inclusive global conversations.',
    startHere: [
      { slug: 'host-multilingual-corporate-town-hall', reason: 'Plan an inclusive company-wide event' },
      { slug: 'how-to-run-a-multilingual-town-hall-meeting', reason: 'Make Q&A work across languages' },
      { slug: 'is-there-a-meeting-platform-that-translates-audio-in-real-time', reason: 'Understand live translated audio' },
    ],
    product: { href: '/features/real-time-voice-translation/', label: 'Explore real-time voice translation' },
  },
  'global-training': {
    title: 'Global training',
    description: 'Ideas for multilingual employee learning, virtual classrooms and consistent training across locations.',
    intro: 'Training across locations requires more than translating a slide deck. Start with accessible learning experiences, then explore onboarding, classroom engagement and industry-specific delivery.',
    startHere: [
      { slug: 'how-to-train-non-english-speaking-employees-effectively', reason: 'Build a language-inclusive training plan' },
      { slug: 'best-practices-for-multilingual-virtual-classrooms', reason: 'Design a better virtual classroom' },
      { slug: 'how-to-standardize-l-d-across-global-offices', reason: 'Coordinate learning across offices' },
    ],
    product: { href: '/use-cases/global-workforce-training/', label: 'Explore global workforce training' },
  },
  'secure-collaboration': {
    title: 'Secure collaboration',
    description: 'Security, encryption, self-hosting and compliance considerations for enterprise video collaboration.',
    intro: 'Trust in a collaboration platform depends on where data goes, who can access it and how calls are protected. These guides unpack deployment, encryption and governance decisions.',
    startHere: [
      { slug: 'self-hosted-video-conferencing', reason: 'Understand the self-hosting trade-offs' },
      { slug: 'end-to-end-encrypted-video-conferencing', reason: 'Learn how encrypted calls work' },
      { slug: 'gdpr-compliant-video-conferencing', reason: 'Review privacy requirements for video' },
    ],
    product: { href: '/security/', label: 'Explore OllaSync security' },
  },
  'software-comparisons': {
    title: 'Software comparisons',
    description: 'Compare meeting, webinar and virtual classroom software, alternatives and pricing models.',
    intro: 'Choosing a platform means balancing language support, security, audience size and total cost. Start with direct comparisons, then examine alternatives and pricing questions.',
    startHere: [
      { slug: 'compare-zoom-webex-microsoft-teams-and-ollasync', reason: 'Compare major meeting platforms' },
      { slug: 'google-meet-vs-zoom-vs-ollasync-2026-cost-comparison', reason: 'Compare meeting software costs' },
      { slug: 'webinar-software-pricing-models-explained-2026-guide', reason: 'Understand webinar pricing models' },
    ],
    product: { href: '/vs/', label: 'Explore platform comparisons' },
  },
} as const;

export type BlogTopic = keyof typeof topics;
type BlogPost = CollectionEntry<'blog'>;

const trainingSubject = /(?:train(?:ing)?|onboard(?:ing)?|classroom|learning|education|students|scorm|l-d|employee-retention)/;
const meetingSubject = /(?:meeting|town-hall|webinar|conference|corporate-event|international-call|global-sales-kickoff|translated-audio|live-translation|live-voice-translation|live-human-interpreters|remote-teams|global-remote|language-barriers)/;
const languageSubject = /(?:multilingual|translat(?:e[sd]?|ion|or|ing)|languages?|interpret(?:er|ation)|non-english|non-native)/;
const securitySubject = /(?:encrypt|secur|privacy|gdpr|hipaa|soc2|compliance|data-residency|data-leak|self-host|identity|sso|deepfake|voice-cloning)/;
const softwareSubject = /(?:software|platform|tool|alternative|zoom|webex|microsoft-teams|google-meet|gotowebinar|pricing|price|cheaper|cheapest|cost-effective|roi|per-host|best-)/;

/** One primary editorial destination per post; ambiguous or generic articles stay on /blog/. */
export function getPrimaryTopic(post: BlogPost): BlogTopic | undefined {
  const { category } = post.data;
  const slug = post.slug.toLowerCase();

  if (category === 'Comparisons') {
    return softwareSubject.test(slug) ? 'software-comparisons' : undefined;
  }
  if (category === 'Self-hosting' || category === 'Self-Hosted' || category === 'Cryptography') {
    return 'secure-collaboration';
  }
  if ((category === 'Security' || category === 'Compliance') && securitySubject.test(slug)) {
    return 'secure-collaboration';
  }
  if ((category === 'Teaching' || category === 'Industry Verticals' || category === 'Enterprise Use Cases' || category === 'Guides' || category === 'Tactical How-To' || category === 'Future of Work') && trainingSubject.test(slug)) {
    return 'global-training';
  }
  if ((category === 'Translation' || category === 'Industry Verticals' || category === 'Enterprise Use Cases' || category === 'Guides' || category === 'Tactical How-To' || category === 'Future of Work' || category === 'Compliance') && languageSubject.test(slug) && meetingSubject.test(slug) && !trainingSubject.test(slug)) {
    return 'multilingual-meetings';
  }
  return undefined;
}

export function getTopicPosts(posts: BlogPost[], topic: BlogTopic): BlogPost[] {
  return posts
    .filter((post) => !post.data.draft && getPrimaryTopic(post) === topic)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.slug.localeCompare(b.slug, 'en'));
}

export function topicPageHref(topic: BlogTopic, page: number): string {
  return page === 1 ? `/blog/topics/${topic}/` : `/blog/topics/${topic}/page/${page}/`;
}
