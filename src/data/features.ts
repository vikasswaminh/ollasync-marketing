import { LANG_COUNT, LANGS_PER_SESSION, LANG_LIST_SENTENCE } from './languages';
// Product feature pages. Claims are whitepaper-accurate (100% cloud SaaS):
//  - meeting media = encrypted in transit (DTLS-SRTP); OPT-IN per-meeting end-to-end encryption (NOT default)
//  - in-meeting chat/DMs = server-blind ONLY inside an E2EE meeting; otherwise transit-encrypted + server-side
//  - recordings = access-controlled, in your workspace; AI = opt-in, post-meeting, never on E2EE meetings
//  - do NOT claim standalone MLS "team messaging" (not shipped), SOC2/ISO, or self-host.

export interface Feature {
  slug: string;
  icon: string;
  label: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  lead: string;
  capabilities: { icon: string; title: string; body: string }[];
  securityNote: string;
  faq: { q: string; a: string }[];
  /** "How it works" — a real sequence, rendered numbered. */
  steps?: { title: string; body: string }[];
  /** Deeper, alternating sections under the capability grid (the "truly detailed" part of a feature page). */
  sections?: { eyebrow: string; title: string; body: string; bullets?: string[] }[];
  /** Cross-links rendered as "Works with" (feature slugs, 'use-cases/<slug>', or '/languages'). */
  related?: string[];
}

export const FEATURES: Feature[] = [
  {
    slug: 'live-translation',
    icon: 'globe',
    label: 'Live translation',
    metaTitle: 'Live Voice Translation for Online Classes',
    metaDescription: `The trainer speaks once; every learner follows in their own language as live captions or spoken audio. ${LANG_COUNT} languages, technical terms kept in English.`,
    eyebrow: 'Live translation',
    title: 'You speak once.',
    titleAccent: 'Every learner hears their own language.',
    lead: `Real-time voice translation built for teaching: each participant picks a language and reads captions or also hears it spoken, independently, while you teach exactly as you do today. ${LANG_COUNT} languages, including ten Indian languages.`,
    steps: [
      { title: 'You teach in your language', body: 'Speak normally into a decent microphone. Nothing to configure per learner, no language pairs to set up.' },
      { title: 'Each learner picks their language', body: 'From the Captions menu, a learner chooses any of the shipped languages — translated captions, with spoken audio as an extra toggle.' },
      { title: 'They follow a beat behind you', body: 'Captions appear as you speak and refine as the sentence completes; spoken audio arrives a moment later, like listening through an interpreter.' },
    ],
    capabilities: [
      { icon: 'globe', title: `${LANG_COUNT} languages`, body: `${LANG_LIST_SENTENCE}. Learners choose per person — captions always, spoken audio as an extra toggle; one session runs up to ${LANGS_PER_SESSION} different languages at the same time.` },
      { icon: 'mic', title: 'Spoken translated audio', body: 'A natural voice reads the translation in the learner’s language, so they can watch the whiteboard instead of reading subtitles.' },
      { icon: 'doc', title: 'Live captions', body: 'Translated captions in the learner’s script, or same-language captions of the original for accessibility.' },
      { icon: 'network', title: 'Technical terms stay in English', body: 'Common protocol, tool and product names from networking, software, cloud and AI are kept in English inside the translation — the way real classrooms speak.' },
      { icon: 'zap', title: 'Numbers the way trainers say them', body: 'Ports, addresses, versions and figures are spoken in English inside the translated voice for Indian languages, the way an Indian classroom hears them.' },
      { icon: 'users', title: 'Translation in every meeting', body: 'The same translation runs in a live class, a meeting or a webinar broadcast — attendees pick their language from the same menu.' },
    ],
    sections: [
      { eyebrow: 'For India-first classrooms', title: 'Teach in English. Be heard in Kannada, Tamil or Hindi.',
        body: 'Most Indian technical training happens in English with learners who think in their mother tongue. Ten Indian languages are shipped — Hindi, Kannada, Tamil, Telugu, Marathi, Bengali, Gujarati, Malayalam, Punjabi and Urdu — with voices chosen for a natural Indian-English accent, so a network or software class lands the way it is taught in a real room.',
        bullets: ['Learners switch language mid-session without interrupting you', 'Same class, one delivery, every cohort follows', 'Captions to read, spoken audio on top for listening — each learner decides'] },
      { eyebrow: 'Honest about the edges', title: 'Machine translation of live speech — great for lessons, not certified interpretation.',
        body: 'Translation follows a beat behind the speaker. Recognition quality follows microphone quality: a headset in a quiet room translates far better than a laptop mic in a café. For legal or medical settings where a certified interpreter is required, use one — we say that plainly rather than let you discover it in the wrong meeting.',
        bullets: [`Up to ${LANGS_PER_SESSION} distinct languages per live session`, 'End-to-end encrypted meetings have no server-readable audio, so translation is not available in them', 'Translation is included on paid plans — see pricing'] },
    ],
    related: ['live-captions', 'ai', '/languages', 'use-cases/tutors', 'use-cases/academies'],
    securityNote: 'Translation runs on the meeting’s live audio on our hosted service and is not stored as audio; captions are delivered live to the learners who asked for them. An end-to-end encrypted meeting has no server-readable audio, so translation is not available inside it — hosts choose per meeting.',
    faq: [
      { q: 'Which languages are supported?', a: `${LANG_COUNT}: ${LANG_LIST_SENTENCE}. Every one of them is available as captions and as spoken audio.` },
      { q: 'How many languages can one class run at once?', a: `Up to ${LANGS_PER_SESSION} different languages in one live session, each learner choosing their own.` },
      { q: 'Is it instant?', a: 'It runs live, a beat behind your voice. Captions appear as you speak and refine as the sentence completes; spoken audio follows a moment later.' },
      { q: 'What about technical vocabulary?', a: 'Common technical terms — protocol, tool and product names from networking, software, cloud and AI — are kept in English inside the translation instead of being turned into textbook words.' },
    ],
  },
  {
    slug: 'live-captions',
    icon: 'doc',
    label: 'Live captions',
    metaTitle: 'Live Captions for Online Classes',
    metaDescription: 'Real-time captions for every participant: read along in the language spoken, or in your own. Per-person choice, no download, works in meetings.',
    eyebrow: 'Live captions',
    title: 'Every word on screen,',
    titleAccent: 'in the language each learner reads',
    lead: 'Live captions run continuously while the trainer teaches. A learner can read the original language for accessibility or switch to translated captions — each person, independently, from the same menu.',
    steps: [
      { title: 'Turn captions on', body: 'One click in the Captions menu. Captions render as the trainer speaks and refine as each sentence completes.' },
      { title: 'Pick the language you read', body: 'Same-language captions of the original, or translated captions in any shipped language.' },
      { title: 'Keep the speaker in view', body: 'Captions sit over the stage with the speaker’s name, so a class with several presenters stays easy to follow.' },
    ],
    capabilities: [
      { icon: 'doc', title: 'Same-language captions', body: 'Read exactly what is being said — the accessibility baseline for every participant, in every meeting.' },
      { icon: 'globe', title: 'Translated captions', body: `Captions in any of the ${LANG_COUNT} shipped languages, with common technical terms kept in English.` },
      { icon: 'users', title: 'Speaker attribution', body: 'Each caption line carries the name of the person speaking, so multi-presenter sessions read like a transcript.' },
      { icon: 'zap', title: 'Low-latency lines', body: 'Interim captions appear immediately and settle as the sentence completes — the way live captioning should feel.' },
      { icon: 'toggle', title: 'Per-person choice', body: 'Captions are a personal meeting setting: each participant turns them on and chooses their own language.' },
      { icon: 'shield', title: 'Respects encryption', body: 'End-to-end encrypted meetings have no server-readable audio, so captions are not available inside them — by design.' },
    ],
    sections: [
      { eyebrow: 'Accessibility first', title: 'Captions are the baseline, translation is the upgrade.',
        body: 'Same-language captions help learners with hearing loss, noisy rooms, second-language listeners and anyone who retains more by reading. Translated captions build on the same stream, so turning on translation never removes the accessibility baseline for the rest of the class.' },
    ],
    related: ['live-translation', 'video-meetings', '/languages'],
    securityNote: 'Captions are generated from the live audio on our hosted service and delivered to the participants who asked for them; they are not stored as audio. End-to-end encrypted meetings exclude captions because the server cannot read their audio.',
    faq: [
      { q: 'Are captions on for everyone once the host enables them?', a: 'In a meeting, captions are a per-person choice: each participant turns them on and picks the language they read.' },
      { q: 'Can I get a transcript afterwards?', a: 'Recorded sessions can be transcribed and summarised from the recording; live captions themselves are for the live session.' },
    ],
  },
  {
    slug: 'local-recording',
    icon: 'play',
    label: 'Local recording',
    metaTitle: 'Record a Class on Your Own Device',
    metaDescription: 'Any participant can record the class locally in the browser, in the audio language they chose. The file stays on their device; nothing is uploaded.',
    eyebrow: 'Local recording',
    title: 'Record on your own device,',
    titleAccent: 'in the language you chose',
    lead: 'A learner following a class in Hindi can keep a recording in Hindi. Local recording captures the presenter or shared screen you are watching plus the audio you selected — original or your translation — encodes it in your browser and saves it to your downloads. Nothing leaves your device.',
    steps: [
      { title: 'Choose what you hear', body: 'Original audio, or spoken translation in your language. The recording follows that choice and keeps it fixed while recording.' },
      { title: 'Start from Settings', body: '“Record locally (this device)” starts the recorder; a LOCAL REC indicator stays visible the whole time.' },
      { title: 'Stop and keep the file', body: 'Stop, or leave the room, and the browser saves a standard video file to your downloads.' },
    ],
    capabilities: [
      { icon: 'play', title: 'On-device encoding', body: 'Your browser does the encoding with your own CPU and memory; the platform runs nothing for it.' },
      { icon: 'globe', title: 'Your audio language', body: 'Records exactly the audio you selected — original, or the single translated voice you chose — never every language in the room.' },
      { icon: 'video', title: 'The presenter you are watching', body: 'The main tile on your screen — another participant’s camera or shared screen at the moment you press record (your own tile is not recorded).' },
      { icon: 'lock', title: 'Nothing uploaded', body: 'No upload, no cloud copy, no server recording job. The host’s cloud recording, if any, is completely separate.' },
      { icon: 'eye-off', title: 'AI voices excluded', body: 'Assistant voices and other languages never enter the file, only the audio you chose to hear.' },
      { icon: 'toggle', title: 'Clear state, clean stop', body: 'A visible LOCAL REC indicator, one file per recording, and language switching paused while it runs.' },
    ],
    sections: [
      { eyebrow: 'Why local', title: 'Twenty learners, each with their own file, zero server load.',
        body: 'Cloud recording produces one file for the room in the room’s audio. Local recording gives each learner a personal file in the language they chose — across the up-to-five languages a session runs at once — without the platform encoding a stream per learner. The compute is theirs, the file is theirs.',
        bullets: ['Standard WebM (Chromium, Firefox) or MP4 (Safari) files', 'Files play in any modern player; a long recording lives in the browser’s memory until saved', 'A closed tab loses an unsaved recording — stop first'] },
    ],
    related: ['recordings', 'live-translation', 'use-cases/tutors', 'use-cases/onboarding'],
    securityNote: 'Local recording only captures media your browser already receives as a participant. It never contacts our servers, and it does not change whether a host records the session to the cloud.',
    faq: [
      { q: 'Does local recording upload anything?', a: 'No. The recording is encoded in your browser and saved to your device. There is no upload and no server-side recording job.' },
      { q: 'Which audio is in the file?', a: 'Exactly what you selected to hear when you pressed record: the original speakers, or the one translated voice you chose. Other languages and assistant voices are never included.' },
      { q: 'What format do I get?', a: 'A standard browser recording: WebM in Chromium and Firefox, MP4 in Safari. It plays in any modern player.' },
    ],
  },
  {
    slug: 'video-meetings',
    icon: 'video',
    label: 'Video meetings',
    metaTitle: 'Video Meetings in the Browser, No Download',
    metaDescription:
      'One-click HD video meetings with screen sharing, whiteboard, breakout rooms, background blur and full host controls. No install; end-to-end encryption optional.',
    eyebrow: 'Video meetings',
    steps: [
      { title: 'Create or schedule', body: 'A personal room, an instant meeting or a scheduled class with an invite link and calendar file.' },
      { title: 'Everyone joins from a link', body: 'Guests join in the browser with no account; the waiting room, passcode and lock stay in your hands.' },
      { title: 'Teach with the tools in the room', body: 'Screen share, whiteboard, breakouts, polls, chat, reactions — and live translation for every learner.' },
    ],
    related: ['live-translation', 'live-captions', 'recordings', 'use-cases/tutors'],
    title: 'HD video meetings,',
    titleAccent: 'straight from the browser',
    lead: 'One-click, no-download meetings with sharp HD video, studio-grade audio and everything a real meeting needs — screen share, whiteboard, breakouts, chat and full host controls. Encrypted in transit, with end-to-end encryption per meeting.',
    capabilities: [
      { icon: 'video', title: 'HD video up to 1440p', body: 'Crisp, adaptive video with resolution presets and a low-data mode, so faces stay sharp without hammering the network.' },
      { icon: 'mic', title: 'Studio audio + AI noise removal', body: 'Full-band 48 kHz audio with AI noise suppression that keeps keyboards, traffic and background chatter out of the room.' },
      { icon: 'layers', title: 'Screen share & annotate', body: 'Share a screen, window or tab with system audio, and draw on top of it with the shared whiteboard.' },
      { icon: 'users', title: 'Breakout rooms', body: 'Split into up to ten breakout rooms with per-person or round-robin assignment, then pull everyone back.' },
      { icon: 'chat', title: 'Chat, DMs, polls & reactions', body: 'In-meeting chat, 1:1 private messages, live polls, emoji reactions, raise-hand and spotlight.' },
      { icon: 'image', title: 'Background blur & backgrounds', body: 'Blur your background or drop in a virtual scene — including your own uploaded image.' },
      { icon: 'shield', title: 'Full host controls', body: 'Waiting room, lock, password, mute-all, mute-on-entry, co-hosts, remove and ban — you run the room.' },
      { icon: 'route', title: 'Personal room & short links', body: 'A stable personal meeting room plus clean, Zoom-style short join links — guests join from a browser, no account.' },
    ],
    securityNote:
      'Meeting media is encrypted in transit on every call, with end-to-end encryption available for video, chat and screen share — encrypted in the browser under a key held by the participants. The security page sets out each layer.',
    faq: [
      { q: 'Do participants need to install anything?', a: 'No. Meetings run in any modern browser with no download. Invited guests can join from a link without an account, gated by your waiting room.' },
      { q: 'Are meetings end-to-end encrypted?', a: 'Meeting media is always encrypted in transit, and end-to-end encryption covers video, chat and screen share — encrypted in the browser under a key held by the participants. See the security page for each layer.' },
      { q: 'How many people can join?', a: 'Participant, duration and concurrent-meeting limits depend on your plan. See the pricing page for current meeting limits.' },
    ],
  },
  {
    slug: 'ai',
    icon: 'sparkles',
    label: 'AI notes & transcripts',
    metaTitle: 'AI Class Notes — Transcripts & Summaries',
    metaDescription:
      'Transcripts, AI class notes and action items, plus an assistant you can ask about any recorded class. End-to-end encrypted meetings stay AI-free by design.',
    eyebrow: 'AI & context',
    steps: [
      { title: 'Record the session', body: 'Cloud-record a meeting; the recording becomes the source for everything below.' },
      { title: 'Transcribe and summarise', body: 'One click turns the recording into a searchable transcript, a clean summary and action items.' },
      { title: 'Ask the meeting', body: 'Ask questions about what was said and get answers grounded in that transcript.' },
    ],
    related: ['recordings', 'live-captions', 'use-cases/academies'],
    title: 'Meet now, get the',
    titleAccent: 'notes and context after',
    lead: 'Record a meeting and Ollasync turns it into a searchable transcript, a clean summary and a list of action items — and lets you ask questions about what was said. Your workspace decides which meetings it covers.',
    capabilities: [
      { icon: 'doc', title: 'Automatic transcripts', body: 'Recorded meetings are transcribed into timestamped, searchable text you can scan or share.' },
      { icon: 'sparkles', title: 'AI notes & summaries', body: 'A concise summary of what happened, generated from the meeting’s own transcript — no manual note-taking.' },
      { icon: 'check-circle', title: 'Action items', body: 'The decisions and to-dos pulled out of the conversation, so nothing gets lost after the call.' },
      { icon: 'chat', title: 'Ask about the meeting', body: 'Ask questions about a recorded meeting and get answers grounded in its transcript — the context is the meeting itself.' },
      { icon: 'search', title: 'Searchable history', body: 'Find the moment something was said across your recordings by searching the transcript text.' },
      { icon: 'toggle', title: 'Under your control', body: 'Your workspace decides where AI applies. It runs after the meeting, on the recordings you choose.' },
    ],
    securityNote:
      'AI works from the meeting’s own transcript, on the recordings you choose. End-to-end encrypted meetings are excluded — an encrypted meeting has no server-readable transcript to work from.',
    faq: [
      { q: 'Which meetings does the AI work on?', a: 'The recordings you choose, under your workspace’s control. End-to-end encrypted meetings are excluded — they have no server-readable transcript.' },
      { q: 'Which meetings stay out of it?', a: 'End-to-end encrypted meetings. They carry no server-readable transcript, so there is nothing for AI to work from.' },
      { q: 'What does “context” mean?', a: 'The assistant answers from the meeting’s own transcript, so every answer is grounded in what was actually said in that meeting.' },
    ],
  },

  {
    slug: 'recordings',
    icon: 'play',
    label: 'Meeting recordings',
    metaTitle: 'Class Recordings — Access-Controlled',
    metaDescription:
      'Record meetings to your workspace, restricted to authorised viewers, with transcripts and AI notes. Audio-only option and retention on your terms.',
    eyebrow: 'Recordings',
    steps: [
      { title: 'Record to the cloud', body: 'The host starts and stops recording; everyone in the room sees the indicator.' },
      { title: 'Stored in your workspace', body: 'Access-controlled, served through short-lived signed links, never a public bucket.' },
      { title: 'Transcribe, summarise, share', body: 'Turn a recording into a transcript and AI notes, or let learners keep their own local copy in their language.' },
    ],
    related: ['local-recording', 'ai'],
    title: 'Recordings that stay',
    titleAccent: 'under your control',
    lead: 'Capture meetings for replay and records — stored in your workspace, restricted to the people you authorise, and ready to transcribe and summarise with AI.',
    capabilities: [
      { icon: 'play', title: 'One-click capture', body: 'Start and stop recording during a meeting, with a clear on-screen indicator for everyone in the room.' },
      { icon: 'file-lock', title: 'Access-restricted', body: 'Playback is limited to authorised viewers through short-lived signed links — not a public URL that leaks.' },
      { icon: 'mic', title: 'Audio-only option', body: 'Capture audio only when that’s all you need — smaller files, faster to review and transcribe.' },
      { icon: 'sparkles', title: 'Transcripts & AI notes', body: 'Turn any recording into a searchable transcript with an AI summary and action items.' },
      { icon: 'globe', title: 'Private storage', body: 'Recordings are stored privately on our hosted service — short-lived signed links, never a public bucket.' },
      { icon: 'clock', title: 'Retention & deletion', body: 'Keep, download or delete recordings under your own policy, with recording activity in the audit trail.' },
    ],
    securityNote:
      'Recordings are access-controlled and stored privately in your workspace; playback uses short-lived signed links. Recording is server-side, so it is not available for end-to-end-encrypted meetings — those are correctly kept un-recordable.',
    faq: [
      { q: 'Where are recordings stored?', a: 'Privately in your workspace on our hosted service, reachable only through short-lived signed links — never a public bucket.' },
      { q: 'Who can watch a recording?', a: 'Only authorised viewers in your workspace. Recordings are access-restricted, not shared via public links.' },
      { q: 'Can I record an encrypted meeting?', a: 'No. Recording decodes media server-side, which an end-to-end-encrypted meeting deliberately prevents — so recording is hidden for E2EE meetings.' },
    ],
  },

];
