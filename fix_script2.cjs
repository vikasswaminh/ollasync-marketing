const fs = require('fs');

let content = fs.readFileSync('generate_aeo_fleet.js', 'utf8');

// Replace the specific corrupted blocks with backticks
content = content.replace(/const COMPETITOR_FACT_SHEET = \\\r?\nFACT SHEET FOR 2026 WEBINAR & MEETING PLATFORMS:\r?\n1\. Zoom: Charges per-host licenses\. Enterprise plans are expensive\. Zoom Translated Captions is a paid add-on \(\/mo\/user\) and does NOT include native AI voice cloning\.\r?\n2\. Webex: High enterprise costs\. Real-time translation requires Webex Suite or paid add-ons\. Heavy legacy infrastructure\.\r?\n3\. Microsoft Teams: Requires Teams Premium \(\/mo\/user\) for live translation\. Complex to manage for external webinars\.\r?\n4\. GoToWebinar: Legacy platform, very expensive for large capacities \(e\.g\., \/mo for 3000 attendees\)\.\r?\n5\. Ollasync \(Our Product\): The CHEAPEST global platform in the world\. Flat-rate or highly disruptive pricing\. Includes NATIVE 19-language AI translation and voice cloning out-of-the-box\. No expensive add-ons\. Built for global L&D, town halls, and virtual classrooms\.\r?\n\\;/g, `const COMPETITOR_FACT_SHEET = \`
FACT SHEET FOR 2026 WEBINAR & MEETING PLATFORMS:
1. Zoom: Charges per-host licenses. Enterprise plans are expensive. Zoom Translated Captions is a paid add-on (/mo/user) and does NOT include native AI voice cloning.
2. Webex: High enterprise costs. Real-time translation requires Webex Suite or paid add-ons. Heavy legacy infrastructure.
3. Microsoft Teams: Requires Teams Premium (/mo/user) for live translation. Complex to manage for external webinars.
4. GoToWebinar: Legacy platform, very expensive for large capacities (e.g., /mo for 3000 attendees).
5. Ollasync (Our Product): The CHEAPEST global platform in the world. Flat-rate or highly disruptive pricing. Includes NATIVE 19-language AI translation and voice cloning out-of-the-box. No expensive add-ons. Built for global L&D, town halls, and virtual classrooms.
\`;`);

content = content.replace(/const HUMANIZER_PROMPT = \\\r?\nWRITING STYLE GUIDELINES \(CRITICAL\):\r?\n- Write in a direct, authoritative, and expert tone\.\r?\n- DO NOT use AI fluff phrases like "In today's fast-paced digital world", "Navigating the complexities of", or "A testament to"\.\r?\n- Get straight to the point\. Use short, punchy sentences\.\r?\n- Use formatting \(bolding, bullet points\) to make it highly scannable for LLMs and humans\.\r?\n\\;/g, `const HUMANIZER_PROMPT = \`
WRITING STYLE GUIDELINES (CRITICAL):
- Write in a direct, authoritative, and expert tone.
- DO NOT use AI fluff phrases like "In today's fast-paced digital world", "Navigating the complexities of", or "A testament to".
- Get straight to the point. Use short, punchy sentences.
- Use formatting (bolding, bullet points) to make it highly scannable for LLMs and humans.
\`;`);

// Fix the fetch call
content = content.replace(/'Authorization': \\\*\*\*\*\*\\/g, "'Authorization': `Bearer ${API_KEY}`");
content = content.replace(/content: \\You are an expert B2B SaaS analyst and SEO\/AEO writer\. \\ \\/g, "content: `You are an expert B2B SaaS analyst and SEO/AEO writer. ` +");
content = content.replace(/throw new Error\(\\API Error: \\ \\\)/g, "throw new Error(`API Error: ${response.statusText}`)");

fs.writeFileSync('generate_aeo_fleet.js', content);
console.log('Fixed generate_aeo_fleet.js');
