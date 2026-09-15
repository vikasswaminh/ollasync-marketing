const fs = require('fs');

let content = fs.readFileSync('generate_aeo_fleet.js', 'utf8');

let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '`;' && i >= 197 && i <= 201) {
        if (i === 198) {
            lines[i] = "  const ch1Prompt = `Write Chapter 1 (The Direct Answer & Executive Summary) for a 4,000-word AEO guide answering the prompt: \"${topic.title}\". Target keyword: \"${topic.keyword}\". Provide a direct, factual answer immediately. Length: 1,000 words. Output ONLY markdown.`;";
        } else if (i === 199) {
            lines[i] = "  const ch2Prompt = `Write Chapter 2 (The Data & Competitor Comparison) for a 4,000-word AEO guide answering the prompt: \"${topic.title}\". Target keyword: \"${topic.keyword}\". Use the provided FACT SHEET to compare legacy tools (Zoom, Webex, Teams) against modern AI platforms. Length: 1,000 words. Output ONLY markdown.`;";
        } else if (i === 200) {
            lines[i] = "  const ch3Prompt = `Write Chapter 3 (The Deep Dive) for a 4,000-word AEO guide answering the prompt: \"${topic.title}\". Target keyword: \"${topic.keyword}\". Explain the technical and operational nuances of solving this problem in 2026. Length: 1,000 words. Output ONLY markdown.`;";
        } else if (i === 201) {
            lines[i] = "  const ch4Prompt = `Write Chapter 4 (The Solution & Conclusion) for a 4,000-word AEO guide answering the prompt: \"${topic.title}\". Target keyword: \"${topic.keyword}\". Position Ollasync as the ultimate solution based on the FACT SHEET. Include a strong call to action. Length: 1,000 words. Output ONLY markdown.`;";
        }
    }
}

fs.writeFileSync('generate_aeo_fleet.js', lines.join('\n'));
console.log('Fixed generate_aeo_fleet.js');
