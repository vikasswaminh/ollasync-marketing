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
    if (currentBatch >= 5) newBatches[currentBatch] = [];
    continue;
  }
  if (currentBatch >= 5 && line.match(/^\d+\.\s+(.*)/)) {
    const title = line.match(/^\d+\.\s+(.*)/)[1].trim();
    const keyword = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(' ').slice(0, 4).join(' ');
    newBatches[currentBatch].push({ title, keyword, category: currentCategory });
  }
}
let newBatchesStr = '';
for (let i = 5; i <= 10; i++) {
  newBatchesStr += ',\n  ' + i + ': [\n';
  newBatchesStr += newBatches[i].map(t => '    { title: \'' + t.title.replace(/'/g, "\\'") + '\', keyword: \'' + t.keyword + '\', category: \'' + t.category + '\' }').join(',\n');
  newBatchesStr += '\n  ]';
}

let fleetCode = fs.readFileSync('generate_seo_fleet.js', 'utf8');
const batchesEndIndex = fleetCode.indexOf('  4: [');
let closingBraceIndex = fleetCode.indexOf('};', batchesEndIndex);
if (closingBraceIndex === -1) {
    closingBraceIndex = fleetCode.indexOf('}', fleetCode.indexOf(']', batchesEndIndex));
}

const updatedCode = fleetCode.substring(0, closingBraceIndex) + newBatchesStr + '\n' + fleetCode.substring(closingBraceIndex);
fs.writeFileSync('generate_seo_fleet.js', updatedCode);
console.log('Added Batches 5-10 to generate_seo_fleet.js');
