const fs = require('fs');
let code = fs.readFileSync('generate_aeo_fleet.js', 'utf8');
code = code.replace(/&lt;\\/g, '&lt;$1');
fs.writeFileSync('generate_aeo_fleet.js', code);
