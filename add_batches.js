const fs = require('fs');

const plan = fs.readFileSync('MARKETING_SEO_PLAN.md', 'utf8');
const lines = plan.split('\n');

const newBatches = {};
let currentBatch = null;
let currentCategory = '';

for (const line of lines) {
  const batchMatch = line.match(/### Batch (\d+): (.*) \(\d+ items\)/);
  if (batchMatch) {
    currentBatch = parseInt(batchMatch[1]);
    currentCategory = batchMatch[2].split(' Part')[0].trim();
    if (currentBatch >= 5) {
      newBatches[currentBatch] = [];
    }
    continue;
  }
  
  if (currentBatch >= 5 && line.match(/^\d+\.\s+(.*)/)) {
    const title = line.match(/^\d+\.\s+(.*)/)[1].trim();
    // Generate a simple keyword from the title
    const keyword = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(' ').slice(0, 4).join(' ');
    newBatches[currentBatch].push({
      title,
      keyword,
      category: currentCategory
    });
  }
}

let fleetCode = fs.readFileSync('generate_seo_fleet.js', 'utf8');

// Find the end of the batches object
const batchesEndIndex = fleetCode.indexOf('  4: [');
if (batchesEndIndex === -1) {
  console.error('Could not find Batch 4 in generate_seo_fleet.js');
  process.exit(1);
}

// Find the closing brace of the batches object
let closingBraceIndex = fleetCode.indexOf('};', batchesEndIndex);
if (closingBraceIndex === -1) {
    // It might be just } without semicolon
    closingBraceIndex = fleetCode.indexOf('}', fleetCode.indexOf(']', batchesEndIndex));
}

let newBatchesStr = '';
for (let i = 5; i <= 10; i++) {
  newBatchesStr += ',\n  ' + i + ': [\n';
  newBatchesStr += newBatches[i].map(t =>     { title: '', keyword: '', category: '' }).join(',\n');
  newBatchesStr += '\n  ]';
}

const updatedCode = fleetCode.substring(0, closingBraceIndex) + newBatchesStr + '\n' + fleetCode.substring(closingBraceIndex);

fs.writeFileSync('generate_seo_fleet.js', updatedCode);
console.log('Added Batches 5-10 to generate_seo_fleet.js');
