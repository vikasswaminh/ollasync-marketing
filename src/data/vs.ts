import { LANG_COUNT } from './languages';
// Comparison pages. ACCURACY-CRITICAL: claims about competitors must be fair and
// defensible. Competitors genuinely offer AI notes, optional E2EE and some EU
// residency — we say so. Our real, honest differentiators are per-listener live
// translation, meeting privacy and browser access.
// State values: 'yes' (does it), 'partial' (conditional/limited), 'no' (not offered).

export type Cell = { state: 'yes' | 'partial' | 'no'; note?: string };

export interface Dimension {
  label: string;
  ollasync: Cell;
}

// Shared dimensions; each competitor supplies its own cell per row (by index).
export const DIMENSIONS: string[] = [
  'AI meeting notes & action items',
  'Optional end-to-end encrypted meetings',
  `Live translated captions (${LANG_COUNT} languages)`,
  'Spoken translated audio, per listener',
  'No-download browser join',
];

export const OLLASYNC_CELLS: Cell[] = [
  { state: 'yes', note: 'After the meeting' },
  { state: 'yes', note: 'Per-meeting E2EE mode' },
  { state: 'yes', note: 'Per-listener, in the meeting' },
  { state: 'yes', note: 'AI voice for each listener' },
  { state: 'yes', note: 'Guests join with no account' },
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
    metaTitle: 'Zoom Alternative for Online Classes — Ollasync vs Zoom',
    metaDescription:
      'Looking for a Zoom alternative for teaching? Ollasync adds live voice translation, AI class notes and optional end-to-end encryption to browser meetings.',
    eyebrow: 'Ollasync vs Zoom',
    intro: "Ollasync brings live translated captions, spoken translation and AI notes to browser meetings. Use it for team conversations, client calls and live training with participants who choose their own language.",
    fair: "Zoom is a familiar choice for video meetings. When evaluating Ollasync, compare the meeting workflow, language support, host controls and pricing that your team needs.",
    cells: [
      { state: 'yes', note: 'AI Companion' },
      { state: 'yes', note: 'Opt-in; disables some features' },
      { state: 'partial', note: 'Translated captions (add-on)' },
      { state: 'no', note: 'Captions only' },
      { state: 'partial', note: 'App often pushed' },
    ],
    switchReasons: [
      'You want every participant to follow in their own language — captions and spoken audio.',
      'You want AI notes and end-to-end encryption without paying enterprise-tier prices.',
      'You want recordings, transcripts and AI notes alongside your meetings.',
    ],
    faq: [
      { q: 'Is Ollasync a Zoom alternative for online classes?', a: 'Yes. Trainers, tutors and coaches get the same one-click browser meeting — screen share, recording, chat — plus live voice translation so each learner follows in their own language, and class notes written automatically after the session.' },
      { q: 'Is Ollasync a drop-in Zoom replacement?', a: 'For the core experience — one-click, no-download browser meetings with screen share, recording, chat and AI notes — yes. Ollasync adds per-listener live translation and confidential deal rooms that Zoom doesn’t offer.' },
      { q: 'Can students join without a download?', a: 'Yes. Learners join from a link in the browser, with no account and no app; Zoom often pushes its desktop app on join.' },
      { q: 'Does Zoom offer end-to-end encryption?', a: 'Yes — Zoom has an optional E2EE meeting mode you enable per meeting, though it disables some features. Ollasync also offers optional per-meeting E2EE.' },
    ],
  },
  {
    slug: 'microsoft-teams',
    name: 'Microsoft Teams',
    metaTitle: 'Microsoft Teams Alternative for Training — Ollasync vs Teams',
    metaDescription:
      'A Microsoft Teams alternative for live training: browser meetings with live voice translation, AI meeting notes and recordings. Fair comparison.',
    eyebrow: 'Ollasync vs Microsoft Teams',
    intro: "Ollasync offers browser meetings with live translated captions and spoken audio per participant, recordings and AI notes. Teams using Microsoft 365 can evaluate it for multilingual conversations and training.",
    fair: "Microsoft Teams brings meetings into the Microsoft 365 workflow. Consider how your team uses that suite alongside its requirements for meeting translation, browser access and host controls.",
    cells: [
      { state: 'yes', note: 'Copilot' },
      { state: 'partial', note: '1:1 calls only, opt-in' },
      { state: 'partial', note: 'Live-translated captions' },
      { state: 'partial', note: 'Human interpreters (setup)' },
      { state: 'partial', note: 'Desktop app pushed' },
    ],
    switchReasons: [
      'You want spoken translation for every listener, not just captions.',
      'You need confidentiality beyond one-to-one calls, with optional E2EE for group meetings.',
      'You want a focused, lightweight tool rather than a full collaboration suite.',
    ],
    faq: [
      { q: 'Does Microsoft Teams have end-to-end encryption?', a: 'Teams offers opt-in end-to-end encryption for one-to-one calls. Group meetings and chat are encrypted in transit and at rest but not end-to-end encrypted. Ollasync offers optional per-meeting E2EE covering the group.' },
      { q: 'We’re a Microsoft shop — can we still use Ollasync?', a: 'Yes. Ollasync integrates with your identity provider (including Entra ID) via OIDC single sign-on, so you can use it for confidential meetings alongside your existing collaboration tools.' },
    ],
  },
  {
    slug: 'google-meet',
    name: 'Google Meet',
    metaTitle: 'Google Meet Alternative for Tutors — Ollasync vs Meet',
    metaDescription:
      'A Google Meet alternative for tutors and trainers: learners hear your class in their own language and the notes write themselves. Fair comparison.',
    eyebrow: 'Ollasync vs Google Meet',
    intro: "Ollasync offers browser meetings where participants choose translated captions or spoken audio, with recordings, AI notes and optional end-to-end encryption.",
    fair: "Google Meet fits into the Google Workspace workflow. Compare the language options, meeting controls and recording workflow that matter to your participants.",
    cells: [
      { state: 'yes', note: 'Gemini' },
      { state: 'partial', note: 'Client-side enc. on some tiers' },
      { state: 'partial', note: 'Translated captions (some tiers)' },
      { state: 'no', note: 'Captions only' },
      { state: 'yes', note: 'Browser-native' },
    ],
    switchReasons: [
      'You want encryption and live translation without needing a specific enterprise Workspace tier.',
      'You want every learner to hear the class in their own language.',
      'You want meeting recordings and AI notes in one workspace.',
    ],
    faq: [
      { q: 'Is Google Meet end-to-end encrypted?', a: 'Standard Meet calls are encrypted in transit and at rest but not end-to-end encrypted. Google offers optional client-side encryption on certain enterprise Workspace editions. Ollasync offers optional per-meeting E2EE on any plan.' },
      { q: 'Does Ollasync work in the browser like Meet?', a: 'Yes. Ollasync meetings run in any modern browser with no download, and guests can join without an account.' },
    ],
  },
  {
    slug: 'webex',
    name: 'Cisco Webex',
    metaTitle: 'Cisco Webex Alternative for Training — Ollasync vs Webex',
    metaDescription:
      'A modern alternative to Cisco Webex. Compare live translation, end-to-end encryption and browser meetings.',
    eyebrow: 'Ollasync vs Cisco Webex',
    intro: "Ollasync focuses on browser meetings with live translation, captions, recordings and AI notes, plus optional end-to-end encryption for sensitive conversations.",
    fair: "Webex serves teams using Cisco collaboration tools. Evaluate your meeting workflow, participant access and language needs when considering Ollasync.",
    cells: [
      { state: 'yes', note: 'Webex AI Assistant' },
      { state: 'yes', note: 'Opt-in E2EE meetings' },
      { state: 'partial', note: 'Real-time translation (add-on)' },
      { state: 'no', note: 'Captions only' },
      { state: 'partial', note: 'App-oriented' },
    ],
    switchReasons: [
      'You want a modern, browser-native experience without a heavy client or enterprise suite.',
      'You want live translated audio for every attendee.',
      'You want simple per-seat pricing rather than an enterprise negotiation.',
    ],
    faq: [
      { q: 'Does Webex support end-to-end encryption?', a: 'Yes — Webex offers opt-in end-to-end encryption for meetings. Ollasync also offers optional per-meeting E2EE, in a lighter, browser-first product.' },
      { q: 'Is Ollasync simpler than Webex?', a: 'Yes. Ollasync is a focused, browser-first platform — meetings, webinars, recordings and deal rooms — without the surface area of a full enterprise collaboration suite.' },
    ],
  },
  {
    slug: 'bigbluebutton',
    name: 'BigBlueButton',
    metaTitle: 'BigBlueButton Alternative with Live Translation — Ollasync',
    metaDescription:
      'A BigBlueButton alternative for online classes: live voice translation per learner, AI meeting notes and recordings, nothing to host yourself.',
    intro:
      'BigBlueButton is the open-source standard for virtual classrooms — whiteboard, breakout rooms, polls, and deep LMS integrations, run by many schools on their own servers. What it doesn’t do is translate: every learner hears the class in the language it was taught in, notes are whoever wrote them, and recordings management is basic. Ollasync is the AI-classroom take: your voice translated live into each learner’s language, class notes written automatically, and replays kept behind access control.',
    fair:
      'BigBlueButton is free, open source, education-first and integrates tightly with LMS platforms via LTI — for an institution with the ops capacity to run it, a serious offer. The gap opens when your learners span languages, when you want the class notes written for you, or when nobody on staff wants to operate video infrastructure.',
    cells: [
      { state: 'no', note: 'No native AI notes' },
      { state: 'no', note: 'Media not end-to-end encrypted' },
      { state: 'partial', note: 'Auto subtitles; no translation' },
      { state: 'no', note: 'Original audio only' },
      { state: 'yes', note: 'Fully browser-based' },
    ],
    switchReasons: [
      'Your learners don’t all share one language — each should follow the class in their own.',
      'You want the transcript, summary and action items produced automatically after every class.',
      'You want replays access-controlled per cohort without running your own video servers.',
      'You want meeting recordings and live translation in one managed workspace.',
    ],
    faq: [
      { q: 'Is BigBlueButton free?', a: 'The software is open source and free; running it well is not — servers, scaling, recordings storage and upgrades are on you or a hosting partner. Ollasync is a managed per-seat service.' },
      { q: 'Does BigBlueButton translate classes?', a: `No. It offers captioning in the spoken language, but not live translation. Ollasync translates the trainer’s voice into each learner’s chosen language — captions and spoken audio, ${LANG_COUNT} languages.` },
      { q: 'Can Ollasync integrate with an LMS?', a: 'BigBlueButton’s LTI integrations are deeper today. Ollasync classes are joined from a link you can place inside any LMS, and the replay library is access-controlled per cohort.' },
    ],
  },
];
