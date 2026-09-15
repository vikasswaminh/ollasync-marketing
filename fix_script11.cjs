const fs = require('fs');

let content = fs.readFileSync('generate_aeo_fleet.js', 'utf8');

let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("console.error(\\Batch \\ not found.\\);")) {
        lines[i] = "    console.error(`Batch ${batchNum} not found.`);";
    }
    if (lines[i].includes("console.log(\\Starting AEO execution for Batch \\ (\\ guides) using model \\...\\);")) {
        lines[i] = "  console.log(`Starting AEO execution for Batch ${batchNum} (${topics.length} guides) using model ${MODEL}...`);";
    }
    if (lines[i].includes("console.log(\\Batch \\ complete!\\);")) {
        lines[i] = "  console.log(`Batch ${batchNum} complete!`);";
    }
}

fs.writeFileSync('generate_aeo_fleet.js', lines.join('\n'));
console.log('Fixed generate_aeo_fleet.js');
