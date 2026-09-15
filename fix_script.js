const fs = require('fs');

let content = fs.readFileSync('generate_aeo_fleet.js', 'utf8');

// Fix the backticks that were corrupted into backslashes
content = content.replace(/const COMPETITOR_FACT_SHEET = \\\\/g, 'const COMPETITOR_FACT_SHEET = `');
content = content.replace(/const HUMANIZER_PROMPT = \\\\/g, 'const HUMANIZER_PROMPT = `');
content = content.replace(/\\\\;/g, '`;');
content = content.replace(/'Authorization': \\\\\\*\\\\*\\\\*\\\\*\\\\*\\\\*/g, "'Authorization': `Bearer ${API_KEY}`");
content = content.replace(/content: \\\\You are an expert B2B SaaS analyst and SEO\\/AEO writer\\. \\\\ \\\\\\\\/g, "content: `You are an expert B2B SaaS analyst and SEO/AEO writer. ` \\\\");
content = content.replace(/throw new Error\\(\\\\API Error: \\\\ \\\\\\\\\\)/g, "throw new Error(`API Error: ${response.statusText}`)");

// More general fixes for backticks that might have been replaced by backslashes
content = content.replace(/const COMPETITOR_FACT_SHEET = \\\\/g, 'const COMPETITOR_FACT_SHEET = `');
content = content.replace(/const HUMANIZER_PROMPT = \\\\/g, 'const HUMANIZER_PROMPT = `');

// Let's just read the file and do a more robust replacement
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const COMPETITOR_FACT_SHEET = \\')) {
        lines[i] = lines[i].replace('const COMPETITOR_FACT_SHEET = \\', 'const COMPETITOR_FACT_SHEET = `');
    }
    if (lines[i].includes('const HUMANIZER_PROMPT = \\')) {
        lines[i] = lines[i].replace('const HUMANIZER_PROMPT = \\', 'const HUMANIZER_PROMPT = `');
    }
    if (lines[i].trim() === '\\;') {
        lines[i] = lines[i].replace('\\;', '`;');
    }
    if (lines[i].includes("'Authorization': \\*****\\")) {
        lines[i] = lines[i].replace("'Authorization': \\*****\\", "'Authorization': `Bearer ${API_KEY}`");
    }
    if (lines[i].includes("content: \\You are an expert B2B SaaS analyst and SEO/AEO writer. \\ \\\\")) {
        lines[i] = lines[i].replace("content: \\You are an expert B2B SaaS analyst and SEO/AEO writer. \\ \\\\", "content: `You are an expert B2B SaaS analyst and SEO/AEO writer. \n");
    }
    if (lines[i].includes("throw new Error(\\API Error: \\ \\\\)")) {
        lines[i] = lines[i].replace("throw new Error(\\API Error: \\ \\\\)", "throw new Error(`API Error: ${response.statusText}`)");
    }
}

fs.writeFileSync('generate_aeo_fleet.js', lines.join('\n'));
console.log('Fixed generate_aeo_fleet.js');
