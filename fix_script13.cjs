const fs = require('fs');

let content = fs.readFileSync('generate_aeo_fleet.js', 'utf8');

let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '`;' && i === 198) {
        lines[i] = "";
    }
    if (lines[i].includes("const ch3Prompt = `Write Chapter 3")) {
        lines.splice(i + 1, 0, "  const ch4Prompt = `Write Chapter 4 (The Solution & Conclusion) for a 4,000-word AEO guide answering the prompt: \"${topic.title}\". Target keyword: \"${topic.keyword}\". Position Ollasync as the ultimate solution based on the FACT SHEET. Include a strong call to action. Length: 1,000 words. Output ONLY markdown.`;");
        break;
    }
}

fs.writeFileSync('generate_aeo_fleet.js', lines.join('\n'));
console.log('Fixed generate_aeo_fleet.js');
