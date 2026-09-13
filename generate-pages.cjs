const fs = require('fs');
const path = require('path');

const pages = [
  // Industries
  {
    path: 'src/pages/industries/healthcare-compliance-training.astro',
    title: 'Multilingual Healthcare Compliance Training Platform',
    description: 'Train global hospital staff and healthcare workers with strict, translated compliance training in 19+ languages.',
    category: 'Industries',
    intro: 'Healthcare organizations need to ensure every employee understands compliance protocols, regardless of their native language. Ollasync provides secure, translated video training for global health teams.',
    benefits: [
      { title: 'HIPAA-ready security', body: 'Keep sensitive training materials and discussions secure with enterprise-grade encryption.' },
      { title: 'Medical terminology translation', body: 'AI models designed to handle complex healthcare jargon across 19+ languages.' },
      { title: 'Automated attendance tracking', body: 'Easily prove compliance with built-in reporting on who attended and for how long.' }
    ],
    faqs: [
      { question: 'Is Ollasync suitable for healthcare compliance?', answer: 'Yes, Ollasync offers secure, encrypted video sessions with attendance tracking to meet compliance requirements.' },
      { question: 'Can it translate medical terms?', answer: 'Our AI is equipped to handle industry-specific terminology, ensuring accurate translations for healthcare professionals.' }
    ]
  },
  {
    path: 'src/pages/industries/franchise-training-software.astro',
    title: 'Global Franchise Training Software with Translation',
    description: 'Scale your franchise internationally with automated video training translation for franchisees and staff.',
    category: 'Industries',
    intro: 'Expanding a franchise globally means training staff in dozens of languages. Ollasync eliminates the need for localized training videos by translating live sessions instantly.',
    benefits: [
      { title: 'Consistent brand standards', body: 'Deliver the exact same training message to every franchisee globally, in their native language.' },
      { title: 'Zero localization costs', body: 'Stop paying for expensive video dubbing or human interpreters for every new market.' },
      { title: 'Interactive Q&A', body: 'Franchisees can ask questions in their language, and trainers hear it in theirs.' }
    ],
    faqs: [
      { question: 'How does this help franchises?', answer: 'It allows corporate trainers to host a single session that all global franchisees can understand in their native language.' }
    ]
  },
  {
    path: 'src/pages/industries/manufacturing-safety-training.astro',
    title: 'Manufacturing Safety Training Video Platform',
    description: 'Ensure factory floor safety with multilingual video training that every worker understands.',
    category: 'Industries',
    intro: 'Safety training is only effective if workers understand it. Ollasync ensures your diverse, multilingual manufacturing workforce receives critical safety instructions clearly.',
    benefits: [
      { title: 'Reduce workplace accidents', body: 'Clear, native-language instruction ensures safety protocols are fully understood.' },
      { title: 'Train diverse shifts simultaneously', body: 'Host one safety briefing for a shift where workers speak 5 different languages.' },
      { title: 'On-demand safety recordings', body: 'Record the live translated session for new hires to watch later.' }
    ],
    faqs: [
      { question: 'Can workers join from mobile devices?', answer: 'Yes, Ollasync works directly in the browser on mobile devices, perfect for factory floor access.' }
    ]
  },
  {
    path: 'src/pages/industries/tech-startup-onboarding.astro',
    title: 'Tech Startup Remote Onboarding Tools',
    description: 'Onboard global engineering and sales talent faster with AI-translated video sessions.',
    category: 'Industries',
    intro: 'Hyper-growth startups hire the best talent, regardless of geography. Ollasync helps you onboard remote teams seamlessly across language barriers.',
    benefits: [
      { title: 'Faster time-to-productivity', body: 'New hires learn faster when they can consume complex technical onboarding in their native language.' },
      { title: 'Unified company culture', body: 'Host global all-hands meetings where everyone feels included and understands the vision.' },
      { title: 'Developer-friendly API', body: 'Integrate Ollasync directly into your internal startup tools.' }
    ],
    faqs: [
      { question: 'Is it easy to set up?', answer: 'Ollasync requires no downloads or complex installations. It runs directly in the browser.' }
    ]
  },
  {
    path: 'src/pages/industries/non-profit-volunteer-training.astro',
    title: 'Non-Profit Global Volunteer Training Software',
    description: 'Coordinate and train international NGO volunteers without the budget for human interpreters.',
    category: 'Industries',
    intro: 'Non-profits operate globally but often lack the budget for professional translation services. Ollasync democratizes access to training for volunteers worldwide.',
    benefits: [
      { title: 'Cost-effective global reach', body: 'Reach volunteers in 19+ languages without spending donor funds on interpreters.' },
      { title: 'Rapid crisis response', body: 'Deploy training immediately to international teams during emergencies.' },
      { title: 'Low-bandwidth mode', body: 'Optimized for volunteers connecting from regions with poor internet infrastructure.' }
    ],
    faqs: [
      { question: 'Do you offer non-profit pricing?', answer: 'Yes, we offer specialized pricing tiers for registered NGOs and non-profits.' }
    ]
  },
  // Roles
  {
    path: 'src/pages/roles/learning-and-development.astro',
    title: 'Best Video Platform for L&D Professionals 2026',
    description: 'Upgrade your L&D tech stack with AI-powered live translation and virtual classrooms.',
    category: 'Roles',
    intro: 'Learning & Development leaders are tasked with upskilling global workforces. Ollasync provides the tools to make training accessible, engaging, and measurable across all regions.',
    benefits: [
      { title: 'Scale training programs', body: 'Deliver one curriculum globally without waiting for localization teams.' },
      { title: 'Increase knowledge retention', body: 'Learners retain more information when taught in their primary language.' },
      { title: 'Actionable analytics', body: 'Track engagement, attendance, and comprehension across your global programs.' }
    ],
    faqs: [
      { question: 'How does this improve L&D metrics?', answer: 'By removing language barriers, completion rates and knowledge retention scores typically increase significantly.' }
    ]
  },
  {
    path: 'src/pages/roles/hr-global-onboarding.astro',
    title: 'HR Tools for Global Employee Onboarding',
    description: 'Streamline international hiring with multilingual onboarding video software.',
    category: 'Roles',
    intro: 'Human Resources directors managing distributed teams face massive logistical hurdles. Ollasync simplifies global onboarding by translating live orientation sessions instantly.',
    benefits: [
      { title: 'Standardized onboarding', body: 'Ensure every employee receives the exact same HR messaging and compliance training.' },
      { title: 'Inclusive company culture', body: 'Make international hires feel welcome from day one with native-language support.' },
      { title: 'Reduce HR workload', body: 'Stop scheduling separate orientation sessions for different regions.' }
    ],
    faqs: [
      { question: 'Can we record HR sessions?', answer: 'Yes, sessions can be recorded with all language tracks preserved for future hires.' }
    ]
  },
  {
    path: 'src/pages/roles/customer-success-webinars.astro',
    title: 'Customer Success Webinar Platform for Global Audiences',
    description: 'Train international clients and reduce churn with translated customer success webinars.',
    category: 'Roles',
    intro: 'Customer Success teams need to educate users to drive adoption. Ollasync lets you host global training webinars where every client learns in their preferred language.',
    benefits: [
      { title: 'Higher product adoption', body: 'Clients use your software more effectively when they fully understand the training.' },
      { title: 'Reduce support tickets', body: 'Clear, native-language instruction prevents user confusion and reduces support load.' },
      { title: 'Global community building', body: 'Host user groups where clients from different countries can interact seamlessly.' }
    ],
    faqs: [
      { question: 'Do clients need to install anything?', answer: 'No, clients join directly from their browser with zero friction.' }
    ]
  },
  {
    path: 'src/pages/roles/sales-enablement-coaching.astro',
    title: 'Sales Enablement Video Coaching with AI',
    description: 'Train global sales reps simultaneously with AI-translated video coaching.',
    category: 'Roles',
    intro: 'VP of Sales need to roll out new messaging and playbooks fast. Ollasync ensures your sales enablement sessions reach every rep globally, instantly.',
    benefits: [
      { title: 'Faster playbook rollouts', body: 'Launch new products to your entire global sales force on the same day.' },
      { title: 'Consistent messaging', body: 'Ensure the value proposition is understood perfectly across all regions.' },
      { title: 'Interactive roleplay', body: 'Reps can practice pitches in their language while managers listen in theirs.' }
    ],
    faqs: [
      { question: 'Can this replace our current video tool?', answer: 'Yes, Ollasync provides all standard video conferencing features plus advanced AI translation.' }
    ]
  },
  // Integrations
  {
    path: 'src/pages/integrations/lms-video-translation.astro',
    title: 'LMS Integration with Live Translation Video',
    description: 'Plug Ollasync into Canvas, Blackboard, or Docebo for seamless multilingual training.',
    category: 'Integrations',
    intro: 'Your Learning Management System (LMS) is the hub of your training. Ollasync integrates directly to add live, translated virtual classrooms to your existing courses.',
    benefits: [
      { title: 'Seamless user experience', body: 'Learners join translated sessions directly from their LMS dashboard.' },
      { title: 'Automated data sync', body: 'Attendance and engagement data flows automatically back to your LMS.' },
      { title: 'Centralized content', body: 'Keep all your training materials and video sessions in one place.' }
    ],
    faqs: [
      { question: 'Which LMS platforms do you support?', answer: 'We support major platforms via LTI standards, including Canvas, Blackboard, and Docebo.' }
    ]
  },
  {
    path: 'src/pages/integrations/scorm-virtual-classroom.astro',
    title: 'SCORM Compliant Virtual Classroom Software',
    description: 'Enterprise-grade virtual classrooms that meet SCORM compliance standards.',
    category: 'Integrations',
    intro: 'Enterprise buyers require strict compliance for training modules. Ollasync provides a SCORM-compliant virtual classroom experience with built-in translation.',
    benefits: [
      { title: 'Enterprise compliance', body: 'Meet strict corporate and regulatory training standards.' },
      { title: 'Detailed reporting', body: 'Track completion rates, time spent, and interaction metrics.' },
      { title: 'Easy export', body: 'Export session data in SCORM-friendly formats for your records.' }
    ],
    faqs: [
      { question: 'Is the translation data included in reports?', answer: 'Yes, you can see which languages were utilized during the session.' }
    ]
  },
  {
    path: 'src/pages/integrations/ai-video-analytics.astro',
    title: 'AI Video Analytics for Training Engagement',
    description: 'Track who is paying attention and learning with advanced AI video analytics.',
    category: 'Integrations',
    intro: 'Stop guessing if your training is effective. Ollasync uses AI to provide deep analytics on learner engagement, comprehension, and participation.',
    benefits: [
      { title: 'Engagement scoring', body: 'See exactly when learners drop off or lose focus during a session.' },
      { title: 'Comprehension tracking', body: 'Analyze Q&A interactions to gauge understanding across different languages.' },
      { title: 'Actionable insights', body: 'Use data to improve your training materials and delivery.' }
    ],
    faqs: [
      { question: 'Is the analytics data private?', answer: 'Yes, all analytics are anonymized and aggregated to protect user privacy while providing actionable insights.' }
    ]
  },
  {
    path: 'src/pages/integrations/automated-attendance-tracking.astro',
    title: 'Automated Training Attendance Tracking Software',
    description: 'Solve compliance headaches with automated, foolproof attendance tracking.',
    category: 'Integrations',
    intro: 'Compliance officers waste hours manually verifying attendance. Ollasync automates the entire process, providing verifiable proof of presence for global training sessions.',
    benefits: [
      { title: 'Foolproof verification', body: 'Track active window presence and engagement, not just login status.' },
      { title: 'Instant reporting', body: 'Generate compliance-ready attendance reports the moment the session ends.' },
      { title: 'Multi-session tracking', body: 'Track attendance across multi-day global training events easily.' }
    ],
    faqs: [
      { question: 'Can reports be exported?', answer: 'Yes, reports can be exported to CSV, PDF, or synced directly to your HRIS.' }
    ]
  }
];

pages.forEach(page => {
  const content = `---
import SeoPage from '../../layouts/SeoPage.astro';
const benefits = ${JSON.stringify(page.benefits, null, 2)};
const faqs = ${JSON.stringify(page.faqs, null, 2)};
---
<SeoPage 
  title="${page.title}" 
  description="${page.description}" 
  category="${page.category}" 
  intro="${page.intro}" 
  benefits={benefits} 
  faqs={faqs} 
/>
`;
  fs.writeFileSync(page.path, content);
  console.log('Created: ' + page.path);
});
