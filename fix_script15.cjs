const fs = require('fs');

let content = fs.readFileSync('generate_aeo_fleet.js', 'utf8');

let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const MODEL = 'gemini-3.8-flash-high';")) {
        lines[i] = "const MODEL = 'gemini-3.7-flash-high';";
    }
}

fs.writeFileSync('generate_aeo_fleet.js', lines.join('\n'));
console.log('Fixed generate_aeo_fleet.js');
