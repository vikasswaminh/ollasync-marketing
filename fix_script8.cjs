const fs = require('fs');

let content = fs.readFileSync('generate_aeo_fleet.js', 'utf8');

let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("'Authorization':")) {
        lines[i] = "        'Authorization': `Bearer ${API_KEY}`";
    }
}

fs.writeFileSync('generate_aeo_fleet.js', lines.join('\n'));
console.log('Fixed generate_aeo_fleet.js');
