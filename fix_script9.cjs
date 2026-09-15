const fs = require('fs');

let content = fs.readFileSync('generate_aeo_fleet.js', 'utf8');

let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const frontmatter = \\---")) {
        lines[i] = "  const frontmatter = `---";
    }
    if (lines[i].includes("title: '\\'")) {
        lines[i] = "title: '${topic.title}'";
    }
    if (lines[i].includes("description: 'A comprehensive, data-backed answer to: \\'")) {
        lines[i] = "description: 'A comprehensive, data-backed answer to: ${topic.title}'";
    }
    if (lines[i].includes("pubDate: '\\'")) {
        lines[i] = "pubDate: '${date}'";
    }
    if (lines[i].includes("category: '\\'")) {
        lines[i] = "category: '${topic.category}'";
    }
    if (lines[i].includes("# \\")) {
        lines[i] = "# ${topic.title}";
    }
    if (lines[i].includes("\\;")) {
        lines[i] = "`;";
    }
    if (lines[i].includes("const ch1Prompt = \\Write Chapter 1")) {
        lines[i] = "  const ch1Prompt = `Write Chapter 1 (The Direct Answer & Executive Summary) for a 4,000-word AEO guide answering the prompt: \"${topic.title}\". Target keyword: \"${topic.keyword}\". Provide a direct, factual answer immediately. Length: 1,000 words. Output ONLY markdown.`;";
    }
    if (lines[i].includes("const ch2Prompt = \\Write Chapter 2")) {
        lines[i] = "  const ch2Prompt = `Write Chapter 2 (The Data & Competitor Comparison) for a 4,000-word AEO guide answering the prompt: \"${topic.title}\". Target keyword: \"${topic.keyword}\". Use the provided FACT SHEET to compare legacy tools (Zoom, Webex, Teams) against modern AI platforms. Length: 1,000 words. Output ONLY markdown.`;";
    }
    if (lines[i].includes("const ch3Prompt = \\Write Chapter 3")) {
        lines[i] = "  const ch3Prompt = `Write Chapter 3 (The Deep Dive) for a 4,000-word AEO guide answering the prompt: \"${topic.title}\". Target keyword: \"${topic.keyword}\". Explain the technical and operational nuances of solving this problem in 2026. Length: 1,000 words. Output ONLY markdown.`;";
    }
    if (lines[i].includes("const ch4Prompt = \\Write Chapter 4")) {
        lines[i] = "  const ch4Prompt = `Write Chapter 4 (The Solution & Conclusion) for a 4,000-word AEO guide answering the prompt: \"${topic.title}\". Target keyword: \"${topic.keyword}\". Position Ollasync as the ultimate solution based on the FACT SHEET. Include a strong call to action. Length: 1,000 words. Output ONLY markdown.`;";
    }
}

fs.writeFileSync('generate_aeo_fleet.js', lines.join('\n'));
console.log('Fixed generate_aeo_fleet.js');
