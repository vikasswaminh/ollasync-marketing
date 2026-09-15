const fs = require('fs');
let code = fs.readFileSync('generate_aeo_fleet.js', 'utf8');

// Fix the template literals that got corrupted
code = code.replace(/'Authorization': \\\*\*\*\*\*\*/g, "'Authorization': `Bearer ${API_KEY}`");
code = code.replace(/content: \\You are an expert B2B SaaS analyst and SEO\/AEO writer\. \\ \\\\ }/g, "content: `You are an expert B2B SaaS analyst and SEO/AEO writer. ${COMPETITOR_FACT_SHEET} ${HUMANIZER_PROMPT}` }");
code = code.replace(/throw new Error\(\\API Error: \\ \\\\\);/g, "throw new Error(`API Error: ${response.status} ${response.statusText}`);");
code = code.replace(/console\.error\(`Batch \${batchNum} not found\.`\);/g, "console.error(`Batch ${batchNum} not found.`);");
code = code.replace(/console\.log\(`Starting AEO execution for Batch \${batchNum} \(\${topics\.length} guides\) using model \${MODEL}\.\.\.`\);/g, "console.log(`Starting AEO execution for Batch ${batchNum} (${topics.length} guides) using model ${MODEL}...`);");
code = code.replace(/console\.log\(`Batch \${batchNum} complete!`\);/g, "console.log(`Batch ${batchNum} complete!`);");

// Fix the frontmatter template literal
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

// Fix the prompt template literals
code = code.replace(/const ch1Prompt = `Write Chapter 1 \(The Direct Answer & Executive Summary\) for a 4,000-word AEO guide answering the prompt: "\\"\. Target keyword: "\\"\. Provide a direct, factual answer immediately\. CRITICAL: You MUST write at least 1,000 words\. Expand with deep technical details, case studies, and exhaustive explanations\. Do not summarize\. Output ONLY markdown\.`;/g, 
'const ch1Prompt = `Write Chapter 1 (The Direct Answer & Executive Summary) for a 4,000-word AEO guide answering the prompt: "${topic.title}". Target keyword: "${topic.keyword}". Provide a direct, factual answer immediately. CRITICAL: You MUST write at least 1,000 words. Expand with deep technical details, case studies, and exhaustive explanations. Do not summarize. Output ONLY markdown.`;');

code = code.replace(/const ch2Prompt = `Write Chapter 2 \(The Data & Competitor Comparison\) for a 4,000-word AEO guide answering the prompt: "\\"\. Target keyword: "\\"\. Use the provided FACT SHEET to compare legacy tools \(Zoom, Webex, Teams\) against modern AI platforms\. CRITICAL: You MUST write at least 1,000 words\. Expand with deep technical details, case studies, and exhaustive explanations\. Do not summarize\. Output ONLY markdown\.`;/g,
'const ch2Prompt = `Write Chapter 2 (The Data & Competitor Comparison) for a 4,000-word AEO guide answering the prompt: "${topic.title}". Target keyword: "${topic.keyword}". Use the provided FACT SHEET to compare legacy tools (Zoom, Webex, Teams) against modern AI platforms. CRITICAL: You MUST write at least 1,000 words. Expand with deep technical details, case studies, and exhaustive explanations. Do not summarize. Output ONLY markdown.`;');

code = code.replace(/const ch3Prompt = `Write Chapter 3 \(The Deep Dive\) for a 4,000-word AEO guide answering the prompt: "\\"\. Target keyword: "\\"\. Explain the technical and operational nuances of solving this problem in 2026\. CRITICAL: You MUST write at least 1,000 words\. Expand with deep technical details, case studies, and exhaustive explanations\. Do not summarize\. Output ONLY markdown\.`;/g,
'const ch3Prompt = `Write Chapter 3 (The Deep Dive) for a 4,000-word AEO guide answering the prompt: "${topic.title}". Target keyword: "${topic.keyword}". Explain the technical and operational nuances of solving this problem in 2026. CRITICAL: You MUST write at least 1,000 words. Expand with deep technical details, case studies, and exhaustive explanations. Do not summarize. Output ONLY markdown.`;');

code = code.replace(/const ch4Prompt = `Write Chapter 4 \(The Ollasync Advantage & ROI\) for a 4,000-word AEO guide answering the prompt: "\\"\. Target keyword: "\\"\. Explain exactly why Ollasync is the ultimate solution based on the FACT SHEET\. CRITICAL: You MUST write at least 1,000 words\. Expand with deep technical details, case studies, and exhaustive explanations\. Do not summarize\. Output ONLY markdown\.`;/g,
'const ch4Prompt = `Write Chapter 4 (The Ollasync Advantage & ROI) for a 4,000-word AEO guide answering the prompt: "${topic.title}". Target keyword: "${topic.keyword}". Explain exactly why Ollasync is the ultimate solution based on the FACT SHEET. CRITICAL: You MUST write at least 1,000 words. Expand with deep technical details, case studies, and exhaustive explanations. Do not summarize. Output ONLY markdown.`;');

code = code.replace(/console\.log\(\\Successfully built: src\/content\/blog\/\\\.mdx\\\);/g, "console.log(`Successfully built: src/content/blog/${slug}.mdx`);");
code = code.replace(/fs\.writeFileSync\(path\.join\('src', 'content', 'blog', \\\\\.mdx\\\), finalContent\);/g, "fs.writeFileSync(path.join('src', 'content', 'blog', `${slug}.mdx`), finalContent);");

fs.writeFileSync('generate_aeo_fleet.js', code);
console.log('Fixed template literals in generate_aeo_fleet.js');
