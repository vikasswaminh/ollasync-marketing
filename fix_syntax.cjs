const fs = require('fs');
let code = fs.readFileSync('generate_aeo_fleet.js', 'utf8');

// Fix the backticks that got replaced with backslashes
code = code.replace(/const COMPETITOR_FACT_SHEET = \\/g, 'const COMPETITOR_FACT_SHEET = `');
code = code.replace(/\\;/g, '`;');
code = code.replace(/const HUMANIZER_PROMPT = \\/g, 'const HUMANIZER_PROMPT = `');

// Fix the prompt strings that got messed up
code = code.replace(/const ch1Prompt = \\Write/g, 'const ch1Prompt = `Write');
code = code.replace(/const ch2Prompt = \\Write/g, 'const ch2Prompt = `Write');
code = code.replace(/const ch3Prompt = \\Write/g, 'const ch3Prompt = `Write');
code = code.replace(/const ch4Prompt = \\Write/g, 'const ch4Prompt = `Write');

code = code.replace(/Output ONLY markdown\.\\;/g, 'Output ONLY markdown.`;');

fs.writeFileSync('generate_aeo_fleet.js', code);
console.log('Fixed syntax errors in generate_aeo_fleet.js');
