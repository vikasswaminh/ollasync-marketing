const fs = require('fs');
let code = fs.readFileSync('generate_aeo_fleet.js', 'utf8');
code = code.replace(/const COMPETITOR_FACT_SHEET = \\/g, 'const COMPETITOR_FACT_SHEET = `');
code = code.replace(/const HUMANIZER_PROMPT = \\/g, 'const HUMANIZER_PROMPT = `');
code = code.replace(/\\;/g, '`;');
code = code.replace(/&lt;\\/g, '&lt;$1');
code = code.replace(/'Authorization': \\\*\*\*\*\*\*/g, "'Authorization': `Bearer ${API_KEY}`");
code = code.replace(/content: \\You are an expert B2B SaaS analyst and SEO\/AEO writer\. \\ \\\\ }/g, "content: `You are an expert B2B SaaS analyst and SEO/AEO writer. ${COMPETITOR_FACT_SHEET} ${HUMANIZER_PROMPT}` }");
code = code.replace(/throw new Error\(\\API Error: \\ \\\\\);/g, "throw new Error(`API Error: ${response.status} ${response.statusText}`);");
code = code.replace(/console\.error\(`Batch \${batchNum} not found\.`\);/g, "console.error(`Batch ${batchNum} not found.`);");
code = code.replace(/console\.log\(`Starting AEO execution for Batch \${batchNum} \(\${topics\.length} guides\) using model \${MODEL}\.\.\.`\);/g, "console.log(`Starting AEO execution for Batch ${batchNum} (${topics.length} guides) using model ${MODEL}...`);");
code = code.replace(/console\.log\(`Batch \${batchNum} complete!`\);/g, "console.log(`Batch ${batchNum} complete!`);");

code = code.replace(/const frontmatter = \\---\ntitle: '\\'\ndescription: 'A comprehensive, data-backed answer to: '\\'\npubDate: '\\'\nheroImage: '\/blog-placeholder-1\.jpg'\ncategory: '\\'\n---\n\n# \\\n\n\\;/g, 
`const frontmatter = \`---
title: '\${topic.title.replace(/'/g, "''")}'
description: 'A comprehensive, data-backed answer to: \${topic.title.replace(/'/g, "''")}'
pubDate: '\${date}'
heroImage: '/blog-placeholder-1.jpg'
category: '\${topic.category}'
---

# \${topic.title}

\`;`);

code = code.replace(/const ch1Prompt = \\Write/g, 'const ch1Prompt = `Write');
code = code.replace(/const ch2Prompt = \\Write/g, 'const ch2Prompt = `Write');
code = code.replace(/const ch3Prompt = \\Write/g, 'const ch3Prompt = `Write');
code = code.replace(/const ch4Prompt = \\Write/g, 'const ch4Prompt = `Write');
code = code.replace(/Output ONLY markdown\.\\;/g, 'Output ONLY markdown.`;');

code = code.replace(/console\.log\(\\Successfully built: src\/content\/blog\/\\\.mdx\\\);/g, "console.log(`Successfully built: src/content/blog/${slug}.mdx`);");
code = code.replace(/fs\.writeFileSync\(path\.join\('src', 'content', 'blog', \\\\\.mdx\\\), finalContent\);/g, "fs.writeFileSync(path.join('src', 'content', 'blog', `${slug}.mdx`), finalContent);");

fs.writeFileSync('generate_aeo_fleet.js', code);
