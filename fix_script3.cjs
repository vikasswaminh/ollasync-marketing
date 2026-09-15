const fs = require('fs');

let content = fs.readFileSync('generate_aeo_fleet.js', 'utf8');

content = content.replace(/'Authorization': \\\*\*\*\*\*\*/g, "'Authorization': `Bearer ${API_KEY}`");
content = content.replace(/content: `You are an expert B2B SaaS analyst and SEO\/AEO writer\. ` \+\\ },/g, "content: `You are an expert B2B SaaS analyst and SEO/AEO writer. ` },");
content = content.replace(/throw new Error\(\\API Error: \\ \\\\\);/g, "throw new Error(`API Error: ${response.statusText}`);");

fs.writeFileSync('generate_aeo_fleet.js', content);
console.log('Fixed generate_aeo_fleet.js');
