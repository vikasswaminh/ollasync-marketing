const fs = require('fs');
let code = fs.readFileSync('generate_aeo_fleet.js', 'utf8');
code = code.replace(/\\(\*+)/g, '`Bearer ${API_KEY}`');
code = code.replace(/\\You are an expert B2B SaaS analyst and SEO\/AEO writer\. \\ \\\\ /g, '`You are an expert B2B SaaS analyst and SEO/AEO writer. ${COMPETITOR_FACT_SHEET} ${HUMANIZER_PROMPT}`');
code = code.replace(/\\API Error: \\ \\\\/g, '`API Error: ${response.status} ${response.statusText}`');
code = code.replace(/\\Successfully built: src\/content\/blog\/\\\.mdx\\/g, '`Successfully built: src/content/blog/${slug}.mdx`');
code = code.replace(/\\\\\.mdx\\/g, '`${slug}.mdx`');
fs.writeFileSync('generate_aeo_fleet.js', code);
