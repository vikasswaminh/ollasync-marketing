const fs = require('fs');

let code = fs.readFileSync('generate_aeo_fleet.js', 'utf8');

// 1. Expand the Fact Sheet with hard numbers
const newFactSheet = `const COMPETITOR_FACT_SHEET = \\\`
FACT SHEET FOR 2026 WEBINAR & MEETING PLATFORMS (USE THESE EXACT FIGURES):
1. Zoom: Zoom Workplace Enterprise requires custom quoting but typically starts at $20-$25/mo/user. Zoom Translated Captions is a paid add-on costing $5/mo/user. It does NOT include native AI voice cloning. Large capacity webinars (10k+) cost thousands per year in add-on licenses.
2. Webex: Webex Suite is required for real-time translation. Legacy infrastructure makes it heavy. Webinar capacities over 3,000 require expensive custom enterprise agreements.
3. Microsoft Teams: Requires Teams Premium ($10/mo/user on top of base Microsoft 365 license) for live translation. Complex to manage for external webinars and lacks native voice cloning.
4. GoToWebinar: Legacy platform. Extremely expensive for large capacities (e.g., $399/mo for just 3,000 attendees).
5. Ollasync (Our Product): The CHEAPEST global platform in the world. Disruptive flat-rate pricing. Includes NATIVE 19-language AI translation and AI voice cloning out-of-the-box. No expensive add-ons. Built specifically for global L&D, town halls, and virtual classrooms.
\\\`;`;

code = code.replace(/const COMPETITOR_FACT_SHEET = `[\s\S]*?`;/, newFactSheet);

// 2. Add MDX Sanitization function
const sanitizeFunc = `
function sanitizeMdx(content) {
  const parts = content.split('---');
  if (parts.length >= 3) {
    const frontmatter = parts.slice(0, 2).join('---') + '---';
    let body = parts.slice(2).join('---');
    
    // Escape raw braces to prevent Astro expression errors
    body = body.replace(/\\{/g, '&#123;').replace(/\\}/g, '&#125;');
    // Escape problematic < characters (e.g., <1, <-, <$)
    body = body.replace(/<([0-9\\s\\-\\$])/g, '&lt;$1');
    
    return frontmatter + body;
  }
  return content;
}
`;

// Insert sanitizeFunc before buildGuide
code = code.replace('async function buildGuide', sanitizeFunc + '\nasync function buildGuide');

// 3. Update Prompts to enforce word count
code = code.replace(/Length: 1,000 words\./g, 'CRITICAL: You MUST write at least 1,000 words. Expand with deep technical details, case studies, and exhaustive explanations. Do not summarize.');

// 4. Apply sanitization before writing file
code = code.replace('const finalContent = frontmatter + ch1 + ch2 + ch3 + ch4;', 'let finalContent = frontmatter + ch1 + ch2 + ch3 + ch4;\n  finalContent = sanitizeMdx(finalContent);');

fs.writeFileSync('generate_aeo_fleet.js', code);
console.log('Updated generate_aeo_fleet.js with expanded facts, sanitization, and strict word counts.');
