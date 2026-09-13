import { LANG_COUNT } from './data/languages';
// Central site config — nav, footer, product constants.
// NOTE: public copy only. Never reference internal vendors/stack here (see scripts/mkt_no_leak.sh).
// Positioning: Platform For Learning — an AI classroom for trainers, tutors and coaches. Live classes
// with real-time voice translation and automatic AI class notes.
// Honesty: only ever name the 19 SHIPPED translate languages (single source: src/data/languages.ts) (backend/dealroom/lang_pref.go
// TRANSLATE_LANGS = en,es,fr,hi,de,zh,ja,pt,ar,ru — mirrored in both client menus). No self-host claims,
// no cert claims. Captions exist in the product but are not part of the pitch.

export const SITE = {
  name: 'Ollasync',
  domain: 'ollasync.com',
  // Canonical host is www (apex 301-redirects to www). Drives canonicals/OG/schema.
  url: 'https://www.ollasync.com',
  appUrl: 'https://login.ollasync.com',
  tagline: 'Teach anyone. In any language.',
  description:
    `AI classroom and Zoom alternative for trainers and tutors. Teach live with voice translation in ${LANG_COUNT} languages, AI class notes, captions and recordings.`, // operator's wording, 2026-09-12 (≤ 160 chars)
  // Was og-ollasync.png — a padlock-in-shield cybersecurity graphic from the previous branding, and
  // the single most-shared brand asset. The old file is left in place so this is a one-line rollback.
  ogImage: '/og-classroom.jpg',
  email: 'hello@ollasync.com',
  salesEmail: 'sales@ollasync.com',
};

export type NavItem = { label: string; href: string; desc?: string };
export type NavGroup = { label: string; href?: string; items?: NavItem[] };

export const NAV: NavGroup[] = [
  // Mockup shape (2026-09-06): Product ▾ / Use cases ▾ / Pricing / Resources ▾ — every dropdown item is a REAL page
  // (Nav.astro renders `items` as a dropdown; the group's top link goes to the first item).
  {
    label: 'Product',
    items: [
      { label: 'All features', href: '/features' },
      { label: 'Virtual classroom software', href: '/virtual-classroom-software', desc: 'The category page: live teaching, not meetings' },
      { label: 'Live translation', href: '/features/live-translation', desc: `${LANG_COUNT} languages, captions or spoken audio` },
      { label: 'Live captions', href: '/features/live-captions' },
      { label: 'Local recording', href: '/features/local-recording', desc: 'On your device, in your language' },
      { label: 'Live classes & video', href: '/features/video-meetings' },
      { label: 'AI class notes', href: '/features/ai' },
      { label: 'Webinars for training', href: '/features/webinars' },
      { label: 'Recordings', href: '/features/recordings' },
      { label: 'Deal rooms', href: '/features/deal-rooms' },
    ],
  },
  {
    label: 'Use cases',
    items: [
      { label: 'All use cases', href: '/use-cases' },
      { label: 'Tutors', href: '/use-cases/tutors' },
      { label: 'Professional trainers', href: '/use-cases/trainers' },
      { label: 'Academies & bootcamps', href: '/use-cases/academies' },
      { label: 'Employee onboarding', href: '/use-cases/onboarding' },
      { label: 'Healthcare', href: '/use-cases/healthcare' },
      { label: 'Legal', href: '/use-cases/legal' },
      { label: 'Finance', href: '/use-cases/finance' },
      { label: 'Public sector', href: '/use-cases/government' },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
  {
    label: 'Compare',
    items: [
      { label: 'vs Zoom', href: '/alternatives/zoom' },
      { label: 'vs Microsoft Teams', href: '/alternatives/microsoft-teams' },
      { label: 'vs Google Meet', href: '/alternatives/google-meet' },
      { label: 'vs Webex', href: '/alternatives/webex' },
      { label: 'vs Cvent', href: '/alternatives/cvent' },
    ],
  },
];

export const FOOTER: { title: string; links: NavItem[] }[] = [
  // Phase 1: the deal-room product link and the deal-room verticals column are gone — they were the
  // previous positioning. The pages themselves stay live (and in the sitemap) until the phase-2 sweep
  // repositions them, so nothing 404s. Labels still match what each page actually says.
  {
    title: 'Product',
    links: [
      { label: 'Virtual classroom software', href: '/virtual-classroom-software' },
      { label: 'Live translation', href: '/features/live-translation' },
      { label: 'Live captions', href: '/features/live-captions' },
      { label: 'Local recording', href: '/features/local-recording' },
      { label: 'Languages', href: '/languages' },
      { label: 'For trainers', href: '/use-cases/trainers' },
      { label: 'AI notes & transcripts', href: '/features/ai' },
      { label: 'Video meetings', href: '/features/video-meetings' },
      { label: 'Webinars', href: '/features/webinars' },
      { label: 'Recordings', href: '/features/recordings' },
      { label: 'Deal rooms', href: '/features/deal-rooms' },
      { label: 'All features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Compare',
    links: [
      { label: 'vs Zoom', href: '/alternatives/zoom' },
      { label: 'vs Microsoft Teams', href: '/alternatives/microsoft-teams' },
      { label: 'vs Google Meet', href: '/alternatives/google-meet' },
      { label: 'vs Webex', href: '/alternatives/webex' },
      { label: 'vs Cvent', href: '/alternatives/cvent' },
    ],
  },
  {
    // Industries column restored for internal-link equity (the phase-1 sweep dropped it and the four
    // live use-case pages were left with almost no internal links). Labels match what the pages say.
    title: 'Industries & Roles',
    links: [
      { label: 'Healthcare Compliance', href: '/industries/healthcare-compliance-training' },
      { label: 'Franchise Training', href: '/industries/franchise-training-software' },
      { label: 'Manufacturing Safety', href: '/industries/manufacturing-safety-training' },
      { label: 'Tech Startup Onboarding', href: '/industries/tech-startup-onboarding' },
      { label: 'Non-Profit Training', href: '/industries/non-profit-volunteer-training' },
      { label: 'L&D Professionals', href: '/roles/learning-and-development' },
      { label: 'HR Global Onboarding', href: '/roles/hr-global-onboarding' },
      { label: 'Customer Success', href: '/roles/customer-success-webinars' },
      { label: 'Sales Enablement', href: '/roles/sales-enablement-coaching' },
      { label: 'All use cases', href: '/use-cases' },
    ],
  },
  {
    title: 'Resources & Integrations',
    links: [
      { label: 'LMS Integration', href: '/integrations/lms-video-translation' },
      { label: 'SCORM Virtual Classroom', href: '/integrations/scorm-virtual-classroom' },
      { label: 'AI Video Analytics', href: '/integrations/ai-video-analytics' },
      { label: 'Attendance Tracking', href: '/integrations/automated-attendance-tracking' },
      { label: 'Security', href: '/security' },
      { label: 'Developers', href: '/developers' },
      { label: 'Compliance', href: '/compliance' },
      { label: 'Blog', href: '/blog' },
      { label: 'Docs', href: '/docs' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'DPA', href: '/dpa' },
      // 'Open-source licenses' (/licenses) is deliberately unlinked. The page still builds and is
      // still reachable at its URL, but it is the ONE page exempted from scripts/mkt_no_leak.sh —
      // it names LiveKit, NATS, PostgreSQL and DeepFilterNet by design, and linking it from every
      // page's footer published the stack the guard hides everywhere else.
      // The attributions are kept in marketing-site/OPEN_SOURCE_NOTICES.md.
      { label: 'security.txt', href: '/.well-known/security.txt' },
    ],
  },
];
