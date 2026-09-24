import { LANG_COUNT, LANGS_PER_SESSION, LANG_LIST_SENTENCE } from './languages';
// Vertical landing pages. Content is honesty-bound: no "certified"/"compliant"
// claims — we provide controls + a DPA as the compliance boundary.
// 100% cloud SaaS; no self-host/air-gap. Crypto: optional per-meeting
// E2EE (media + chat, AES-GCM, key in the browser); docs = access-controlled, not E2EE;
// do NOT claim standalone MLS "messaging".
export interface UseCase {
  slug: string;
  icon: string;
  label: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  lead: string;
  pains: { title: string; body: string }[];
  helps: { icon: string; title: string; body: string }[];
  complianceTitle: string;
  compliance: string[];
  scenario: { title: string; body: string };
  faq: { q: string; a: string }[];
}

export const USE_CASES: UseCase[] = [
  {
    slug: 'healthcare',
    icon: 'pulse',
    label: 'Healthcare',
    metaTitle: 'HIPAA & GDPR video conferencing for healthcare',
    metaDescription: "Browser meetings for care teams, with encrypted video, host controls, live translation and optional AI notes from recorded sessions.",
    eyebrow: 'For healthcare & telehealth',
    title: 'Encrypted video for care teams that handle',
    titleAccent: 'protected health information',
    lead: "Bring care teams and invited specialists together in browser meetings, with waiting rooms, host controls and optional end-to-end encryption for sensitive discussions.",
    pains: [
      { title: 'PHI on consumer tools', body: 'Consumer video tools put patient conversations and shared records on infrastructure you don’t control, with no audit trail.' },
      { title: 'Consent & records obligations', body: 'Clinical conversations and shared documents need to stay auditable, access-controlled and retained under your policies — not a vendor’s defaults.' },
      { title: 'Cross-provider collaboration leaks', body: 'Case reviews and referrals across organisations are exactly where sensitive records get forwarded into unmanaged inboxes and chats.' },
    ],
    helps: [
      { icon: 'video', title: 'Encrypted telehealth visits', body: 'Browser-based video with no app install for patients, encrypted in transit — with end-to-end encryption for the most sensitive visits.' },
      {"icon":"shield","title":"Control who joins","body":"Use a waiting room, meeting passcode and room lock to manage access to the conversation."},
      { icon: 'sparkles', title: 'AI visit notes', body: 'Turn a recorded visit into a transcript and summary. End-to-end encrypted visits are excluded by design.' },
      { icon: 'globe', title: 'Live translation', body: `Patients and clinicians can each follow in their own language — captions and spoken audio in ${LANG_COUNT} languages.` },
    ],
    complianceTitle: 'Where a HIPAA or GDPR programme fits',
    compliance: [
      'We don’t sell you a certificate — we give you the technical controls a HIPAA or GDPR-health programme requires: encryption, access control, audit logging and a DPA.',
      'Access control, audit logging and a DPA give you controls you can point to in a review.',
      'A data-processing agreement covering processing, retention and breach notification is available.',
      'A DPA and meeting access controls support your security review ? see the security page.',
    ],
    scenario: {
      title: 'A multidisciplinary team review, contained',
      body: "A care team invites an external specialist to a browser meeting. The host admits the participants, shares the relevant screen and enables end-to-end encryption for the sensitive discussion. Cloud recording, translation and AI notes are unavailable in that encrypted mode.",
    },
    faq: [
      { q: 'Is Ollasync HIPAA compliant?', a: 'Compliance is a property of your deployment. Ollasync provides the encryption, access control, audit logging and DPA a HIPAA programme needs. We do not currently hold a formal certification and we say so plainly.' },
      { q: 'Can patients join without installing anything?', a: 'Yes. Patients join encrypted telehealth visits from any modern browser — no download, no account required for invited guests.' },
      { q: 'Where is patient data stored?', a: 'In your workspace on our hosted service, access-controlled and reachable only through short-lived signed links — never a public bucket.' },
    ],
  },
  {
    slug: 'legal',
    icon: 'scale',
    label: 'Legal',
    metaTitle: "Secure video meetings for law firms",
    metaDescription: "Hold confidential client calls and legal team meetings with browser video, host controls and optional end-to-end encryption.",
    eyebrow: 'For law firms & in-house counsel',
    title: 'Privileged conversations that stay',
    titleAccent: 'privileged',
    lead: "Client calls, matter discussions and negotiations in browser meetings, with host controls and optional end-to-end encryption for sensitive conversations.",
    pains: [
      { title: 'Privilege on unmanaged tools', body: 'Client discussions on consumer platforms sit on infrastructure a firm can’t control, complicating confidentiality.' },
      {"title":"Uninvited participants","body":"Sensitive conversations need clear control over who can join and when the room is locked."},
      {"title":"Cross-party coordination","body":"Co-counsel, clients and outside specialists need a simple way to join a scheduled discussion."},
    ],
    helps: [
      {"icon":"shield","title":"Meeting access controls","body":"Admit guests from a waiting room, require a passcode and lock the meeting once everyone has joined."},
      {"icon":"layers","title":"Screen sharing","body":"Walk through a document on your screen during the call, keeping the discussion in one meeting."},
      { icon: 'video', title: 'Encrypted client calls', body: 'Browser video for client and deposition-style meetings, with end-to-end encryption for the most sensitive ones.' },
      {"icon":"users","title":"Host and co-host controls","body":"Manage participants, mute the room and remove guests when needed."},
    ],
    complianceTitle: 'Confidentiality you can defend',
    compliance: [
      'End-to-end encryption means the video and chat of a sensitive matter call are encrypted in the browser — we store only ciphertext and hold no key.',
      'Access control, audit trails and a DPA keep client matter data governed and reviewable.',
      'Outside participants join an invited meeting from their browser, with admission controlled by the host.',
      'Meeting recordings, when enabled, are restricted to authorised viewers in your workspace.',
    ],
    scenario: {
      title: 'A cross-border deal, scoped tight',
      body: "A firm schedules a negotiation with its client and outside counsel. The host admits invited participants, locks the meeting and enables end-to-end encryption for the discussion. Participants review the relevant material through screen sharing.",
    },
    faq: [
      {"q":"How can we protect a confidential client call?","a":"Enable optional end-to-end encryption for video, chat and screen sharing, and manage admission with waiting rooms, passcodes and the room lock. See the security page for the encryption model."},
      {"q":"Can outside counsel join a meeting?","a":"Yes. Invited guests can join from a browser without an account. The host controls admission and can remove participants."},
      {"q":"Can we review material together?","a":"Yes. Share a screen, window or browser tab during the meeting and use the whiteboard to support the discussion."},
    ],
  },
  {
    slug: 'finance',
    icon: 'building',
    label: 'Finance',
    metaTitle: "Secure video meetings for finance",
    metaDescription: "Confidential advisory calls, investment committee discussions and board meetings with browser video, host controls and optional end-to-end encryption.",
    eyebrow: 'For banking, funds & advisory',
    title: 'For conversations that move',
    titleAccent: 'markets',
    lead: "Run advisory calls, investment committee discussions and board meetings with encrypted video, meeting access controls and optional end-to-end encryption.",
    pains: [
      { title: 'MNPI on consumer tools', body: 'Deal discussions and board materials on consumer platforms expose material non-public information to infrastructure you can’t bound.' },
      { title: 'Record-keeping obligations', body: 'Regulated firms need auditable access and retention control — not a vendor’s opaque defaults.' },
      {"title":"Sensitive meeting access","body":"Board and advisory discussions need clear control over which participants join."},
    ],
    helps: [
      {"icon":"shield","title":"Meeting access controls","body":"Use waiting rooms, passcodes and a room lock to control who joins each discussion."},
      { icon: 'video', title: 'Encrypted advisory calls', body: 'Browser video for advisory, IC and board meetings, with end-to-end encryption when a discussion can’t leak.' },
      {"icon":"play","title":"Meeting recordings and notes","body":"Record eligible meetings for an access-controlled replay, transcript and AI summary. End-to-end encrypted meetings are excluded."},
      { icon: 'globe', title: 'Live translation', body: 'Cross-border committees follow in their own languages — captions and spoken audio, per listener.' },
    ],
    complianceTitle: 'Controls your risk team will recognise',
    compliance: [
      'Meeting access controls and recording retention settings support your internal review process.',
      'End-to-end encryption keeps the most sensitive deal calls unreadable to us — ciphertext only.',
      'A DPA covers processing and retention, with access control and audit logging on every room.',
      'Encryption, role-based access control, audit logging and a DPA — see the security page for each layer.',
    ],
    scenario: {
      title: 'An investment committee, on the record',
      body: "A fund runs its investment committee over browser video. The host admits invited members and shares the presentation on screen. Routine sessions can be recorded for a transcript and AI notes; sensitive discussions use end-to-end encryption with cloud recording and AI disabled.",
    },
    faq: [
      {"q":"Can we hold confidential board meetings?","a":"Yes. Use host-controlled admission and optional end-to-end encryption for the meeting. The security page explains which capabilities are available in each mode."},
      {"q":"Can we keep a meeting record?","a":"Eligible meetings can be recorded to your workspace with controlled playback access and retention. Cloud recording is unavailable in end-to-end encrypted meetings."},
      {"q":"Where are meeting recordings stored?","a":"In private storage on the hosted service, restricted to authorised viewers. The DPA describes processing and retention."},
    ],
  },
  {
    slug: 'government',
    icon: 'landmark',
    label: 'Government',
    metaTitle: 'Secure video conferencing for the public sector',
    metaDescription:
      'Encrypted video conferencing for the public sector. Keep citizen and official data access-controlled and auditable — with SSO to your own directory.',
    eyebrow: 'For public sector',
    title: 'Secure communications for',
    titleAccent: 'foreign legal reach',
    lead: 'Encrypted meetings, recordings and document rooms — access-controlled and auditable, so citizen data and sensitive deliberations stay governed and contained the reach of foreign statutes.',
    pains: [
      { title: 'Consumer tools, official data', body: 'Citizen conversations and briefing documents on consumer platforms sit outside your governance and audit reach.' },
      { title: 'Records & audit obligations', body: 'Official deliberations need retention, access control and an audit trail your policies can stand behind.' },
      { title: 'Identity fragmentation', body: 'Agencies need meetings tied to their own directory, not a separate third-party identity silo.' },
    ],
    helps: [
      { icon: 'globe', title: 'Live translation', body: 'Multilingual briefings and public sessions — every participant follows in their own language.' },
      { icon: 'shield', title: 'Access-controlled rooms', body: 'Role-gated rooms with audit logging — who joined, who saw what, and when.' },
      { icon: 'fingerprint', title: 'Your identity provider', body: 'OIDC single sign-on into the agency’s own directory (Entra ID, Keycloak and more) — meetings tied to your identities.' },
      { icon: 'route', title: 'Audit & access control', body: 'Waiting rooms, role scoping, and a full audit trail of who joined, accessed and downloaded what.' },
    ],
    complianceTitle: 'Governed by design',
    compliance: [
      'A DPA plus role-based access control and audit logging keep citizen data governed.',
      'Encryption in transit everywhere, with optional end-to-end encrypted meetings for the most sensitive sessions.',
      'End-to-end encryption keeps sensitive deliberations unreadable to any operator, including us.',
      'OIDC single sign-on ties access to the agency’s own directory, with full audit logging.',
    ],
    scenario: {
      title: 'An inter-agency briefing, kept contained',
      body: 'A ministry runs an encrypted inter-agency briefing on Ollasync. Officials sign in through the agency’s own directory; the briefing documents live in a role-gated room with audited access; the data stays in the EU under EU law, and the sensitive discussion is end-to-end encrypted so no operator can read it.',
    },
    faq: [
      { q: 'Where is our data hosted?', a: 'In your workspace on our hosted service, access-controlled, with a DPA covering processing and retention. Storage is private and reachable only through short-lived signed links, so there is no public bucket in the path.' },
      { q: 'Can our most sensitive sessions be end-to-end encrypted?', a: 'Yes — meetings can be end-to-end encrypted per meeting, with the key held in participants’ browsers and never by us. Your legal team owns the final determination; the hosting and operation are built to keep data in the EU.' },
      { q: 'Can we use our own identity system?', a: 'Yes. Ollasync integrates with your OIDC identity provider for single sign-on into your existing directory, with no dependency on a third-party identity SaaS.' },
    ],
  },
  {
    slug: 'tutors',
    icon: 'globe',
    label: 'Tutors & coaches',
    metaTitle: 'Online Tutoring with Live Voice Translation',
    metaDescription:
      'Teach students anywhere: live classes where each learner hears your voice in their own language, AI class notes after every session, and recordings only your students can open.',
    eyebrow: 'For tutors & coaches',
    title: 'Teach students who don’t share',
    titleAccent: 'your language',
    lead: 'One-to-one lessons and small groups in the browser — your voice translated live into each learner’s language, notes written for you, and replays kept behind access control.',
    pains: [
      { title: 'The language ceiling', body: 'Your teaching is only sellable to people who already speak your language — the biggest cap on a tutoring practice.' },
      { title: 'Teaching while note-taking', body: 'Writing the recap during the lesson splits your attention; skipping it costs your students the follow-up.' },
      { title: 'Replay requests', body: 'Missed lessons mean re-teaching, or sharing recordings over links anyone can forward.' },
    ],
    helps: [
      { icon: 'globe', title: 'Live translated lessons', body: `You speak once; each learner follows in their own language — captions and spoken audio across ${LANG_COUNT} languages.` },
      { icon: 'sparkles', title: 'AI class notes', body: 'Every session ends with a transcript, a summary and the action items — written while you teach.' },
      { icon: 'video', title: 'Nothing to install', body: 'Students join from a link in the browser, on any device. No app, no account gymnastics before a first lesson.' },
      { icon: 'play', title: 'Replays with control', body: 'Recordings live in your workspace and open only for the students you allow — not on a public link.' },
    ],
    complianceTitle: 'Recordings, consent & control',
    compliance: [
      'Recording is explicit and visible to everyone in the class — no silent capture.',
      'Replays are access-controlled in your workspace; students see only what you share with them.',
      'Translation is machine translation of your live voice — excellent for following a lesson, not a substitute for certified interpretation.',
      'You choose retention: keep a course archive or clear recordings when a cohort ends.',
    ],
    scenario: {
      title: 'One tutor, three languages, one lesson',
      body: 'An English-speaking maths tutor runs a small-group lesson. One student listens in Hindi, another follows Spanish captions, a third stays with the original audio. After class, everyone gets the same AI summary and the replay is shared with just that group.',
    },
    faq: [
      { q: 'How many languages can one class run in?', a: `Learners can follow in any of the ${LANG_COUNT} supported languages — ${LANG_LIST_SENTENCE} — each choosing their own; one class can run up to ${LANGS_PER_SESSION} different languages at once.` },
      { q: 'Do my students need to install anything?', a: 'No. Students join from a link in the browser on desktop or mobile. You teach from the browser too.' },
      { q: 'Is the translation instant?', a: 'It runs live, a beat behind your voice — like listening through an interpreter. Captions appear as you speak and refine as the sentence completes.' },
      { q: 'Can I sell recordings of my lessons?', a: 'Recordings stay in your workspace under access control, so you decide who can watch — a paid cohort, a single student, or nobody.' },
    ],
  },
  {
    slug: 'trainers',
    icon: 'video',
    label: 'Professional trainers',
    metaTitle: 'Virtual Classroom for Professional Trainers',
    metaDescription:
      `Run paid training live from the browser: your voice translated into ${LANG_COUNT} languages, attendance for every session, optional AI notes for recorded classes.`,
    eyebrow: 'For professional trainers',
    title: 'Deliver your programme to every client,',
    titleAccent: 'in their language',
    lead: 'Independent and in-house trainers running paid cohorts and client sessions — one live class each learner follows in their own language, with the attendance list, the notes and the replay handled after class.',
    pains: [
      { title: 'Clients in three countries, one trainer', body: 'A programme sold to a client abroad means teaching in a second language or paying an interpreter for every session.' },
      { title: 'The admin after every class', body: 'The attendance list, the recap email, the recording link — follow-up for every hour taught, and it comes out of your margin.' },
      { title: 'Every client has a different tool', body: 'One client on a suite, another on a consumer app: different links, different limits, and learners who cannot get in on day one.' },
    ],
    helps: [
      { icon: 'globe', title: 'Teach once, in every language', body: `Learners choose captions or spoken audio in any of ${LANG_COUNT} languages — up to ${LANGS_PER_SESSION} different languages in one live class.` },
      { icon: 'doc', title: 'Attendance for every session', body: 'Who joined each session is kept with the session, and a wrap-up email reaches you when class ends — both are switches in your workspace settings.' },
      { icon: 'sparkles', title: 'Notes sent to everyone', body: 'A recorded class can transcribe and summarise itself; you send the notes to the whole invite list from the recording, in one step.' },
      { icon: 'video', title: 'A link that works on day one', body: 'Learners join from the browser on any device — no install, no account — and the invitation carries a message of your own.' },
    ],
    complianceTitle: 'Commercial control',
    compliance: [
      'Per-seat pricing: you pay for trainer seats, not for every learner who joins.',
      'Recordings and notes stay in your workspace under access control; you decide which cohort or client can open them.',
      'AI notes are opt-in per workspace and never run on end-to-end encrypted sessions.',
      'Translation is machine translation of your live voice — right for following a lesson, not a substitute for certified interpretation.',
    ],
    scenario: {
      title: 'A routing and switching class, three languages, one trainer',
      body: 'A networking trainer teaches a live class in English. One cohort follows in Hindi, one in Tamil, a client team in Spanish; IP addresses and port numbers come through as spoken, and the usual networking terms stay in English. When class ends the trainer has the attendance list in the inbox and sends the AI notes to everyone on the invite list.',
    },
    faq: [
      { q: 'Do learners need an account or an app?', a: 'No. They open your link in a browser on desktop or mobile, and the invitation can carry your own message.' },
      { q: 'Can I see who attended a past session?', a: 'Yes. Every past session keeps its attendance, and a wrap-up email can reach you when a class ends. Both are switches in your workspace settings.' },
      { q: 'How do notes reach my learners?', a: 'A recorded class can be transcribed and summarised automatically; from the recording you send the notes to the invite list, or to addresses you type.' },
      { q: 'Does it work for technical subjects?', a: `Numbers, IP addresses and port numbers come through as spoken in every one of the ${LANG_COUNT} languages. Acronyms and product names written in Latin script are normally kept as they are, and a built-in technical vocabulary keeps common networking, software and cloud phrases in English instead of translating them in meaning.` },
    ],
  },
  {
    slug: 'academies',
    icon: 'chat',
    label: 'Training companies & academies',
    metaTitle: 'Multilingual Training Platform for Academies',
    metaDescription: "Run live training in browser meetings with translation, screen sharing, breakout rooms, polls, meeting recordings and AI notes.",
    eyebrow: 'For training companies & academies',
    title: 'One curriculum, taught to',
    titleAccent: 'every market at once',
    lead: "Teach cohorts through interactive browser meetings where each learner chooses their language, joins the discussion and reviews recordings and notes after the session.",
    pains: [
      { title: 'Per-language delivery costs', body: 'Running the same course separately per language multiplies trainer hours and splits your cohorts.' },
      { title: 'Engagement at scale', body: 'Big sessions go quiet: no questions, no checks on understanding, no signal on who is following.' },
      {"title":"Missed meeting context","body":"Learners need a useful recap of the lesson and a way to review the recorded session."},
    ],
    helps: [
      { icon: 'globe', title: 'Teach once, deliver everywhere', body: `A single live class each learner follows in their own language — captions or spoken audio, ${LANG_COUNT} languages.` },
      {"icon":"chat","title":"Interactive training meetings","body":"Use screen sharing, whiteboards, breakout rooms, chat and polls to keep learners involved."},
      {"icon":"play","title":"Meeting recordings","body":"Record sessions to your workspace with access-controlled playback, transcripts and AI notes."},
      { icon: 'sparkles', title: 'Notes without a scribe', body: 'Every session produces its own summary and action items — consistent course notes with no extra staff time.' },
    ],
    complianceTitle: 'Commercial control',
    compliance: [
      'Per-seat pricing — you pay for trainers and staff, not for every learner who joins a session.',
      'Learners join meetings from a browser link; hosts control admission and recording access.',
      'Attendance and engagement are visible per session, so completion tracking doesn’t need a spreadsheet.',
      'Your brand in front: learners join your class from your link — no third-party account required.',
    ],
    scenario: {
      title: 'A certification course, four markets, one trainer',
      body: "An academy teaches a cohort in London, Madrid and Delhi through one browser meeting. Learners select their language, ask questions in chat and work together in breakout rooms. The host records the session for a replay and generates AI notes afterwards.",
    },
    faq: [
      {"q":"How large can a class be?","a":"Classes use meeting participant limits, which vary by plan. See the pricing page for current limits."},
      { q: 'Do learners pay for seats?', a: 'No — pricing is per trainer/staff seat. Learners join sessions you run without needing a paid seat.' },
      {"q":"Can trainers present during a meeting?","a":"Yes. Share a screen, window or browser tab, use the whiteboard and open breakout rooms for group work."},
      { q: 'Can we brand the experience?', a: 'Learners join from your links and see your class, not a third-party portal. Talk to us about deeper branding needs.' },
    ],
  },
  {
    slug: 'onboarding',
    icon: 'users',
    label: 'Corporate onboarding',
    metaTitle: 'Train Global Teams in Their Own Language',
    metaDescription:
      'Onboarding and internal training where every hire follows live in their own language — with AI summaries as the record, access-controlled replays, and optional end-to-end encryption for sensitive sessions.',
    eyebrow: 'For HR & L&D teams',
    title: 'Onboard every region with',
    titleAccent: 'one live session',
    lead: 'Company-wide onboarding and internal training delivered once, understood everywhere — each hire listening in their own language, with the summary and replay filed automatically.',
    pains: [
      { title: 'English-only onboarding', body: 'New hires nod along in their second language and miss the details that matter — policies, tools, expectations.' },
      { title: 'No record of what was taught', body: 'When onboarding is a call with no notes, proving who was trained on what becomes guesswork.' },
      { title: 'Sensitive internal content', body: 'Compensation, security and compliance training shouldn’t end up as freely forwarded recordings.' },
    ],
    helps: [
      { icon: 'globe', title: 'Every hire, their language', body: `One live session; each participant picks captions or spoken audio in any of the ${LANG_COUNT} languages.` },
      { icon: 'sparkles', title: 'The training record writes itself', body: 'Transcript, summary and action items per session — a consistent paper trail for L&D.' },
      { icon: 'play', title: 'Replays that stay internal', body: 'Recordings are access-controlled in your workspace; leavers lose access with their account.' },
      { icon: 'file-lock', title: 'E2EE when it matters', body: 'Sensitive sessions can run end-to-end encrypted — video, chat and screen share readable only by participants.' },
    ],
    complianceTitle: 'Control your programme can point to',
    compliance: [
      'Role-based access on sessions and replays — onboarding content stays inside the company.',
      'Session summaries and transcripts give L&D a consistent record of what each cohort was taught.',
      'Optional end-to-end encryption for the sessions that need it; encrypted transit on every call.',
      'A data-processing agreement is available for your privacy review.',
    ],
    scenario: {
      title: 'Day-one onboarding across five offices',
      body: 'A company onboards its monthly intake in one live session from HQ. Hires in five countries follow in their own languages, ask questions in Q&A, and finish with the same understanding. The AI summary and the replay are filed to the cohort automatically.',
    },
    faq: [
      { q: 'Can hires join without accounts?', a: 'Sessions are joined from a link in the browser. Internal replays are access-controlled, so viewing them requires being in your workspace.' },
      { q: 'Which languages are supported?', a: `Live translation covers ${LANG_COUNT} languages: ${LANG_LIST_SENTENCE}. Up to ${LANGS_PER_SESSION} different languages can run at once in one session.` },
      { q: 'What about very sensitive training?', a: 'Run it end-to-end encrypted. E2EE sessions are excluded from AI processing by design, so nothing sensitive is transcribed.' },
      { q: 'Does this replace our LMS?', a: 'No — it is the live layer. Many teams run the live sessions here and keep completion tracking in their existing LMS.' },
    ],
  },
];
