import { LANG_COUNT } from './data/languages';
// Public site configuration. Meetings and their capabilities are the product.
// Language counts come from src/data/languages.ts.

export const SITE = {
  name: 'Ollasync',
  domain: 'ollasync.com',
  // Canonical host is www (apex 301-redirects to www). Drives canonicals/OG/schema.
  url: 'https://www.ollasync.com',
  appUrl: 'https://login.ollasync.com',
  tagline: 'Meet in your language.',
  description:
    `Browser-based video meetings with live translation in ${LANG_COUNT} languages, captions, screen sharing, recordings and AI meeting notes.`,
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
      { label: 'Meeting capabilities', href: '/features' },
      { label: 'Meetings for training', href: '/virtual-classroom-software', desc: 'Teach live with meeting tools and translation' },
      { label: 'Live translation', href: '/features/live-translation', desc: `${LANG_COUNT} languages, captions or spoken audio` },
      { label: 'Live captions', href: '/features/live-captions' },
      { label: 'Local recording', href: '/features/local-recording', desc: 'On your device, in your language' },
      { label: 'Video meetings', href: '/features/video-meetings' },
      { label: 'AI meeting notes', href: '/features/ai' },
      { label: 'Meeting recordings', href: '/features/recordings' },
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
    ],
  },
];

export const FOOTER: { title: string; links: NavItem[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Meetings for training', href: '/virtual-classroom-software' },
      { label: 'Live translation', href: '/features/live-translation' },
      { label: 'Live captions', href: '/features/live-captions' },
      { label: 'Local recording', href: '/features/local-recording' },
      { label: 'Languages', href: '/languages' },
      { label: 'For trainers', href: '/use-cases/trainers' },
      { label: 'AI notes & transcripts', href: '/features/ai' },
      { label: 'Video meetings', href: '/features/video-meetings' },
      { label: 'Meeting recordings', href: '/features/recordings' },
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
      { label: 'Customer Success', href: '/roles/customer-success-meetings' },
      { label: 'Sales Enablement', href: '/roles/sales-enablement-coaching' },
      { label: 'All use cases', href: '/use-cases' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Meeting links in your LMS', href: '/integrations/lms-video-translation' },
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
