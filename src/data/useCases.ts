// Vertical landing pages. Content is honesty-bound: no "certified"/"compliant"
// claims — we provide controls + self-host as the compliance boundary.
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
      'Private, encrypted telehealth and clinical collaboration. Self-host so PHI never leaves your compliance boundary — video meetings, messaging and document rooms built for healthcare.',
    eyebrow: 'For healthcare & telehealth',
    title: 'Encrypted video for care teams that handle',
    titleAccent: 'protected health information',
    lead: 'Telehealth visits, multidisciplinary case reviews and referrals — encrypted, and deployable inside your own environment so protected health information (PHI) stays within the controls you already run.',
    pains: [
      { title: 'PHI on someone else’s cloud', body: 'Consumer video tools put patient conversations and shared records on infrastructure you can’t inspect or bound to a jurisdiction.' },
      { title: 'Consent & records obligations', body: 'Clinical conversations and shared documents may need to stay auditable, access-controlled and retained under your policies — not a vendor’s defaults.' },
      { title: 'Cross-provider collaboration leaks', body: 'Case reviews and referrals across organisations are exactly where sensitive records get forwarded into unmanaged inboxes and chats.' },
    ],
    helps: [
      { icon: 'video', title: 'Encrypted telehealth visits', body: 'Browser-based video with no app install for patients, encrypted in transit over a media relay you can self-host.' },
      { icon: 'file-lock', title: 'Case rooms for records', body: 'Per-case document rooms with role and NDA gating, in-browser viewing and per-viewer watermarks for referrals and MDT reviews.' },
      { icon: 'chat', title: 'Server-blind messaging', body: 'End-to-end encrypted clinical messaging (IETF MLS / RFC 9420) — we hold no keys and can’t read the content.' },
      { icon: 'server', title: 'PHI stays in your walls', body: 'Self-host and every byte of media, recording and document stays on infrastructure you operate and audit.' },
    ],
    complianceTitle: 'Where a HIPAA or GDPR programme fits',
    compliance: [
      'We don’t sell you a certificate — we give you the technical controls a HIPAA or GDPR-health programme requires: encryption, access control, audit logging and a DPA.',
      'Self-host and PHI never leaves your certified environment, so the software sits inside your existing compliance boundary rather than adding a subprocessor.',
      'A data-processing agreement covering residency, retention and breach notification is available for our hosted service.',
      'We hold no SOC 2 / ISO 27001 / HDS certification yet, and we tell you so — see the security page.',
    ],
    scenario: {
      title: 'A multidisciplinary team review, contained',
      body: 'A hospital stands up Ollasync on-premise. Oncology, radiology and an external specialist join an encrypted case review; imaging and notes live in a role-gated case room that never leaves the hospital network. Nothing syncs to an external cloud, and the whole session is auditable.',
    },
    faq: [
      { q: 'Is Ollasync HIPAA compliant?', a: 'Compliance is a property of your deployment. Ollasync provides the encryption, access control, audit logging and DPA a HIPAA programme needs, and self-hosting keeps PHI inside your own audited environment. We do not currently hold a formal certification and we say so plainly.' },
      { q: 'Can patients join without installing anything?', a: 'Yes. Patients join encrypted telehealth visits from any modern browser — no download, no account required for guests who are invited to a room.' },
      { q: 'Where is patient data stored?', a: 'On our EU-hosted service, in the EU (Frankfurt). If you self-host, patient data stays entirely on your infrastructure, in the jurisdiction and network you choose — including fully air-gapped.' },
    ],
  },
  {
    slug: 'legal',
    icon: 'scale',
    label: 'Legal',
    metaTitle: 'Secure video conferencing & deal rooms for law firms',
    metaDescription:
      'Protect privileged client conversations and confidential documents. Encrypted video, server-blind messaging and NDA-gated deal rooms for law firms — self-hostable and EU-hosted.',
    eyebrow: 'For law firms & in-house counsel',
    title: 'Privileged conversations that stay',
    titleAccent: 'privileged',
    lead: 'Client calls, matter collaboration and document exchange — encrypted, access-controlled and deployable in your own environment, so privilege isn’t waived by the tools you use to communicate.',
    pains: [
      { title: 'Privilege on unmanaged tools', body: 'Client discussions on consumer platforms sit on infrastructure a firm can’t control, complicating confidentiality and privilege.' },
      { title: 'Document leakage', body: 'Sensitive filings and evidence get forwarded, downloaded and re-shared far beyond the matter team.' },
      { title: 'Cross-party collaboration', body: 'Co-counsel, opposing parties and clients each need scoped access — not a shared drive everyone can rummage through.' },
    ],
    helps: [
      { icon: 'file-lock', title: 'NDA-gated matter rooms', body: 'Per-matter document rooms that require NDA acceptance before download, with role-based folders and audited access.' },
      { icon: 'eye-off', title: 'View-only with watermark', body: 'Show sensitive documents in-browser with a per-viewer watermark and no download — deterrence against casual leakage.' },
      { icon: 'video', title: 'Encrypted client calls', body: 'Browser video for client and deposition-style meetings, encrypted in transit over a relay you can self-host.' },
      { icon: 'chat', title: 'Server-blind messaging', body: 'End-to-end encrypted messaging where the server only ever stores ciphertext — we can’t read privileged communications.' },
    ],
    complianceTitle: 'Confidentiality you can defend',
    compliance: [
      'End-to-end encrypted messaging means privileged communications aren’t readable by us — there is no plaintext for us to be compelled to produce.',
      'Self-host and client matter data stays entirely within the firm’s own systems and retention policies.',
      'Cross-organisation deal rooms let co-counsel and clients access a matter from their own workspace with their own scoped role.',
      'Full audit logging of access, NDA acceptance and document activity supports your professional-conduct obligations.',
    ],
    scenario: {
      title: 'A cross-border deal, scoped tight',
      body: 'A firm opens a deal room for an acquisition. Buyer counsel, seller counsel and bankers each get a role; the diligence folder is restricted, an NDA gates downloads, and the most sensitive documents are view-only and watermarked. Every access is logged, and the messaging thread is end-to-end encrypted.',
    },
    faq: [
      { q: 'Does using Ollasync affect attorney-client privilege?', a: 'Ollasync is designed to strengthen confidentiality: messaging is end-to-end encrypted (we hold no keys), documents are access-controlled and NDA-gated, and self-hosting keeps everything inside the firm’s systems. As always, privilege is a legal determination — the tooling is built to support, not undermine, it.' },
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
      'Confidential advisory calls, board meetings and M&A deal rooms. Encrypted, auditable and self-hostable video conferencing for banks, funds and advisory firms.',
    eyebrow: 'For banking, funds & advisory',
    title: 'For conversations that move',
    titleAccent: 'markets',
    lead: 'Advisory calls, investment committees, board meetings and live deal rooms — encrypted and auditable, and deployable inside your own controls so material non-public information stays contained.',
    pains: [
      { title: 'MNPI on the open cloud', body: 'Deal discussions and board materials on consumer platforms expose material non-public information to infrastructure you can’t bound.' },
      { title: 'Record-keeping obligations', body: 'Regulated firms need auditable access, retention control and clear data residency — not a vendor’s opaque defaults.' },
      { title: 'Data rooms that leak', body: 'Traditional data rooms scatter confidential documents across downloads and forwards with weak per-user control.' },
    ],
    helps: [
      { icon: 'file-lock', title: 'Confidential deal rooms', body: 'Per-deal document rooms with role-based access, NDA gating and audited downloads — a virtual data room with live video built in.' },
      { icon: 'video', title: 'Encrypted advisory calls', body: 'Browser video for advisory, IC and board meetings, encrypted in transit over a relay you can self-host.' },
      { icon: 'doc', title: 'Audit trail by default', body: 'Every login, invite, NDA acceptance and document access is logged for your record-keeping and controls.' },
      { icon: 'globe', title: 'Residency you choose', body: 'EU-hosted, or self-hosted in your own jurisdiction — so data location is a decision, not a surprise.' },
    ],
    complianceTitle: 'Controls your risk team will recognise',
    compliance: [
      'Access control, NDA gating and comprehensive audit logging support record-keeping and information-barrier requirements.',
      'Self-host and MNPI-bearing conversations and documents stay entirely within your regulated environment.',
      'Data residency is explicit — the EU on our hosted service, or wherever you deploy on-premise.',
      'We provide the controls and a DPA; we don’t claim a certification we don’t hold. See the security page for the honest posture.',
    ],
    scenario: {
      title: 'An investment committee, on the record',
      body: 'A fund runs its IC over encrypted video, with the deal memo and model in a role-gated deal room. Partners see everything; a prospective LP sees only the teaser folder after signing an NDA. Every access is logged for the compliance file, and nothing touches a consumer cloud.',
    },
    faq: [
      { q: 'Can Ollasync serve as a virtual data room?', a: 'Yes. Deal rooms are confidential document rooms with role-based folders, NDA gating, in-browser view-only mode with watermarks, and audited access — with live encrypted video in the same room.' },
      { q: 'Does it support our record-keeping obligations?', a: 'Ollasync logs security-relevant actions (logins, invites, NDA acceptance, document access). Recordings and retention are under your control, especially when self-hosted. We provide controls; your compliance team owns the programme.' },
      { q: 'Where does deal data live?', a: 'In the EU on our hosted service, or entirely on your own infrastructure when self-hosted — in the jurisdiction and network you choose.' },
    ],
  },
  {
    slug: 'government',
    icon: 'landmark',
    label: 'Government',
    metaTitle: 'Sovereign, self-hosted video conferencing for government',
    metaDescription:
      'On-premise and air-gapped encrypted video conferencing for the public sector. Keep citizen and classified data inside national infrastructure — no US CLOUD Act exposure.',
    eyebrow: 'For public sector & defence',
    title: 'Sovereign communications that never',
    titleAccent: 'leave the country',
    lead: 'Encrypted meetings, messaging and document rooms deployable on-premise or fully air-gapped — so citizen data and sensitive deliberations stay inside national infrastructure and out of foreign legal reach.',
    pains: [
      { title: 'Foreign cloud & legal reach', body: 'Public-sector data on US-operated clouds is exposed to foreign jurisdiction and statutes like the CLOUD Act.' },
      { title: 'Air-gap requirements', body: 'The most sensitive environments can’t rely on any internet-connected SaaS at all.' },
      { title: 'Data sovereignty mandates', body: 'National and EU sovereignty rules require citizen data to stay within specific borders and controls.' },
    ],
    helps: [
      { icon: 'shield', title: 'Air-gapped deployment', body: 'Runs entirely on an isolated network with no inbound or outbound internet required for meetings.' },
      { icon: 'server', title: 'Full on-premise control', body: 'Every component — app, media relay, storage, identity — runs on infrastructure the agency owns and operates.' },
      { icon: 'globe', title: 'National data residency', body: 'Data stays exactly where you deploy it: a national datacenter, a specific region, or a disconnected network.' },
      { icon: 'fingerprint', title: 'Your identity provider', body: 'OIDC single sign-on into the agency’s own directory — no third-party identity service required.' },
    ],
    complianceTitle: 'Sovereignty by architecture',
    compliance: [
      'Self-hosting means no default egress to us and no foreign subprocessor — data stays under national control.',
      'Air-gapped operation removes internet dependency entirely for the most sensitive use.',
      'End-to-end encrypted messaging keeps deliberations unreadable to any operator, including us.',
      'Versioned images let you update on your own change-controlled schedule, including offline.',
    ],
    scenario: {
      title: 'An inter-agency briefing, air-gapped',
      body: 'A ministry deploys Ollasync on an isolated network. Officials across departments hold an encrypted briefing with documents in a classified room — no internet connection, no foreign cloud, no telemetry leaving the building. Updates arrive as signed images through the agency’s existing offline process.',
    },
    faq: [
      { q: 'Can Ollasync run fully air-gapped?', a: 'Yes. Meetings, messaging and document rooms work on an isolated network with no internet access. Versioned container images are brought in through your normal offline software process.' },
      { q: 'Does self-hosting avoid CLOUD Act exposure?', a: 'When you self-host on national infrastructure, there is no US-operated cloud in the path and no default egress to us — data stays under your jurisdiction and control. Your legal team owns the final determination; the architecture is built to keep data sovereign.' },
      { q: 'Can we use our own identity system?', a: 'Yes. Ollasync integrates with your OIDC identity provider for single sign-on into your existing directory, with no dependency on a third-party identity SaaS.' },
    ],
  },
];
