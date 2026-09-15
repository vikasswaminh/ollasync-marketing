const fs = require('fs');
let code = fs.readFileSync('generate_aeo_fleet.js', 'utf8');
code = code.replace(/'Authorization': \\\*\*\*\*\*\*/g, "'Authorization': `Bearer ${API_KEY}`");
fs.writeFileSync('generate_aeo_fleet.js', code);
