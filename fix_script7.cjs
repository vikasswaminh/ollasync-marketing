const fs = require('fs');

let content = fs.readFileSync('generate_aeo_fleet.js', 'utf8');

// Use a regular expression to match the exact string, escaping the backslash and asterisks
content = content.replace(/'Authorization': \\\\\\*\\*\\*\\*\\*\\*/g, "'Authorization': `Bearer ${API_KEY}`");

fs.writeFileSync('generate_aeo_fleet.js', content);
console.log('Fixed generate_aeo_fleet.js');
