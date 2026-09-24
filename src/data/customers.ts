export interface Customer {
  id: string;
  name: string;
  url: string;
  domain: string;
  category: string;
  useCase: string;
  description: string;
  badge: string;
}

export const CUSTOMERS: Customer[] = [
  {
    id: 'networkershome',
    name: 'Networkers Home',
    url: 'https://www.networkershome.com/',
    domain: 'networkershome.com',
    category: 'IT Training & Certification',
    useCase: 'Live Cisco & Cyber Training',
    description: "Bangalore's premier Cisco and cybersecurity training institute. Trains 45,000+ engineers worldwide using Ollasync for live, multilingual virtual classrooms.",
    badge: '45k+ Engineers Trained',
  },
  {
    id: 'freefreecv',
    name: 'FreeFreeCV',
    url: 'https://freefreecv.com/',
    domain: 'freefreecv.com',
    category: 'AI Resume & Career Platform',
    useCase: 'Global Career Coaching & Webinars',
    description: 'Free AI-powered ATS resume builder. Employs Ollasync to run cross-border career coaching sessions and multilingual resume workshops.',
    badge: '30+ ATS Templates',
  },
  {
    id: 'olladns',
    name: 'OllaDNS',
    url: 'https://olladns.com/',
    domain: 'olladns.com',
    category: 'Cloud DNS Security',
    useCase: 'API & MCP SecOps Briefings',
    description: 'API-first, MCP-native DNS filtering and threat defense platform. Uses Ollasync for secure architecture syncs and engineering reviews.',
    badge: 'MCP-Native DNS',
  },
  {
    id: 'ollavpn',
    name: 'OllaVPN',
    url: 'https://ollavpn.com/',
    domain: 'ollavpn.com',
    category: 'Quantum-Resistant Mesh VPN',
    useCase: 'Partner & Enterprise Demos',
    description: 'Post-quantum WireGuard VPN with zero DNS leakage. Relies on Ollasync for privacy-first browser meetings with zero client software required.',
    badge: 'Post-Quantum WireGuard',
  },
  {
    id: 'quickztna',
    name: 'QuickZTNA',
    url: 'https://quickztna.com/',
    domain: 'quickztna.com',
    category: 'Zero Trust Network Access',
    useCase: 'Customer Onboarding & SOC Reviews',
    description: 'Zero Trust network access and encrypted device mesh platform. Delivers live onboarding walkthroughs to enterprise IT teams via Ollasync.',
    badge: 'Zero Trust Mesh',
  },
  {
    id: 'quicksdwan',
    name: 'QuickSDWAN',
    url: 'https://quicksdwan.com/',
    domain: 'quicksdwan.com',
    category: 'Cloud Mesh SD-WAN',
    useCase: 'MSP Operations & Engineer Training',
    description: 'Full-mesh SD-WAN with self-healing multi-WAN failover. Uses Ollasync AI notes and transcripts to train international MSP support engineers.',
    badge: 'Self-Healing SD-WAN',
  },
  {
    id: 'whatping',
    name: 'WhatPing',
    url: 'https://www.whatping.com/',
    domain: 'whatping.com',
    category: 'Synthetic & Uptime Monitoring',
    useCase: 'Incident War Rooms & Postmortems',
    description: 'Agentless uptime, SSL, DNS, and latency monitoring platform. Uses Ollasync browser video meetings for real-time DevOps incident war rooms.',
    badge: 'Agentless Uptime',
  },
  {
    id: '24observe',
    name: '24Observe',
    url: 'https://24observe.com/',
    domain: '24observe.com',
    category: 'OpenTelemetry Observability',
    useCase: 'Distributed Fleet Architecture Syncs',
    description: 'Zero-copy OpenTelemetry log compression and APM. Connects cross-functional engineering teams across continents with real-time translated meetings.',
    badge: 'OTel-Native APM',
  },
];
