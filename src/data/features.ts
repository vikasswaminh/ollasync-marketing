// Product feature pages. Claims are whitepaper-accurate:
//  - meeting media = encrypted in transit (DTLS-SRTP) over a self-hostable SFU,
//    with an opt-in E2EE mode (NOT blanket "E2EE video")
//  - messaging = server-blind E2EE (IETF MLS / RFC 9420) by default
//  - deal-room docs = encrypted in transit + access-controlled (NOT client-side E2EE yet)
//  - recordings = access-controlled, on storage you operate

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
}

export const FEATURES: Feature[] = [
  {
    slug: 'video-meetings',
    icon: 'video',
    label: 'Video meetings',
    metaTitle: 'Encrypted 4K video meetings — no download',
    metaDescription:
      'Browser-based encrypted video meetings with native 4K video, studio-grade 48 kHz audio and AI noise suppression. No app install, self-hostable, EU-hosted.',
    eyebrow: 'Video meetings',
    title: 'Encrypted video meetings,',
    titleAccent: 'straight from the browser',
    lead: 'One-click, no-download meetings with native 4K video and studio-grade audio — encrypted in transit over a media relay you can self-host, so the servers your call runs on can be ones you operate.',
    capabilities: [
      { icon: 'video', title: 'Native 4K video', body: 'High-resolution video that adapts to the network, so faces stay sharp without hammering bandwidth.' },
      { icon: 'mic', title: 'Studio-grade audio', body: 'Full-band Opus audio at 48 kHz with AI noise suppression that keeps keyboards, traffic and background chatter out of the room.' },
      { icon: 'layers', title: 'Screen share & present', body: 'Share a screen, a window or a tab in high fidelity, with a presenter view for larger sessions.' },
      { icon: 'lock', title: 'Rooms default-closed', body: 'Guests need an invite and the host approves the join before anything flows. Room tokens are short-lived and role-scoped.' },
      { icon: 'chat', title: 'In-call chat', body: 'Side chat and reactions during the call, end-to-end encrypted when the meeting carries an encryption key.' },
      { icon: 'server', title: 'Self-host the relay', body: 'Run the media relay (SFU) yourself so meeting media stays inside your network — on-premise or air-gapped.' },
    ],
    securityNote:
      'Meeting media is encrypted in transit (TLS 1.3 / DTLS-SRTP) to a media relay you can self-host, with a per-frame end-to-end encryption mode available. We describe exactly what’s protected on the security page — no blanket claims.',
    faq: [
      { q: 'Do participants need to install anything?', a: 'No. Meetings run in any modern browser with no download. Invited guests can join without an account.' },
      { q: 'Is the video end-to-end encrypted?', a: 'Meeting media is encrypted in transit to a relay you can self-host, with an opt-in end-to-end encryption mode. It is not blanket E2EE by default — see the security page for the precise, layered picture.' },
      { q: 'How good is the audio really?', a: 'Full-band Opus at 48 kHz with AI noise suppression — noticeably clearer than the narrowband audio many meeting tools default to, especially in noisy environments.' },
    ],
  },
  {
    slug: 'webinars',
    icon: 'users',
    label: 'Webinars',
    metaTitle: 'Encrypted webinars with tokenless public join',
    metaDescription:
      'Broadcast to large audiences with moderation and Q&A. Encrypted webinars where attendees join instantly from a browser — self-hostable and EU-hosted.',
    eyebrow: 'Webinars',
    title: 'Webinars that scale',
    titleAccent: 'without the leaks',
    lead: 'Broadcast to a large audience with a clean, no-friction public join, live moderation and Q&A — under the same encryption model and self-hosting story as your meetings.',
    capabilities: [
      { icon: 'users', title: 'Large-audience broadcast', body: 'Present to many attendees at once, with the stage separated from the audience.' },
      { icon: 'route', title: 'Tokenless public join', body: 'Attendees join instantly from a shareable link — subscribe-only, no account, no download.' },
      { icon: 'shield', title: 'Moderation controls', body: 'Hosts and moderators manage who’s on stage, who can speak, and what the audience sees.' },
      { icon: 'chat', title: 'Live Q&A', body: 'Structured audience questions and reactions, so large sessions stay interactive without chaos.' },
      { icon: 'play', title: 'Record the session', body: 'Capture the webinar to storage you control for on-demand replay.' },
      { icon: 'server', title: 'Self-hostable', body: 'Run webinars on your own infrastructure, on the same platform as your internal meetings.' },
    ],
    securityNote:
      'Webinar attendee join is public and subscribe-only by design — attendees receive but don’t broadcast. Media is encrypted in transit over a relay you can self-host.',
    faq: [
      { q: 'How do attendees join a webinar?', a: 'Through a shareable link that opens in the browser — no account and no download. The public attendee join is subscribe-only, so the audience receives the broadcast without being able to publish into it.' },
      { q: 'Can we moderate the audience?', a: 'Yes. Hosts and moderators control the stage, speaking rights and Q&A, so large sessions stay orderly.' },
      { q: 'Can webinars run self-hosted?', a: 'Yes. Webinars run on the same self-hostable platform as meetings — private cloud, on-premise or air-gapped.' },
    ],
  },
  {
    slug: 'recordings',
    icon: 'play',
    label: 'Recordings',
    metaTitle: 'Access-controlled meeting recordings on your storage',
    metaDescription:
      'Record meetings and webinars to object storage you control, restricted to authorised viewers. Self-host and recordings never leave your infrastructure.',
    eyebrow: 'Recordings',
    title: 'Recordings that stay',
    titleAccent: 'under your control',
    lead: 'Capture meetings and webinars for replay and records — written to object storage you operate and restricted to the people you authorise.',
    capabilities: [
      { icon: 'play', title: 'One-click capture', body: 'Start and stop recording during a meeting or webinar, with a clear on-screen indicator for participants.' },
      { icon: 'file-lock', title: 'Your storage', body: 'Recordings are written to object storage you control; self-host and they never leave your infrastructure.' },
      { icon: 'lock', title: 'Access-restricted', body: 'Playback is limited to authorised viewers — not a public link that leaks.' },
      { icon: 'doc', title: 'Auditable', body: 'Recording activity is logged alongside the rest of your security-relevant audit trail.' },
      { icon: 'globe', title: 'Residency you choose', body: 'On our EU-hosted service recordings stay in the EU; self-hosted, they stay wherever you deploy.' },
      { icon: 'clock', title: 'Retention on your terms', body: 'Keep or purge recordings under your own retention policy, especially when self-hosted.' },
    ],
    securityNote:
      'Recordings are access-controlled and written to object storage you operate. At-rest encryption follows your storage configuration. Self-host and recordings never leave your walls.',
    faq: [
      { q: 'Where are recordings stored?', a: 'On object storage you control. On our hosted service that’s EU-based; self-hosted, recordings stay entirely on your own infrastructure.' },
      { q: 'Who can watch a recording?', a: 'Only authorised viewers — recordings are access-restricted, not shared via public links.' },
      { q: 'Can we control how long recordings are kept?', a: 'Yes. Retention is under your control, particularly in a self-hosted deployment where you own the storage and policy.' },
    ],
  },
  {
    slug: 'deal-rooms',
    icon: 'file-lock',
    label: 'Deal rooms',
    metaTitle: 'Confidential deal rooms — a data room with live video',
    metaDescription:
      'Per-deal confidential document rooms with role-based access, NDA gating, view-only watermarking and live encrypted video. A secure virtual data room for M&A and diligence.',
    eyebrow: 'Deal rooms',
    title: 'Confidential document rooms',
    titleAccent: 'with live video',
    lead: 'Per-deal rooms where documents are role-gated, NDA-protected and view-only when they need to be — with encrypted video in the same room. A virtual data room for the conversations that can’t leak.',
    capabilities: [
      { icon: 'doc', title: 'Role-based folders', body: 'Deal roles govern who sees which folders — buyer, seller, counsel, banker, auditor, observer and more.' },
      { icon: 'file-lock', title: 'NDA gating', body: 'Require NDA acceptance before any document can be downloaded — audited, with the admin notified.' },
      { icon: 'eye-off', title: 'View-only + watermark', body: 'Show sensitive documents in-browser with a per-viewer watermark and no download — deterrence against casual leakage.' },
      { icon: 'video', title: 'Live encrypted video', body: 'Meet inside the deal room, so discussion and documents live in one confidential place.' },
      { icon: 'users', title: 'Cross-organisation invites', body: 'Invite outside parties by email; they access the deal from their own workspace with their own scoped role.' },
      { icon: 'route', title: 'Audit trail', body: 'Every invite, NDA acceptance and document access is logged for your records.' },
    ],
    securityNote:
      'Deal-room documents are encrypted in transit and gated by role and NDA, with short-lived signed access links. They are not client-side end-to-end encrypted in the current web flow — we state this plainly. Self-host and documents stay on storage you operate.',
    faq: [
      { q: 'Is this a virtual data room?', a: 'Yes — a confidential document room with role-based folders, NDA gating, in-browser view-only mode with watermarks and audited access, plus live encrypted video in the same room.' },
      { q: 'Are documents end-to-end encrypted?', a: 'In the current web flow, documents are encrypted in transit and access-controlled, but not client-side end-to-end encrypted. Client-side document encryption is on the roadmap, and we don’t claim it today. Self-hosting keeps documents on your own storage.' },
      { q: 'Can external parties join a deal?', a: 'Yes. Cross-organisation invites let outside members access a deal from their own workspace, governed by their assigned role — without joining your tenant.' },
    ],
  },
  {
    slug: 'messaging',
    icon: 'chat',
    label: 'Messaging',
    metaTitle: 'Server-blind end-to-end encrypted team messaging',
    metaDescription:
      'End-to-end encrypted messaging built on the open IETF MLS standard (RFC 9420), with forward secrecy. The server stores only ciphertext — we can’t read your messages.',
    eyebrow: 'Messaging',
    title: 'Messaging we',
    titleAccent: 'genuinely can’t read',
    lead: 'End-to-end encrypted team and deal messaging built on the open IETF MLS standard (RFC 9420). Keys live on devices, the server stores only ciphertext, and it’s on by default.',
    capabilities: [
      { icon: 'fingerprint', title: 'IETF MLS (RFC 9420)', body: 'Modern group-messaging cryptography via an independently audited open-source library — not a proprietary black box.' },
      { icon: 'shield-check', title: 'Forward secrecy', body: 'A compromised key can’t unlock past conversations, with post-compromise security as the group re-keys.' },
      { icon: 'eye-off', title: 'Server-blind delivery', body: 'The server is a blind relay of opaque ciphertext — it can’t read message or file content.' },
      { icon: 'file-lock', title: 'Encrypted attachments', body: 'Files shared in messaging rooms are encrypted client-side alongside the messages.' },
      { icon: 'clock', title: 'Disappearing messages', body: 'Per-room message TTLs for conversations that shouldn’t stick around.' },
      { icon: 'server', title: 'Self-host or EU-hosted', body: 'The same server-blind guarantee whether we host it or you run it yourself.' },
    ],
    securityNote:
      'Messaging is the fully end-to-end encrypted, server-blind path: keys never reach the server, and an automated two-browser test proves the plaintext never appears in anything the server stores.',
    faq: [
      { q: 'What encryption does messaging use?', a: 'The IETF MLS standard (RFC 9420) via an independently audited open-source library, providing forward secrecy and post-compromise security. All key material stays on devices.' },
      { q: 'Can you read my messages?', a: 'No. Messaging is server-blind — the server stores only ciphertext and we hold no keys. There is no readable content for us to access or be compelled to produce.' },
      { q: 'Does self-hosting change the encryption?', a: 'No — messaging is end-to-end encrypted whether we host it or you do. Self-hosting additionally keeps meeting media and documents inside your own infrastructure.' },
    ],
  },
];
