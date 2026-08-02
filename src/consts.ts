// Central site config — nav, footer, product constants.
// NOTE: public copy only. Never reference internal vendors/stack here (see scripts/mkt_no_leak.sh).

export const SITE = {
  name: 'Ollasync',
  domain: 'ollasync.com',
  // Canonical host is www (apex 301-redirects to www). Drives canonicals/OG/schema.
  url: 'https://www.ollasync.com',
  appUrl: 'https://login.ollasync.com',
  tagline: 'Self-hosted, end-to-end encrypted video meetings & deal rooms',
  description:
    'Ollasync is end-to-end encrypted video meetings, webinars, recordings and confidential deal rooms — self-hostable, EU-hosted, server-blind by design. A secure Zoom alternative for teams that can’t trust the cloud.',
  ogImage: '/og-ollasync.png',
  email: 'hello@ollasync.com',
  salesEmail: 'sales@ollasync.com',
};

export type NavItem = { label: string; href: string; desc?: string };
export type NavGroup = { label: string; href?: string; items?: NavItem[] };

export const NAV: NavGroup[] = [
  {
    label: 'Product',
    items: [
      { label: 'Video meetings', href: '/features/video-meetings', desc: 'Encrypted 4K calls, no download' },
      { label: 'Webinars', href: '/features/webinars', desc: 'Broadcast to large audiences' },
      { label: 'Recordings', href: '/features/recordings', desc: 'Encryption-gated capture' },
      { label: 'Deal rooms', href: '/features/deal-rooms', desc: 'Confidential document rooms' },
      { label: 'Messaging', href: '/features/messaging', desc: 'Server-blind team messaging' },
    ],
  },
  {
    label: 'Solutions',
    items: [
      { label: 'Self-hosted', href: '/self-hosted', desc: 'Run it on your own infrastructure' },
      { label: 'Healthcare', href: '/use-cases/healthcare', desc: 'Private telehealth & PHI' },
      { label: 'Legal', href: '/use-cases/legal', desc: 'Privileged client comms' },
      { label: 'Finance', href: '/use-cases/finance', desc: 'Confidential deal & advisory calls' },
      { label: 'Government', href: '/use-cases/government', desc: 'Sovereign, on-premise' },
    ],
  },
  {
    label: 'Compare',
    items: [
      { label: 'vs Zoom', href: '/vs/zoom' },
      { label: 'vs Microsoft Teams', href: '/vs/microsoft-teams' },
      { label: 'vs Google Meet', href: '/vs/google-meet' },
      { label: 'vs Webex', href: '/vs/webex' },
    ],
  },
  { label: 'Security', href: '/security' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
];

export const FOOTER: { title: string; links: NavItem[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Video meetings', href: '/features/video-meetings' },
      { label: 'Webinars', href: '/features/webinars' },
      { label: 'Recordings', href: '/features/recordings' },
      { label: 'Deal rooms', href: '/features/deal-rooms' },
      { label: 'Messaging', href: '/features/messaging' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Self-hosted', href: '/self-hosted' },
      { label: 'Healthcare', href: '/use-cases/healthcare' },
      { label: 'Legal', href: '/use-cases/legal' },
      { label: 'Finance', href: '/use-cases/finance' },
      { label: 'Government', href: '/use-cases/government' },
    ],
  },
  {
    title: 'Compare',
    links: [
      { label: 'vs Zoom', href: '/vs/zoom' },
      { label: 'vs Microsoft Teams', href: '/vs/microsoft-teams' },
      { label: 'vs Google Meet', href: '/vs/google-meet' },
      { label: 'vs Webex', href: '/vs/webex' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Security', href: '/security' },
      { label: 'Compliance', href: '/compliance' },
      { label: 'Blog', href: '/blog' },
      { label: 'Docs', href: '/docs' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'DPA', href: '/dpa' },
      { label: 'security.txt', href: '/.well-known/security.txt' },
    ],
  },
];
