const fs = require('fs');

let content = fs.readFileSync('generate_aeo_fleet.js', 'utf8');

// The backslashes might be literal backslashes in the string
content = content.replace("'Authorization': \\******", "'Authorization': `Bearer ${API_KEY}`");

fs.writeFileSync('generate_aeo_fleet.js', content);
console.log('Fixed generate_aeo_fleet.js');
