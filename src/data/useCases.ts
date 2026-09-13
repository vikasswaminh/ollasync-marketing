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
    metaDescription:
      'Private, encrypted telehealth and clinical collaboration — access-controlled, with AI visit notes and NDA-gated case rooms. Video, recordings and documents built for healthcare.',
    eyebrow: 'For healthcare & telehealth',
    title: 'Encrypted video for care teams that handle',
    titleAccent: 'protected health information',
    lead: 'Telehealth visits, multidisciplinary case reviews and referrals — encrypted and access-controlled, with private case rooms and audit logging so protected health information (PHI) stays inside controls you can point to.',
    pains: [
      { title: 'PHI on consumer tools', body: 'Consumer video tools put patient conversations and shared records on infrastructure you don’t control, with no audit trail.' },
      { title: 'Consent & records obligations', body: 'Clinical conversations and shared documents need to stay auditable, access-controlled and retained under your policies — not a vendor’s defaults.' },
      { title: 'Cross-provider collaboration leaks', body: 'Case reviews and referrals across organisations are exactly where sensitive records get forwarded into unmanaged inboxes and chats.' },
    ],
    helps: [
      { icon: 'video', title: 'Encrypted telehealth visits', body: 'Browser-based video with no app install for patients, encrypted in transit — with end-to-end encryption for the most sensitive visits.' },
      { icon: 'file-lock', title: 'Case rooms for records', body: 'Per-case document rooms with role and NDA gating, in-browser viewing and per-viewer watermarks for referrals and MDT reviews.' },
      { icon: 'sparkles', title: 'AI visit notes', body: 'Turn a recorded visit into a transcript and summary. End-to-end encrypted visits are excluded by design.' },
      { icon: 'globe', title: 'Live translation', body: `Patients and clinicians can each follow in their own language — captions and spoken audio in ${LANG_COUNT} languages.` },
    ],
    complianceTitle: 'Where a HIPAA or GDPR programme fits',
    compliance: [
      'We don’t sell you a certificate — we give you the technical controls a HIPAA or GDPR-health programme requires: encryption, access control, audit logging and a DPA.',
      'Access control, audit logging and a DPA give you controls you can point to in a review.',
      'A data-processing agreement covering processing, retention and breach notification is available.',
      'A DPA, role-based access control and an audit trail on every document — see the security page.',
    ],
    scenario: {
      title: 'A multidisciplinary team review, contained',
      body: 'A hospital runs an encrypted case review over Ollasync. Oncology, radiology and an external specialist join; imaging and notes live in a role-gated case room with NDA-gated downloads and per-viewer watermarks. Every access is logged, the data stays in the EU, and a recorded portion is summarised by AI for the file — with the sensitive discussion kept end-to-end encrypted.',
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
    metaTitle: 'Secure video conferencing & deal rooms for law firms',
    metaDescription:
      'Protect privileged client conversations and confidential documents. Encrypted video, end-to-end encryption and NDA-gated deal rooms for law firms.',
    eyebrow: 'For law firms & in-house counsel',
    title: 'Privileged conversations that stay',
    titleAccent: 'privileged',
    lead: 'Client calls, matter collaboration and document exchange — encrypted and access-controlled, so confidentiality isn’t undermined by the tools you use to communicate.',
    pains: [
      { title: 'Privilege on unmanaged tools', body: 'Client discussions on consumer platforms sit on infrastructure a firm can’t control, complicating confidentiality.' },
      { title: 'Document leakage', body: 'Sensitive filings and evidence get forwarded, downloaded and re-shared far beyond the matter team.' },
      { title: 'Cross-party collaboration', body: 'Co-counsel, opposing parties and clients each need scoped access — not a shared drive everyone can rummage through.' },
    ],
    helps: [
      { icon: 'file-lock', title: 'NDA-gated matter rooms', body: 'Per-matter document rooms that require NDA acceptance before download, with role-based folders and audited access.' },
      { icon: 'eye-off', title: 'View-only with watermark', body: 'Show sensitive documents in-browser with a per-viewer watermark and no download — deterrence against casual leakage.' },
      { icon: 'video', title: 'Encrypted client calls', body: 'Browser video for client and deposition-style meetings, with end-to-end encryption for the most sensitive ones.' },
      { icon: 'route', title: 'Audit trail by default', body: 'Every login, invite, NDA acceptance and document access is logged to support your professional-conduct obligations.' },
    ],
    complianceTitle: 'Confidentiality you can defend',
    compliance: [
      'End-to-end encryption means the video and chat of a sensitive matter call are encrypted in the browser — we store only ciphertext and hold no key.',
      'Access control, audit trails and a DPA keep client matter data governed and reviewable.',
      'Cross-organisation deal rooms let co-counsel and clients access a matter from their own workspace with their own scoped role.',
      'Full audit logging of access, NDA acceptance and document activity supports your record-keeping.',
    ],
    scenario: {
      title: 'A cross-border deal, scoped tight',
      body: 'A firm opens a deal room for an acquisition. Buyer counsel, seller counsel and bankers each get a role; the diligence folder is restricted, an NDA gates downloads, and the most sensitive documents are view-only and watermarked. Every access is logged, and the negotiation call is run end-to-end encrypted.',
    },
    faq: [
      { q: 'Does using Ollasync affect attorney-client privilege?', a: 'Ollasync is designed to strengthen confidentiality: sensitive calls can be end-to-end encrypted (we hold no key), documents are access-controlled and NDA-gated, with a DPA in place. Privilege is a legal determination — the tooling is built to support, not undermine, it.' },
      { q: 'Can we give opposing counsel limited access?', a: 'Yes. Deal roles scope exactly what each participant can see, and cross-organisation invites let outside parties access a matter from their own workspace without joining your tenant.' },
      { q: 'Can documents be watermarked and download-blocked?', a: 'Yes. View-only documents render in-browser with a per-viewer watermark and no download action — deterrence against casual leakage (not DRM).' },
    ],
  },
  {
    slug: 'finance',
    icon: 'building',
    label: 'Finance',
    metaTitle: 'Secure video conferencing & deal rooms for finance',
    metaDescription:
      'Confidential advisory calls, board meetings and M&A deal rooms. Encrypted, auditable video conferencing for banks, funds and advisory firms.',
    eyebrow: 'For banking, funds & advisory',
    title: 'For conversations that move',
    titleAccent: 'markets',
    lead: 'Advisory calls, investment committees, board meetings and live deal rooms — encrypted and auditable, so material non-public information stays contained.',
    pains: [
      { title: 'MNPI on consumer tools', body: 'Deal discussions and board materials on consumer platforms expose material non-public information to infrastructure you can’t bound.' },
      { title: 'Record-keeping obligations', body: 'Regulated firms need auditable access and retention control — not a vendor’s opaque defaults.' },
      { title: 'Data rooms that leak', body: 'Traditional data rooms scatter confidential documents across downloads and forwards with weak per-user control.' },
    ],
    helps: [
      { icon: 'file-lock', title: 'Confidential deal rooms', body: 'Per-deal document rooms with role-based access, NDA gating and audited downloads — a virtual data room with live video built in.' },
      { icon: 'video', title: 'Encrypted advisory calls', body: 'Browser video for advisory, IC and board meetings, with end-to-end encryption when a discussion can’t leak.' },
      { icon: 'chart', title: 'Engagement analytics', body: 'See who accessed which documents and when — every invite, NDA acceptance and view is logged for the compliance file.' },
      { icon: 'globe', title: 'Live translation', body: 'Cross-border committees follow in their own languages — captions and spoken audio, per listener.' },
    ],
    complianceTitle: 'Controls your risk team will recognise',
    compliance: [
      'Access control, NDA gating and comprehensive audit logging support record-keeping and information-barrier requirements.',
      'End-to-end encryption keeps the most sensitive deal calls unreadable to us — ciphertext only.',
      'A DPA covers processing and retention, with access control and audit logging on every room.',
      'Encryption, role-based access control, audit logging and a DPA — see the security page for each layer.',
    ],
    scenario: {
      title: 'An investment committee, on the record',
      body: 'A fund runs its IC over encrypted video, with the deal memo and model in a role-gated deal room. Partners see everything; a prospective LP sees only the teaser folder after signing an NDA. Every access is logged for the compliance file, the data stays in the EU, and the sensitive portion runs end-to-end encrypted.',
    },
    faq: [
      { q: 'Can Ollasync serve as a virtual data room?', a: 'Yes. Deal rooms are confidential document rooms with role-based folders, NDA gating, in-browser view-only mode with watermarks, and audited access — with live encrypted video in the same room.' },
      { q: 'Does it support our record-keeping obligations?', a: 'Ollasync logs security-relevant actions (logins, invites, NDA acceptance, document access), and recordings and retention are under your control. We provide controls; your compliance team owns the programme.' },
      { q: 'Where does deal data live?', a: 'In your workspace on our hosted service, access-controlled — with a DPA covering processing and retention.' },
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
    metaDescription:
      `Run cohorts and public classes at scale: webinars with Q&A, polls and quizzes, live voice translation in ${LANG_COUNT} languages, a recordings library per course, and per-seat pricing.`,
    eyebrow: 'For training companies & academies',
    title: 'One curriculum, taught to',
    titleAccent: 'every market at once',
    lead: 'Cohort classes and open enrolment sessions where the trainer teaches once and every market follows live — with the engagement tools of a webinar and the archive of a course library.',
    pains: [
      { title: 'Per-language delivery costs', body: 'Running the same course separately per language multiplies trainer hours and splits your cohorts.' },
      { title: 'Engagement at scale', body: 'Big sessions go quiet: no questions, no checks on understanding, no signal on who is following.' },
      { title: 'Scattered course material', body: 'Replays on one tool, handouts on another, attendance in a spreadsheet.' },
    ],
    helps: [
      { icon: 'globe', title: 'Teach once, deliver everywhere', body: `A single live class each learner follows in their own language — captions or spoken audio, ${LANG_COUNT} languages.` },
      { icon: 'chat', title: 'Webinars built for teaching', body: 'Stage and audience, moderated Q&A, polls and quizzes mid-class, handouts attached to the session.' },
      { icon: 'play', title: 'A replay library per course', body: 'Recordings collect in your workspace, access-controlled per cohort, with transcripts and AI notes attached.' },
      { icon: 'sparkles', title: 'Notes without a scribe', body: 'Every session produces its own summary and action items — consistent course notes with no extra staff time.' },
    ],
    complianceTitle: 'Commercial control',
    compliance: [
      'Per-seat pricing — you pay for trainers and staff, not for every learner who joins a session.',
      'Public browser join for open classes; access-controlled replays for paying cohorts.',
      'Attendance and engagement are visible per session, so completion tracking doesn’t need a spreadsheet.',
      'Your brand in front: learners join your class from your link — no third-party account required.',
    ],
    scenario: {
      title: 'A certification course, four markets, one trainer',
      body: 'An academy runs its flagship certification live from London. Cohorts in Madrid, São Paulo and Delhi join the same session, each following in their own language, answering the same mid-class quizzes. The replay and AI notes land in each cohort’s library the moment class ends.',
    },
    faq: [
      { q: 'How large can a class be?', a: 'Classes run as webinars with a presenting stage and a view-only audience, built for large open sessions — with Q&A and polls keeping it two-way.' },
      { q: 'Do learners pay for seats?', a: 'No — pricing is per trainer/staff seat. Learners join sessions you run without needing a paid seat.' },
      { q: 'Can external tools stream in?', a: 'Yes — a session can take a professional broadcast feed via OBS/RTMPS when you want studio production.' },
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
