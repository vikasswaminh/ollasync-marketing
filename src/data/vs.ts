// Comparison pages. ACCURACY-CRITICAL: claims about competitors must be fair and
// defensible. Competitors genuinely offer optional E2EE and some EU residency —
// we say so. Our real, hard differentiators are self-host/air-gap, server-blind
// messaging by default, native deal rooms, and non-US operation. State values:
// 'yes' (we/they do it), 'partial' (conditional/limited), 'no' (not offered).

export type Cell = { state: 'yes' | 'partial' | 'no'; note?: string };

export interface Dimension {
  label: string;
  ollasync: Cell;
}

// Shared dimensions; each competitor supplies its own cell per row (by index).
export const DIMENSIONS: string[] = [
  'Self-hosted / on-premise deployment',
  'Fully air-gapped operation',
  'You operate the media servers',
  'Server-blind end-to-end encrypted messaging',
  'Optional end-to-end encrypted meetings',
  'EU data residency',
  'No vendor access to content (self-hosted)',
  'Native confidential deal rooms / data room',
  'Non-US operator / jurisdiction option',
];

export const OLLASYNC_CELLS: Cell[] = [
  { state: 'yes', note: 'Private cloud, on-premise or air-gapped' },
  { state: 'yes' },
  { state: 'yes', note: 'Self-host the relay (SFU) yourself' },
  { state: 'yes', note: 'IETF MLS / RFC 9420, on by default' },
  { state: 'yes', note: 'Per-frame E2EE mode' },
  { state: 'yes', note: 'EU-hosted, or your own region' },
  { state: 'yes' },
  { state: 'yes', note: 'Role + NDA gated, with live video' },
  { state: 'yes', note: 'Self-host, or EU operator' },
];

export interface Competitor {
  slug: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  intro: string;
  fair: string; // credit where due — keeps the page honest and credible
  cells: Cell[]; // aligned to DIMENSIONS by index
  switchReasons: string[];
  faq: { q: string; a: string }[];
}

export const COMPETITORS: Competitor[] = [
  {
    slug: 'zoom',
    name: 'Zoom',
    metaTitle: 'Ollasync vs Zoom — the self-hosted, encrypted alternative',
    metaDescription:
      'A secure, self-hostable Zoom alternative. Compare Ollasync and Zoom on end-to-end encryption, self-hosting, data residency and confidential deal rooms.',
    eyebrow: 'Ollasync vs Zoom',
    intro:
      'Zoom is the default for quick, reliable meetings. But it runs only on Zoom’s US-operated cloud, and its end-to-end encryption is an opt-in mode that turns off features. If your meetings are sensitive enough that where they run matters, Ollasync gives you the same one-click, no-download experience — on infrastructure you control.',
    fair:
      'Zoom is fast, familiar and scales enormously, and it does offer an optional end-to-end encryption mode for meetings. For most consumer and general-business calls, that’s plenty. The gap opens when you need to control where data lives and who operates the servers.',
    cells: [
      { state: 'no', note: 'Cloud SaaS only' },
      { state: 'no' },
      { state: 'no', note: 'Zoom operates the cloud' },
      { state: 'partial', note: 'Team Chat has an optional E2EE mode' },
      { state: 'yes', note: 'Opt-in; disables some features' },
      { state: 'partial', note: 'Some data-residency options' },
      { state: 'no' },
      { state: 'no', note: 'No native data room' },
      { state: 'no', note: 'US company (CLOUD Act)' },
    ],
    switchReasons: [
      'You need meetings, recordings and documents to stay on infrastructure you operate — or fully air-gapped.',
      'You want end-to-end encrypted messaging that’s server-blind by default, not an optional toggle.',
      'You need a confidential deal room with live video, not just a call.',
      'You need a non-US operator or your own jurisdiction for data-sovereignty reasons.',
    ],
    faq: [
      { q: 'Is Ollasync a drop-in Zoom replacement?', a: 'For the core experience — one-click, no-download browser meetings with screen share, recording and chat — yes. Ollasync adds self-hosting, server-blind messaging and confidential deal rooms that Zoom’s cloud model doesn’t offer.' },
      { q: 'Does Zoom offer end-to-end encryption?', a: 'Yes — Zoom has an optional E2EE meeting mode (AES-256-GCM) that you enable per meeting, though it disables some features. It is not on by default, and Zoom still operates the cloud your meeting runs on. Ollasync lets you operate the servers yourself.' },
      { q: 'Can I self-host like Zoom?', a: 'Zoom is a cloud service; you can’t run it in your own datacenter. Ollasync is designed to be self-hosted — private cloud, on-premise or air-gapped — so data never leaves your control.' },
    ],
  },
  {
    slug: 'microsoft-teams',
    name: 'Microsoft Teams',
    metaTitle: 'Ollasync vs Microsoft Teams — self-hosted encrypted meetings',
    metaDescription:
      'A secure, self-hostable alternative to Microsoft Teams. Compare encryption, self-hosting, data residency and confidential deal rooms for regulated teams.',
    eyebrow: 'Ollasync vs Microsoft Teams',
    intro:
      'Teams is deeply woven into Microsoft 365, which is exactly why some organisations can’t use it for their most sensitive work: it lives on Microsoft’s US-owned cloud, and end-to-end encryption is limited to one-to-one calls. Ollasync focuses on the confidential slice — encrypted, self-hostable, sovereign.',
    fair:
      'Teams is an excellent collaboration hub if you’re all-in on Microsoft 365, and Microsoft’s EU Data Boundary addresses many residency needs. It offers opt-in E2EE for one-to-one calls. Where it falls short is self-hosting and server-blind, group-scale confidentiality.',
    cells: [
      { state: 'no', note: 'Microsoft 365 cloud' },
      { state: 'no' },
      { state: 'no', note: 'Microsoft operates it' },
      { state: 'no', note: 'Channel/chat not E2EE' },
      { state: 'partial', note: '1:1 calls only, opt-in' },
      { state: 'partial', note: 'EU Data Boundary' },
      { state: 'no' },
      { state: 'no', note: 'No native data room' },
      { state: 'no', note: 'US company (CLOUD Act)' },
    ],
    switchReasons: [
      'You need confidentiality beyond one-to-one calls, including group meetings and messaging.',
      'You need to run the platform on your own infrastructure or air-gapped — not the Microsoft cloud.',
      'You need a confidential, NDA-gated deal room with live video.',
      'You need a non-US operator or full jurisdictional control over the data.',
    ],
    faq: [
      { q: 'Does Microsoft Teams have end-to-end encryption?', a: 'Teams offers opt-in end-to-end encryption for one-to-one calls. Group meetings, channels and chat are encrypted in transit and at rest but are not end-to-end encrypted. Ollasync provides server-blind end-to-end encrypted messaging by default and an E2EE meeting mode.' },
      { q: 'Can Teams be self-hosted?', a: 'No — Teams runs on Microsoft 365’s cloud. Microsoft’s EU Data Boundary helps with residency, but you cannot operate the servers yourself. Ollasync is built to be self-hosted or air-gapped.' },
      { q: 'We’re a Microsoft shop — can we still use Ollasync?', a: 'Yes. Ollasync integrates with your identity provider (including Entra ID) via OIDC single sign-on, so you can use it for confidential work alongside Teams for everyday collaboration.' },
    ],
  },
  {
    slug: 'google-meet',
    name: 'Google Meet',
    metaTitle: 'Ollasync vs Google Meet — encrypted, self-hosted alternative',
    metaDescription:
      'A private, self-hostable alternative to Google Meet. Compare end-to-end encryption, self-hosting, EU data residency and confidential deal rooms.',
    eyebrow: 'Ollasync vs Google Meet',
    intro:
      'Google Meet is simple and browser-native — and it runs entirely on Google’s US cloud. Client-side encryption exists, but only on higher Workspace tiers with admin-managed keys. Ollasync gives you private, encrypted meetings you can host yourself, with confidentiality that isn’t gated behind an enterprise SKU.',
    fair:
      'Meet is frictionless, reliable and genuinely good at browser-first meetings, and Google does offer client-side encryption on some enterprise Workspace editions. The limits are self-hosting, native confidential deal rooms and non-US operation.',
    cells: [
      { state: 'no', note: 'Google cloud only' },
      { state: 'no' },
      { state: 'no', note: 'Google operates it' },
      { state: 'no', note: 'Chat not E2EE' },
      { state: 'partial', note: 'Client-side encryption on some tiers' },
      { state: 'partial', note: 'Data regions on some tiers' },
      { state: 'no' },
      { state: 'no', note: 'No native data room' },
      { state: 'no', note: 'US company (CLOUD Act)' },
    ],
    switchReasons: [
      'You want encryption and residency control without needing a specific enterprise Workspace tier.',
      'You need to self-host or air-gap the platform on your own infrastructure.',
      'You need a confidential deal room with role and NDA gating and live video.',
      'You need a non-US operator or your own jurisdiction for the data.',
    ],
    faq: [
      { q: 'Is Google Meet end-to-end encrypted?', a: 'Standard Meet calls are encrypted in transit and at rest but not end-to-end encrypted. Google offers optional client-side encryption on certain enterprise Workspace editions with customer-managed keys. Ollasync offers server-blind E2EE messaging by default and an E2EE meeting mode, on any deployment.' },
      { q: 'Can I self-host Google Meet?', a: 'No — Meet is part of Google Workspace’s cloud. Ollasync is designed to be self-hosted, on-premise or air-gapped.' },
      { q: 'Does Ollasync work in the browser like Meet?', a: 'Yes. Ollasync meetings run in any modern browser with no download, and guests can join without an account.' },
    ],
  },
  {
    slug: 'webex',
    name: 'Cisco Webex',
    metaTitle: 'Ollasync vs Cisco Webex — self-hosted encrypted meetings',
    metaDescription:
      'A modern, self-hostable alternative to Cisco Webex. Compare end-to-end encryption, on-premise deployment, data residency and confidential deal rooms.',
    eyebrow: 'Ollasync vs Cisco Webex',
    intro:
      'Webex has a strong enterprise-security heritage and offers end-to-end encryption options. But its on-premise meeting server is being wound down in favour of the cloud, and it carries the weight of a large enterprise suite. Ollasync is a lighter, browser-first platform built self-hosted-first.',
    fair:
      'Webex is a capable, security-conscious enterprise platform with genuine E2EE options and mature admin controls. If you’re standardised on Cisco, it’s a reasonable choice. Ollasync’s edge is a modern, self-hosted-first architecture, native confidential deal rooms and simplicity.',
    cells: [
      { state: 'partial', note: 'On-prem server being retired' },
      { state: 'no' },
      { state: 'partial', note: 'Only on legacy on-prem' },
      { state: 'partial', note: 'E2EE messaging available' },
      { state: 'yes', note: 'Opt-in E2EE meetings' },
      { state: 'partial', note: 'Data-residency options' },
      { state: 'partial', note: 'Only on legacy on-prem' },
      { state: 'no', note: 'No native data room' },
      { state: 'no', note: 'US company (CLOUD Act)' },
    ],
    switchReasons: [
      'You want a self-hosted-first platform, not a cloud migration away from on-premise.',
      'You want a modern, browser-native experience without a heavy client or enterprise suite.',
      'You need a confidential deal room with role and NDA gating and live video.',
      'You need a non-US operator or your own jurisdiction, including air-gapped.',
    ],
    faq: [
      { q: 'Does Webex support end-to-end encryption?', a: 'Yes — Webex offers opt-in end-to-end encryption for meetings and has E2EE messaging options. Ollasync provides server-blind E2EE messaging by default and an E2EE meeting mode, with a self-hosted-first architecture.' },
      { q: 'Can Webex still be run on-premise?', a: 'Cisco’s on-premise Webex Meetings Server is being retired in favour of the cloud. Ollasync is built to be self-hosted, on-premise or air-gapped as a first-class deployment, not a legacy path.' },
      { q: 'Is Ollasync simpler than Webex?', a: 'Ollasync is a focused, browser-first platform — meetings, webinars, recordings, messaging and deal rooms — without the surface area of a full enterprise collaboration suite.' },
    ],
  },
];
